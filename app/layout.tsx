import type { Metadata } from "next";
import { Fira_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Zo POS - Fashion Tech",
  description: "Premium fashion-tech e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body
        className={`${firaSans.variable} ${poppins.variable} antialiased font-sans`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
