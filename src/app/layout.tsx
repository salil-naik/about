import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Header } from "../components/Header";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salil Naik",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased flex`}>
        <div className="w-[180px] h-screen fixed left-0 top-0 z-10 mt-[80px] pr-12">
          <Header />
        </div>
        <div className="ml-[180px] max-w-[600px] relative border-l border-solid border-secondary pl-12 mt-[80px]">
          {children}
        </div>
      </body>
    </html>
  );
}
