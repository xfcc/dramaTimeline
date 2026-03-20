import type { Metadata } from "next";

import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drama Timeline 管理后台",
  description: "历史剧时间轴数据管理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="stylesheet" href="/cropper.css" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <Sidebar />
        <main className="ml-60 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
