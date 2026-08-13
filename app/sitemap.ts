import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sports-betting-web.vercel.app";

// "/" is intentionally excluded -- it server-redirects to /login unless a
// valid sbw_auth cookie is present (app/page.tsx), so it's not a public
// entity route. Only the two genuinely unauthenticated pages are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/login`, lastModified: new Date() },
    { url: `${SITE_URL}/changelog`, lastModified: new Date() },
  ];
}
