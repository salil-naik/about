import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Code2, Maximize2, X, Globe, Layers, Heart, MessageCircle } from "lucide-react";
import InterestForm from "../components/InterestForm";
import "./learn.css";
import posts from "./learn-posts.json";
import testimonials from "./learn-testimonials.json";

const sessions = [
  { title: "An idea worth building", copy: "Choose a small, useful problem. Compare AI tools, learn to give them context, and write a brief that keeps your project focused.", topics: ["Tool selection", "Prompting with context", "Project scope"], output: "Your project brief" },
  { title: "From brief to first build", copy: "Direct an AI coding agent, build in small steps, and understand what to do when the first answer doesn’t work.", topics: ["Agent workflows", "Building incrementally", "Debugging"], output: "A working first version" },
  { title: "Make it feel like a product", copy: "Improve the structure, interface, interactions, and words. Learn to evaluate the result and give useful feedback.", topics: ["Product thinking", "Interface design", "Iteration"], output: "A more usable product" },
  { title: "Ship it. Tell its story.", copy: "Put your project online. Build a portfolio website that explains the problem, your decisions, and what you made.", topics: ["Deployment", "Portfolio building", "Process storytelling"], output: "Your project, live on the web" },
  { title: "The capstone", copy: "Bring the pieces together, polish your project, and present it to the cohort. See how other people approached the same process.", topics: ["Final polish", "Project demo", "Group feedback"], output: "A finished project presentation" },
];
const questions = [
  ["Do I need to know how to code?", "No prior coding experience is required. You’ll learn to describe what you want, direct the tools, and check their output. You do need a laptop and a willingness to experiment."],
  ["When does the first cohort start?", "The first cohort starts on Friday, December 4, 2026. Class times, time zone, and the full schedule will be shared before enrollment opens. Joining the waitlist is free and doesn’t reserve or purchase a seat."],
  ["How much time should I set aside?", "There are five one-hour live classes. You’ll also need time between sessions to build your project. The suggested weekly workload will be shared with the final schedule."],
  ["What if I miss a class?", "Recording access and how long materials remain available are still being finalized. These details will be confirmed before you pay."],
  ["Will I need paid AI tools?", "We’ll cover free alternatives as well as paid tools. Any required subscriptions or hosting costs will be disclosed before enrollment; they are not included in the course price."],
  ["What’s the refund policy?", "If you enroll and aren’t satisfied, you can request a full refund after the first two classes, before class 3 begins. No refunds are available after that."],
];
const takeaways = [
  [Code2, "Your project & source code", "The thing you built, with the files and code to keep improving it."],
  [Globe, "Your portfolio website", "A home for your work and the story of how you made it."],
  [Layers, "Your project brief & process", "A record of the decisions, prompts, and iterations behind the result."],
] as const;
const companies = [["Socket", "https://socket.tech/", "socket"], ["Bungee Exchange", "https://bungee.exchange/", "bungee"], ["Polygon", "https://polygon.technology/", "polygon"]];
const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function CTA({ children = "Join the first-cohort waitlist", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <a className={`learn-cta ${className}`} href="#interest"><span>{children}</span><ArrowUpRight size={17} /></a>;
}
function Eyebrow({ index, children }: { index?: string; children: React.ReactNode }) {
  return <span className="learn-eyebrow">{index && <span className="learn-eyebrow-index">{index}</span>}{children}</span>;
}

const navLinks = [["curriculum", "Classes"], ["instructor", "Instructor"], ["testimonials", "Words"], ["questions", "FAQ"]];

function useLearnMotion() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const firstSection = document.getElementById(navLinks[0][0]);
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
    navLinks.forEach(([id]) => { const section = document.getElementById(id); if (section) spy.observe(section); });
    return () => { window.removeEventListener("scroll", onScroll); reveal.disconnect(); spy.disconnect(); page?.classList.remove("learn-motion"); };
  }, []);
  return { scrolled, active };
}

function AwardCertificate() {
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

export default function Learn({ variant }: { variant?: "warm" } = {}) {
  const { scrolled, active } = useLearnMotion();
  return <main className={`learn-page${variant ? ` learn-${variant}` : ""}`} id="top">
    <div className="learn-ambient" aria-hidden="true" />
    <header className={`learn-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="learn-wrap learn-nav-inner">
        <a href="/" className="learn-brand" aria-label="Learn with Salil"><span>Learn <em>with</em> Salil</span></a>
        <nav aria-label="Learn navigation">{navLinks.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? "is-active" : undefined} aria-current={active === id ? "true" : undefined}>{label}</a>)}</nav>
        <a href="#interest" className="learn-nav-cta">Join the waitlist <ArrowUpRight size={14} /></a>
      </div>
    </header>

    <section className="learn-hero learn-wrap">
      <div className="learn-hero-copy learn-reveal">
        <span className="learn-badge"><span className="learn-dot" /> First cohort · Starts Friday, Dec 4</span>
        <h1>Build with AI.<br />Ship your idea.<br /><em>Show your work.</em></h1>
        <p className="learn-lede">Go from an idea to a working project and a portfolio website—in five live classes. Learn the practical workflow for building with AI, even if you’ve never written code.</p>
        <div className="learn-hero-actions"><CTA>Join the waitlist</CTA><a className="learn-ghost" href="#curriculum">See the five classes</a></div>
        <dl className="learn-hero-facts"><div><dt>Starts</dt><dd>Dec 4, 2026</dd></div><div><dt>Format</dt><dd>5 live classes</dd></div><div><dt>Length</dt><dd>1 hour each</dd></div><div><dt>Cohort</dt><dd>50 seats</dd></div></dl>
      </div>
      <aside className="learn-enrollment learn-reveal" style={{ ["--d" as string]: ".12s" }}>
        <div className="learn-card-label"><span>First cohort</span><span>Starts Dec 4</span></div>
        <div className="learn-price"><span className="learn-price-currency">$</span>100<span className="learn-price-note">for all five<br />live classes</span></div>
        <ul>
          <li><Check size={15} /> Five live, practical sessions</li>
          <li><Check size={15} /> Your own project + portfolio website</li>
          <li><Check size={15} /> Small cohort of 50 participants</li>
          <li><Check size={15} /> Beginner friendly — no code required</li>
        </ul>
        <CTA />
        <small>Free to join. No payment or commitment.</small>
        <div className="learn-enrollment-footer"><Code2 size={16} /><p>Taught by the engineer leading development at <a href="https://x.com/BungeeExchange" target="_blank" rel="noreferrer">Bungee Exchange</a></p></div>
      </aside>
    </section>

    <div className="learn-context learn-wrap">
      <span className="learn-context-label">Places I’ve built products</span>
      <div className="learn-company-logos">{companies.map(([name, href, logo]) => <a key={logo} href={href} target="_blank" rel="noreferrer" aria-label={name}><img src={`/learn/logos/${logo}.svg`} alt={name} /></a>)}</div>
    </div>

    <section className="learn-section learn-curriculum" id="curriculum">
      <div className="learn-wrap">
        <div className="learn-section-heading learn-heading-row learn-reveal"><div><Eyebrow index="01">The five classes</Eyebrow><h2>One idea.<br /><em>Five steps to shipping it.</em></h2></div><p>Bring an idea you care about. Each class moves it forward, with time between sessions to put the work in.</p></div>
        <ol className="learn-sessions">{sessions.map((session, index) => <li key={session.title} className="learn-reveal">
          <div className="learn-session-number">0{index + 1}</div>
          <div className="learn-session-body"><span className="learn-session-meta">Class {index + 1} · 60 min</span><h3>{session.title}</h3><p>{session.copy}</p><div className="learn-topics">{session.topics.map(topic => <span key={topic}>{topic}</span>)}</div></div>
          <div className="learn-session-output"><span>You leave with</span><strong>{session.output}</strong></div>
        </li>)}</ol>
      </div>
    </section>

    <section className="learn-section learn-wrap learn-keep">
      <div className="learn-section-heading learn-reveal"><Eyebrow index="02">Yours to keep</Eyebrow><h2>The class ends.<br /><em>The work stays yours.</em></h2></div>
      <div className="learn-takeaways">{takeaways.map(([Icon, title, copy], index) => <div key={title} className="learn-reveal" style={{ ["--d" as string]: `${index * .08}s` }}><span className="learn-icon"><Icon size={20} strokeWidth={1.5} /></span><h3>{title}</h3><p>{copy}</p></div>)}</div>
      <div className="learn-access-note"><span>Before you enroll</span><p>Recording access, downloadable course resources, and any community access will be confirmed with the final cohort details.</p></div>
    </section>

    <section className="learn-section learn-wrap" id="instructor">
      <div className="learn-section-heading learn-reveal"><Eyebrow index="03">Your instructor</Eyebrow><h2>Learn from someone<br />who <em>builds for a living.</em></h2></div>
      <div className="learn-instructor-grid learn-reveal">
        <figure className="learn-portrait-frame"><img className="learn-portrait" src="/learn/salil-naik.png" alt="Salil Naik smiling in a brick-lined courtyard" width={960} height={1280} loading="lazy" /><figcaption><span>Salil Naik</span><span>Software engineer · Builder</span></figcaption></figure>
        <div className="learn-instructor-copy">
          <p className="learn-name">Hi, I’m Salil.</p>
          <p>I joined Socket as its first frontend engineer while I was still in college. Today, I lead development at Bungee Exchange, turning complex product ideas into experiences people can use.</p>
          <p>My work has been used by products including <strong>Polygon</strong> and <strong>OpenSea Pro</strong>. I bring that experience to the course: turning complex ideas into products that work in the real world.</p>
          <div className="learn-impact">
            <a href="https://bungee.exchange/" target="_blank" rel="noreferrer"><strong>$40B+</strong><span>Volume processed by Bungee Exchange</span><ArrowUpRight size={16} /></a>
            <div><strong>Polygon <em>&amp;</em> OpenSea Pro</strong><span>Products that have used my work</span></div>
          </div>
          <AwardCertificate />
          <a className="learn-inline-link" href="/">More about me <ArrowUpRight size={15} /></a>
        </div>
      </div>
      <div className="learn-public-proof">
        <div className="learn-proof-heading"><Eyebrow>The work, out in the world</Eyebrow><p>A few milestones I’ve shared along the way.</p></div>
        <div className="learn-tweet-grid">{posts.map(post => <a className="learn-native-tweet learn-reveal" key={post.id} href={`https://x.com/0xSalilNaik/status/${post.id}`} target="_blank" rel="noreferrer">
          <div className="learn-tweet-profile"><img src={post.avatar} alt="" loading="lazy" /><div><strong>Salil Naik <span className="learn-verified" aria-label="Verified account">✓</span></strong><span>@0xSalilNaik</span></div><span className="learn-x-mark" aria-label="X">𝕏</span></div>
          <p className="learn-tweet-text">{post.text}</p>
          <div className="learn-quoted-tweet"><div className="learn-quoted-author"><img src={post.quote.avatar} alt="" loading="lazy" /><strong>{post.quote.name}</strong><span>@{post.quote.handle}</span></div><p>{post.quote.text}</p>{post.quote.image && <img className="learn-tweet-media" src={post.quote.image} alt={`Image from the post quoted by Salil: ${post.quote.text}`} loading="lazy" />}</div>
          <div className="learn-native-tweet-footer"><time dateTime={post.date}>{formatDate(post.date)}</time><span>View on X <ArrowUpRight size={13} /></span></div>
        </a>)}</div>
      </div>
    </section>

    <section className="learn-section learn-wrap" id="testimonials">
      <div className="learn-section-heading learn-reveal"><Eyebrow index="04">Words from others</Eyebrow><h2>From people I’ve helped<br /><em>and worked with.</em></h2></div>
      <div className="learn-testimonial-grid">{testimonials.map(review => <a className="learn-native-tweet learn-testimonial-tweet learn-reveal" key={review.id} href={`https://x.com/${review.handle}/status/${review.id}`} target="_blank" rel="noreferrer">
        <span className="learn-quote-mark" aria-hidden="true">“</span>
        <p className="learn-tweet-text">{review.text}</p>
        <div className="learn-tweet-profile"><img src={review.avatar} alt="" loading="lazy" /><div><strong>{review.name}{review.verified && <span className="learn-verified" aria-label="Verified account">✓</span>}</strong><span>@{review.handle} · {formatDate(review.date)}</span></div><span className="learn-x-mark" aria-label="Read on X"><ArrowUpRight size={16} /></span></div>
      </a>)}</div>
    </section>

    <section className="learn-section learn-expectations">
      <div className="learn-wrap">
        <div className="learn-section-heading learn-reveal"><Eyebrow index="05">Clear expectations</Eyebrow><h2>Know what <em>you’re joining.</em></h2></div>
        <div className="learn-expectation-grid learn-reveal">
          <div><h3><span>+</span> A good fit if you…</h3><ul><li>Have an idea and want a practical way to start.</li><li>Want to build with AI, with or without coding experience.</li><li>Can spend time experimenting between classes.</li><li>Want to share a project and explain your process.</li></ul></div>
          <div><h3><span>−</span> What to expect from the work</h3><ul><li>You’ll build your own project; it isn’t done for you.</li><li>Five hours of class won’t cover all of software engineering.</li><li>AI makes mistakes. Checking and iteration are part of the course.</li><li>No job placement, guaranteed income, or job opportunities are promised.</li></ul></div>
        </div>
        <div className="learn-policy-row learn-reveal">
          <div><span>Price</span><strong>$100 for all five classes</strong><p>Required tool or hosting costs, if any, will be disclosed before enrollment.</p></div>
          <div><span>Refunds</span><strong>Try the first two classes</strong><p>Request a full refund after class 2, before class 3 begins. No refunds after that.</p></div>
          <div><span>Capstone award</span><strong>A $100 AI subscription</strong><p>One standout build, judged on its idea, execution, and presentation.</p></div>
        </div>
      </div>
    </section>

    <section className="learn-section learn-wrap learn-faq" id="questions">
      <div className="learn-reveal"><Eyebrow index="06">A few answers</Eyebrow><h2>Before you<br /><em>jump in.</em></h2></div>
      <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="learn-section learn-interest" id="interest">
      <div className="learn-wrap learn-interest-grid">
        <div><span className="learn-badge"><span className="learn-dot" /> First cohort · Starts Dec 4</span><h2>Your idea deserves<br /><em>a first version.</em></h2><p>The first cohort of 50 starts on December 4. Join the waitlist for the full schedule and enrollment details.</p><div className="learn-interest-facts"><span>Starts Dec 4</span><span>5 live classes</span><span>$100 total</span><span>No payment today</span></div></div>
        <div className="learn-reveal" style={{ ["--d" as string]: ".1s" }}><InterestForm /></div>
      </div>
    </section>
    <footer className="learn-footer learn-wrap"><a className="learn-brand" href="/"><span>Learn <em>with</em> Salil</span></a><span>Build something you’re proud to share.</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}
