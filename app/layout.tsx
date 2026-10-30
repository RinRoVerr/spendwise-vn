import type { Metadata } from "next";
import "./globals.css";
import "./overrides.css";
export const metadata: Metadata = { title: "SpendWise — Quản lý tài chính cá nhân", description: "Theo dõi thu chi và quản lý tài chính cá nhân." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="vi"><body>{children}</body></html>; }
