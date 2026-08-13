import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroList — AI-Powered Product Listings for Amazon, Etsy, Shopify & eBay",
  description: "Generate optimized product listings for multiple e-commerce platforms in seconds. Amazon, Etsy, Shopify, eBay — all platform rules enforced automatically.",
  openGraph: {
    title: "ZeroList — AI Product Listing Generator",
    description: "Turn your product details into perfectly optimized listings for Amazon, Etsy, Shopify & eBay.",
    url: "https://zerolist.studiozerohq.com",
    siteName: "ZeroList"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
