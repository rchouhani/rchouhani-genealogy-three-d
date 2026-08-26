import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Next.js processes global CSS imports, but TypeScript has no declaration for this stylesheet.
// @ts-expect-error -- CSS is handled by Next.js during the build.
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genealogy3D",
  description: "Visualisation 3D de votre arbre généalogique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
