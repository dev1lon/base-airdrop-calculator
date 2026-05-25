import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://base-airdrop-calculator.vercel.app"),
  title: "$BASE Airdrop Calculator",
  description: "Estimate a hypothetical $BASE airdrop using Arbitrum's legendary airdrop scoring.",
  openGraph: {
    type: "website",
    title: "$BASE Airdrop Calculator",
    description: "Estimate a hypothetical $BASE airdrop using Arbitrum's legendary airdrop scoring.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "$BASE Airdrop Calculator eligibility estimate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "$BASE Airdrop Calculator",
    description: "Estimate a hypothetical $BASE airdrop using Arbitrum's legendary airdrop scoring.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-bg" />
        {children}
      </body>
    </html>
  );
}
