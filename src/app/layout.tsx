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
      <body className={`${roboto.variable} antialiased md:flex`}>
        <div className="md:w-[180px] md:h-screen md:fixed left-0 top-0 z-10 md:mt-[80px] md:pr-12 md:p-0 p-5">
          <Header />
        </div>
        <div className="md:ml-[180px] max-w-[600px] relative md:border-l border-solid border-secondary md:px-12 px-5 md:mt-[80px] mt-12">
          {children}
        </div>
      </body>
    </html>
  );
}
