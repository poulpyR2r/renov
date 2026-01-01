import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/l/",
          "/maisons-a-renover/",
          "/guides/",
        ],
        disallow: [
          "/admin",
          "/agency",
          "/profile",
          "/submit",
          "/favorites",
          "/alerts",
          "/login",
          "/register",
          "/change-password",
          "/api",
          "/stripe",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
