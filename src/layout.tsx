import type { Metadata } from "next";
import { Montserrat, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const montserratDisplay = Montserrat({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["800"],
});
const montserratBody = Montserrat({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Provider Pro",
  description: "Your partner in business success — notes, sessions, wins, and resources in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${montserratDisplay.variable} ${montserratBody.variable} ${plexMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
