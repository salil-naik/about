import { Header } from "./Header";

export function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="md:flex">
      <div className="md:w-[180px] md:h-screen md:fixed left-0 top-0 z-10 md:mt-[80px] md:pr-12 md:p-0 p-5">
        <Header />
      </div>
      <div className="md:ml-[180px] max-w-[600px] relative md:border-l border-solid border-secondary md:px-12 px-5 md:mt-[80px] mt-12">
        {children}
      </div>
    </div>
  );
}
