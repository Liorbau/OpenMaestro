import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader, Wix_Madefor_Text } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif for the Maestro wordmark (the brand mark's typeface).
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

// Brand body font used on the landing hero.
const wixMadefor = Wix_Madefor_Text({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenMaestro",
  description:
    "An open, $0-cost AI tutor that runs entirely on your device — learn anywhere, even offline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${wixMadefor.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
