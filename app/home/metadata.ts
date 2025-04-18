import { Metadata } from "next";

export const metadata: Metadata = {
  title: "420.nyc – Munchies, Thoughts & Events",
  description:
    "Live map of late-night eats, stoner thoughts, and 4/20 events around NYC.",
  openGraph: {
    title: "420.nyc – Munchies, Thoughts & Events",
    description:
      "Live map of late-night eats, stoner thoughts, and 4/20 events around NYC.",
    type: "website",
    url: "https://fourtwenty.nyc/home",
    images: [
      {
        url: "https://fourtwenty.nyc/og-image.png",
        width: 1200,
        height: 630,
        alt: "420.nyc screenshot showing the app interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "420.nyc – Munchies, Thoughts & Events",
    description:
      "Live map of late-night eats, stoner thoughts, and 4/20 events around NYC.",
    images: ["https://fourtwenty.nyc/twitter-image.png"],
  },
};
