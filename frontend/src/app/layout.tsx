import { SpendWiseNavigation } from "@/components/spendwise-navigation";
import type { Metadata } from "next";
import { Manrope, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendWise — Your money, in balance",
  description: "A smarter, simpler way to manage your personal finances.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SpendWiseNavigation>{children}</SpendWiseNavigation>
      </body>
    </html>
  );
}
