import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI extraction isn't configured yet" }, { status: 500 });
  }

  const { pdfBase64 } = await req.json();
  if (!pdfBase64) {
    return NextResponse.json({ error: "Missing PDF data" }, { status: 400 });
  }

  const prompt = `Extract this business coaching quarterly plan into strict JSON, and nothing else — no markdown fences, no preamble, no commentary.

Return exactly this shape:
{
  "quarterLabel": string (e.g. "Q3 2026"),
  "startDate": string or null (ISO date, e.g. "2026-07-13"),
  "endDate": string or null (ISO date),
  "advisorName": string or null,
  "sections": [
    {
      "businessName": string,
      "theme": string or null (a single short word like "OPEN", "BUILD", "GROWTH"),
      "themeDescription": string or null (the paragraph explaining the theme),
      "recommendations": string or null (each recommendation on its own line, formatted as "Title: description"),
      "kpis": [ { "name": string, "value": string or null } ],
      "projects": [
        {
          "name": string,
          "outcome": string,
          "keyApproach": string (each bullet on its own line, no bullet characters),
          "measures": string (each bullet on its own line, no bullet characters),
          "month1Label": string or null,
          "month2Label": string or null,
          "month3Label": string or null
        }
      ]
    }
  ]
}

There should be one section per business covered in the document. Preserve the actual wording from the document as closely as possible rather than summarizing it further.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Extraction failed: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || []).map((b: any) => b.text || "").join("");

    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Couldn't parse what Claude returned as JSON — try again or enter it manually" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected error: ${e.message}` }, { status: 500 });
  }
}
