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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <SidebarProvider>
          <Sidebar />
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
