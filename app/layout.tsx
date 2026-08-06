import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Betting Scanner",
  description: "+EV scanner comparing Kalshi & Polymarket prices against de-vigged sportsbook consensus.",
};

const THEME_SCRIPT = `
(function () {
  try {
    var valid = ["dark", "light", "vegas", "field"];
    var saved = localStorage.getItem("sbw-theme");
    var theme = valid.indexOf(saved) !== -1 ? saved : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
