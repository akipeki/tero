import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { criticalFrames } from "@/game/render/sprites/PlayerSpriteAssets";
import { GAME_FULL_TITLE } from "@/game/title";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

export const metadata: Metadata = {
  title: GAME_FULL_TITLE,
  description: "A retro pixel platformer: a baby dragon storms his dad's office to bring him home.",
};

// Critical player frames — preload so the very first PLAY tap doesn't pop in.
const PRELOAD = criticalFrames;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pressStart.variable} h-full antialiased`}>
      <head>
        {PRELOAD.map((href) => (
          <link key={href} rel="preload" as="image" href={href} />
        ))}
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
