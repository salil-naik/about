interface TextLinkProps {
  href: string;
  children: React.ReactNode;
}

export const TextLink = ({ href, children }: TextLinkProps) => {
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      className="underline transition-colors duration-300 hover:text-theme"
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
};
