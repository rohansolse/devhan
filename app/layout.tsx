import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devyani & Rohan",
  description: "The wedding story of Devyani and Rohan, one event at a time."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
