import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura | AI Face Attendance",
  description: "Enterprise facial recognition attendance management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
