import Link from "next/link";

export interface ThoughtItemProps {
  title: string;
  date: string; // YYYY/MM/DD format
  url: string;
}

export const ThoughtItem = ({ title, date, url }: ThoughtItemProps) => {
  const isExternal = url.startsWith("http");

  // Function to format the date
  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString.replace(/-/g, '/')); // Ensure compatibility with Date parsing
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const year = dateObj.getFullYear();

    // Determine the day suffix
    const daySuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th'; // Covers 11th to 20th
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${daySuffix(day)} ${month} ${year}`;
  };

  return (
    <Link
      className="flex items-start justify-between w-full group text-base text-primary/80 hover:text-primary transition-colors duration-300 border-transparent border-b border-solid hover:border-secondary/20 py-5"
      href={url}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      <span>{title}</span>
      <div className="shrink-0 space-x-2 flex items-center opacity-35 group-hover:opacity-100 transition-opacity duration-300">
        <span>{formatDate(date)}</span>
        {isExternal && <img src="/external.svg" className="size-5" />}
      </div>
    </Link>
  );
};