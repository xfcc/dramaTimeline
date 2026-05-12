import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "华夏剧典",
  description: "以时间/朝代为锚点的国产历史剧可视化索引引擎。",
  applicationName: "华夏剧典",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "华夏剧典",
    description: "以时间/朝代为锚点的国产历史剧可视化索引引擎。",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
