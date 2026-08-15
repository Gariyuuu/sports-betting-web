import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sports-betting-web.vercel.app";

// "/" is disallowed because it's the password-gated dashboard (redirects to
// /login for anyone unauthenticated, i.e. every crawler). The three Allow
// rules below are more specific path prefixes, so per the robots.txt spec
// (longest-matching-rule wins) they carve out exceptions: the login page
// itself, the public changelog, and this app's own OG card route.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/", "/api/"],
      allow: ["/login", "/changelog", "/opengraph-image"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
