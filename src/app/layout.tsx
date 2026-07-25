import type { Metadata } from "next";
import { Hanken_Grotesk, Spectral, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "../components/layout/DashboardLayout";
import { BusinessProvider } from "../context/BusinessContext";
import { ToastProvider } from "../context/ToastContext";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-spectral",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wonderscore AI - Interactive Dashboard",
  description: "Generate premium, humanized weekly content & track AI visibility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${spectral.variable} ${spline.variable}`}
    >
      <body className="antialiased">
        <BusinessProvider>
          <ToastProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </ToastProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}
