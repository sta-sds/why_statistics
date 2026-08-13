import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Major Match — Statistics or Data Science?",
  description: "An interactive guide to the different centres of gravity of Statistics and Data Science.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
