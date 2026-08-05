import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Betting Scanner",
  description: "+EV scanner comparing Kalshi & Polymarket prices against de-vigged sportsbook consensus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
