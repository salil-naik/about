// Shared building blocks for the Learn page.
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Maximize2, X } from "lucide-react";
import posts from "./learn-posts.json";
import testimonials from "./learn-testimonials.json";

export const companies = [["Socket", "https://socket.tech/", "socket"], ["Bungee Exchange", "https://bungee.exchange/", "bungee"], ["Polygon", "https://polygon.technology/", "polygon"]];

export function CTA({ children = "Join the first-cohort waitlist", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <a className={`learn-cta ${className}`} href="#interest"><span>{children}</span><ArrowUpRight size={17} /></a>;
}
export function Eyebrow({ index, children }: { index?: string; children: React.ReactNode }) {
  return <span className="learn-eyebrow">{index && <span className="learn-eyebrow-index">{index}</span>}{children}</span>;
}

export function useLearnMotion(links: string[][]) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const firstSection = document.getElementById(links[0][0]);
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      if (firstSection && firstSection.getBoundingClientRect().top > window.innerHeight * 0.5) setActive("");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); reveal.unobserve(entry.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const page = document.querySelector(".learn-page");
    page?.classList.add("learn-motion");
    document.querySelectorAll(".learn-reveal").forEach(element => reveal.observe(element));
    const spy = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(([id]) => { const section = document.getElementById(id); if (section) spy.observe(section); });
    return () => { window.removeEventListener("scroll", onScroll); reveal.disconnect(); spy.disconnect(); page?.classList.remove("learn-motion"); };
  }, []);
  return { scrolled, active };
}

export function AwardCertificate() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return <>
    <button type="button" className="learn-award" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">
      <span className="learn-award-frame"><img src="/learn/awwwards-mobile-excellence.jpg" alt="" width={1100} height={1460} loading="lazy" /></span>
      <span className="learn-award-copy"><span>Awwwards <em>×</em> Google · 2019</span><strong>Mobile Excellence Award</strong><span>For the TEDxGEC website I built — mobile friendliness, performance, and usability.</span></span>
      <span className="learn-award-open" aria-hidden="true"><Maximize2 size={15} /></span>
      <span className="sr-only">View certificate</span>
    </button>
    <dialog ref={dialog} className="learn-lightbox" aria-label="Awwwards and Google Mobile Excellence certificate" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <figure className="learn-lightbox-frame">
        <div className="learn-lightbox-mat"><img src="/learn/awwwards-mobile-excellence.jpg" alt="Awwwards and Google Mobile Excellence certificate awarded to the TEDxGEC website by Salil Naik, February 13, 2019" width={1100} height={1460} /></div>
        <figcaption>Mobile Excellence Award · Awwwards × Google · Feb 13, 2019</figcaption>
      </figure>
      <button type="button" className="learn-lightbox-close" onClick={close} aria-label="Close certificate"><X size={18} /></button>
    </dialog>
  </>;
}

// How each of Salil's posts is presented, keyed by post id (the post itself stays the linked source)
const postCards: Record<string, { headline: string; line: string; logo: string; logoAlt: string }> = {
  "1720137380546728202": { headline: "Shipped inside OpenSea Pro", line: "My cross-chain plugin went live inside OpenSea Pro.", logo: "https://pbs.twimg.com/profile_images/1645495708613582860/zD973AUI_normal.png", logoAlt: "OpenSea Pro" },
  "1737111857532649735": { headline: "Powering Polygon Portal", line: "From contributing to Polygon’s widget to building the Socket Plugin that now runs Polygon Portal.", logo: "/learn/logos/polygon.svg", logoAlt: "Polygon" },
  "1993640977370943615": { headline: "Used by Vitalik Buterin", line: "Spotted: Vitalik swapping on Bungee, the product I lead development for.", logo: "/learn/logos/bungee.svg", logoAlt: "Bungee" },
};

export function InstructorSection() {
  return <section className="learn-section learn-wrap" id="instructor">
    <div className="learn-section-heading learn-reveal"><Eyebrow>Your instructor</Eyebrow><h2>Learn from someone<br />who <em>builds for a living.</em></h2></div>
    <div className="learn-instructor-grid learn-reveal">
      <figure className="learn-portrait-frame"><img className="learn-portrait" src="/learn/salil-naik.png" alt="Salil Naik smiling in a brick-lined courtyard" width={960} height={1280} loading="lazy" /><figcaption><span>Salil Naik</span><span>Software engineer · Builder</span></figcaption></figure>
      <div className="learn-instructor-copy">
        <p className="learn-name">Hi, I’m Salil.</p>
        <p>I joined Socket as its first frontend engineer while I was still in college. Today, I lead development at Bungee Exchange, turning complex product ideas into experiences people can use.</p>
        <p>My work has been used by products including <strong>Polygon</strong> and <strong>OpenSea Pro</strong>. In this course, I’ll show you the exact workflow I use to ship products every day.</p>
        <div className="learn-impact">
          <a href="https://bungee.exchange/" target="_blank" rel="noreferrer"><strong>$40B+</strong><span>Volume processed by Bungee Exchange</span><ArrowUpRight size={16} /></a>
          <div><strong>Polygon <em>&amp;</em> OpenSea Pro</strong><span>Products that have used my work</span></div>
        </div>
        <AwardCertificate />
        <a className="learn-inline-link" href="/">More about me <ArrowUpRight size={15} /></a>
      </div>
    </div>
    <div className="learn-proof">
      <div className="learn-proof-heading"><Eyebrow>The work, out in the world</Eyebrow><p>A few milestones I’ve shared along the way.</p></div>
      <div className="learn-proof-grid">{posts.map(post => { const card = postCards[post.id]; return <a className="learn-proof-card learn-reveal" key={post.id} href={`https://x.com/0xSalilNaik/status/${post.id}`} target="_blank" rel="noreferrer">
        <img className={`learn-proof-logo${card.logo.endsWith(".svg") ? " is-wordmark" : ""}`} src={card.logo} alt={card.logoAlt} loading="lazy" />
        <strong>{card.headline}</strong>
        <p>{card.line}</p>
        <div className="learn-proof-foot"><span>{new Date(post.date).getUTCFullYear()}</span><span>Read the post on 𝕏 <ArrowUpRight size={13} /></span></div>
      </a>; })}</div>
    </div>
  </section>;
}

export function TestimonialsSection() {
  return <section className="learn-section learn-wrap" id="testimonials">
    <div className="learn-section-heading learn-reveal"><Eyebrow>Words from others</Eyebrow><h2>From people I’ve helped<br /><em>and worked with.</em></h2></div>
    <div className="learn-testimonial-grid">{testimonials.map(review => <a className="learn-native-tweet learn-testimonial-tweet learn-reveal" key={review.id} href={`https://x.com/${review.handle}/status/${review.id}`} target="_blank" rel="noreferrer">
      <span className="learn-quote-mark" aria-hidden="true">“</span>
      <p className="learn-tweet-text">{review.text}</p>
      <div className="learn-tweet-profile"><img src={review.avatar} alt="" loading="lazy" /><div><strong>{review.name}{review.verified && <span className="learn-verified" aria-label="Verified account">✓</span>}</strong><span>@{review.handle}</span></div><span className="learn-x-mark" aria-label="Read on X">View on 𝕏 <ArrowUpRight size={14} /></span></div>
    </a>)}</div>
  </section>;
}
