import { ThoughtItem } from "components/components/ThoughtItem";
import { externalData } from "components/thoughts/externalData";

export default function Thoughts() {
  return (
    <div className="-mt-5">
      {externalData.map((item) => (
        <ThoughtItem
          title={item.title}
          date={item.date}
          key={item.title}
          url={item.url}
        />
      ))}
    </div>
  );
}
