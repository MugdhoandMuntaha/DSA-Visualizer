import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Algorithm Visualizer",
  description:
    "Interactive algorithm visualizer — watch BFS, Dijkstra's and more explore graphs step-by-step with beautiful animations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
