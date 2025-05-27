import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider, Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "IYTEBul",
  description: "IYTE Lost and Found Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SidebarProvider>
          <Sidebar />
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
