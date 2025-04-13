import { TextLink } from "components/components/TextLink";

export default function Home() {
  return (
    <div>
      <h1 className="text-lg font-bold text-primary mb-8">Salil Naik</h1>
      <div className="text-base text-primary space-y-6">
        <p>I'm a software engineer based in Goa, India.</p>
        <p>
          As a kid, I wanted to program robots — that's how I first got into
          coding. Even before I knew what JavaScript was, I somehow knew I'd
          grow up to be a JS engineer. How? No idea. Maybe it was destiny. Or
          just good intuition.
        </p>
        <p>
          Fast forward to 2025 — I'm living the life younger me dreamed of. And
          yet, I know I've barely scratched the surface.
        </p>
        <p>
          I joined <TextLink href="https://socket.tech/">Socket</TextLink> as
          the first (and still the only) frontend engineer while I was still in
          college. Since then, I've been leading the frontend for{" "}
          <TextLink href="https://bungee.exchange/">Bungee Exchange</TextLink>,
          our flagship app.
        </p>
        <p>
          Get inside my mind by reading my <TextLink href="/thoughts">thoughts</TextLink>. You can also follow me on{" "}
          <TextLink href="https://github.com/salil-naik">GitHub</TextLink> and{" "}
          <TextLink href="https://x.com/0xSalilNaik">Twitter</TextLink>
        </p>
      </div>
    </div>
  );
}
