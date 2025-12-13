import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Twin Portfolio",
  description:
    "Crea il tuo Digital Twin attraverso un'intervista vocale e condividilo con il mondo",
  keywords: ["digital twin", "AI", "portfolio", "voice", "interview"],
  authors: [{ name: "Digital Twin Portfolio" }],
  openGraph: {
    title: "Digital Twin Portfolio",
    description: "Crea il tuo Digital Twin attraverso un'intervista vocale",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <ToastContainer />
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
