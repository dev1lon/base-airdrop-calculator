import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$BASE Airdrop Calculator",
  description: "Estimate a hypothetical $BASE airdrop using Arbitrum's legendary scoring rubric.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="stars" />
        {children}
      </body>
    </html>
  );
}
