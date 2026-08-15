import type { Metadata } from "next";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import "./globals.css";

const SITE_URL = "https://sports-betting-web.vercel.app";
const TITLE = "Sports Betting Scanner";
const DESCRIPTION =
  "Password-gated +EV scanner comparing Kalshi and Polymarket prices against de-vigged sportsbook odds across MLB, NBA, WNBA, NFL, EPL, and MLS.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Sports Betting Scanner",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Sports Betting Scanner",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: "/icon.png",
  },
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
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
