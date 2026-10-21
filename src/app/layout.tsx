import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "食記地圖",
  description: "記錄何時、去哪、吃了什麼、好不好吃——屬於自己的覓食足跡地圖",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-100 text-stone-900">
        <NavBar />
        <main className="flex flex-1 flex-col min-h-0">{children}</main>
      </body>
    </html>
  );
}
