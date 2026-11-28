import { ArrowLeft, ArrowRight, ArrowUpRight, Check, X, Code2, FileText, Globe, LineChart, PenLine, Trophy, Video } from "lucide-react";
import { useState } from "react";
import InterestForm from "../components/InterestForm";
import { companies, CTA, Eyebrow, InstructorSection, TestimonialsSection, useLearnMotion } from "./learn-parts";
import "./learn.css";
import "./learn-warm.css";

// /learn: "14 Days of Product Engineering" (warm light/dark theme; learn-warm.css layers on learn.css).
// Bonus workshop topics are intentionally not named yet.

// Everything that differs between the global /learn cohort and the Indian /course cohort.
export type Cohort = {
  start: number; // Day 1, as a UTC timestamp
  currency: string; price: string; was: string;
  payBy: string; // how payment is phrased inline, e.g. "by UPI"
  payHelp: string; // extra help line after the refund note ("" for none)
  howToPay: string; // FAQ answer to "How do I pay?"
  timeZone: string; // FAQ phrasing of when class times are shared
  phonePlaceholder: string;
};

export const globalCohort: Cohort = {
  start: Date.UTC(2026, 11, 4), // Friday, Dec 4, 2026
  currency: "$", price: "49", was: "100",
  payBy: "in USDC or USDT on Base",
  payHelp: " New to crypto or can’t pay in it? Our team will help you pay.",
  howToPay: "This cohort accepts crypto only: $49 in USDC or USDT on the Base network. You pay the network (gas) fee, which on Base is usually a few cents. Payment details are shared before class 3. New to crypto, or unable to pay in crypto? Let us know and our team will help you make the payment.",
  timeZone: "Class times and time zone will be shared before enrollment opens.",
  phonePlaceholder: "+1 555 123 4567",
};

export const indiaCohort: Cohort = {
  start: Date.UTC(2027, 0, 8), // Friday, Jan 8, 2027
  currency: "₹", price: "999", was: "2,499",
  payBy: "by UPI",
  payHelp: "",
  howToPay: "Pay ₹999 by UPI from any UPI app (GPay, PhonePe, Paytm or your bank’s app). The UPI ID and QR code are shared before class 3. If UPI doesn’t work for you, let us know and we’ll sort out another way to pay.",
  timeZone: "Classes run in IST, and class times will be shared before enrollment opens.",
  phonePlaceholder: "+91 98765 43210",
};

const DAY = 864e5;
const fmt = (t: number, o: Intl.DateTimeFormatOptions) => new Date(t).toLocaleDateString("en-US", { ...o, timeZone: "UTC" });
const range = (start: number) => { const end = start + 13 * DAY; const sameMonth = new Date(start).getUTCMonth() === new Date(end).getUTCMonth(); return `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" })}`; };

type DayKind = "class" | "build" | "due" | "bonus" | "demo";
// Each tile: [kind, small label, title]. Build days are deliberately empty: students build at their own pace.
const days: [DayKind, string?, string?][] = [
  ["class", "Class 1", "From idea to product"],
  ["build"],
  ["class", "Class 2", "Design and engineer with AI"],
  ["due", "Deadline", "Capstone proposal"],
  ["class", "Class 3", "Building real-world products"],
  ["bonus", "Free bonus", "Optional workshop"],
  ["build"],
  ["class", "Class 4", "Make it reliable. Make it live."],
  ["bonus", "Free bonus", "Optional workshop"],
  ["build"],
  ["class", "Class 5", "Understand users and improve"],
  ["build"],
  ["due", "Deadline", "Submit your project"],
  ["demo", "Final day", "Demo day & awards"],
];

const sessions = [
  { day: 1, title: "From idea to product", copy: "Turn a real problem into a scoped plan with AI, then build a mini-project together.", topics: ["MVP scope", "AI-assisted PRD", "Flowcharts"], output: "A finished mini-project",
    learn: ["Find a real user problem and define what success looks like", "Scope an MVP: must-haves vs nice-to-haves", "Write a PRD, user journey and flowchart with AI", "Build, debug and explain a mini-project together"],
    after: "Brainstorm 2–3 capstone ideas" },
  { day: 3, quiz: true, title: "Design and engineer with AI", copy: "Give AI the right context, apply proven UX laws, and push your first deploy.", topics: ["Context & planning", "UX laws", "Git"], output: "Your capstone plan",
    learn: ["Set up AI agents with plans, context files and constraints", "The UX laws behind good interfaces", "Design tokens, reusable components and task breakdown", "Build a feature, review the diff and push a preview"],
    after: "Write your capstone one-pager and take the UX challenge" },
  { day: 5, title: "Building real-world products", copy: "APIs, databases and auth, plus the error states real users run into.", topics: ["APIs", "Databases & auth", "Error states"], output: "A core feature, end to end",
    learn: ["How browsers, servers and databases fit together", "APIs: requests, JSON, status codes and rate limits", "Data, auth and keeping secrets safe", "Loading, empty and error states, plus retries"],
    after: "Build one core feature of your capstone end to end" },
  { day: 8, quiz: true, title: "Make it reliable. Make it live.", copy: "Ship to your own domain, make it fast, and test it with real users.", topics: ["Vercel & domains", "Performance", "Testing"], output: "A live beta",
    learn: ["Git branches, pull requests and rolling back safely", "Deploy from GitHub to Vercel on your own domain", "Make it fast with Lighthouse and Core Web Vitals", "Smoke tests and error reporting"],
    after: "Launch your beta and watch three people use it" },
  { day: 11, title: "Understand users and improve", copy: "Read the analytics, learn from users, and ship a better version.", topics: ["Analytics", "User feedback", "Writing it up"], output: "A shipped improvement",
    learn: ["Metrics that matter vs vanity metrics", "Track events with Mixpanel, privacy first", "Build a funnel and find where people drop off", "Turn feedback into a shipped improvement"],
    after: "Submit your project, blog and demo by Day 13" },
];

const deliverables = [
  [Globe, "A live product", "Your own URL and repository, with a README that explains how it works."],
  [FileText, "Product docs", "A PRD, user flow and architecture, plus the AI-assisted decisions behind them."],
  [LineChart, "Proof it works", "Three user tests, performance checks, an analytics funnel and one shipped improvement."],
  [PenLine, "Your story", "A short technical blog or case study, a recorded demo, and an optional portfolio."],
] as const;
const ideas = ["Real-time multiplayer whiteboard", "AI research agent with citations", "Onchain prediction market", "Multi-chain portfolio tracker", "Browser-based music studio", "3D room planner", "Live flight tracker", "Paper-trading simulator with live prices", "Voice AI interview coach", "Multiplayer browser game"];

const questionsFor = (c: Cohort) => [
  ["Do I need to know how to code?", "No prior coding experience is required, but this is a hands-on, technical course. You’ll work with an editor, Git, APIs and deployment, with AI helping you write and understand the code. A setup guide is shared before Day 1 so you start ready."],
  ["When does the introductory cohort start?", `Day 1 is ${fmt(c.start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, and demo day is ${fmt(c.start + 13 * DAY, { weekday: "long", month: "long", day: "numeric" })}. ${c.timeZone} Joining the waitlist is free and doesn’t reserve or purchase a seat.`],
  ["How much time should I set aside?", "Five one-hour live classes and demo day, plus two optional bonus workshops. Between classes, plan for about 14–21 hours of building across the two weeks. Short quizzes follow classes 2 and 4."],
  ["What are the bonus workshops?", "Two free, optional 60-minute workshops on Days 6 and 9, open to everyone. The topics will be revealed during the cohort."],
  ["What kind of product can I build?", "Anything that runs on the web and that you care about: an AI agent, a real-time collaborative app, an onchain app, a data-heavy dashboard, a 3D or creative tool. Aim for something with real technical depth. We’ll scope it together in the first two classes so it ships in 14 days."],
  ["How does demo day work?", "By Day 13, everyone submits their live project, a short write-up and a recorded demo, and gets feedback. On Day 14, ten shortlisted builders demo live, and awards go to the best product and the best blog."],
  ["What if I miss a class?", "Recording access and how long materials remain available are still being finalized. These details will be confirmed before you pay."],
  ["Will I need paid AI tools?", "We’ll cover free options as well as paid tools. Any required subscriptions or hosting costs will be disclosed before enrollment; they are not included in the course price."],
  ["When do I pay, and are there refunds?", `Classes 1 and 2 are free. Use them to decide whether the material and instructor suit you. Pay ${c.currency}${c.price} for the introductory cohort before class 3 to access the rest of the course. Because you pay after trying the first two classes, payments are non-refundable.`],
  ["How do I pay?", c.howToPay],
];

const nav = [["journey", "Course"], ["capstone", "Demo day"], ["instructor", "Instructor"], ["questions", "FAQ"]];

export default function Learn() {
  return <LearnPage c={globalCohort} />;
}

export function LearnPage({ c }: { c: Cohort }) {
  const dates = range(c.start);
  const dayDate = (day: number) => fmt(c.start + (day - 1) * DAY, { weekday: "short", month: "short", day: "numeric" });
  const dayParts = (day: number) => { const t = c.start + (day - 1) * DAY; return { weekday: fmt(t, { weekday: "narrow" }), date: new Date(t).getUTCDate() }; };
  const questions = questionsFor(c);
  const priceText = `${c.currency}${c.price}`, wasText = `${c.currency}${c.was}`;
  const { scrolled, active } = useLearnMotion(nav);
  const [selected, setSelected] = useState(0);
  const current = sessions[selected];
  return <main className="learn-page learn-warm" id="top">
    <div className="learn-ambient" aria-hidden="true" />
    <header className={`learn-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="learn-wrap learn-nav-inner">
        <a href="/" className="learn-brand" aria-label="Learn with Salil"><span>Learn <em>with</em> Salil</span></a>
        <nav aria-label="Learn navigation">{nav.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? "is-active" : undefined} aria-current={active === id ? "true" : undefined}>{label}</a>)}</nav>
        <a href="#interest" className="learn-nav-cta">Join the waitlist <ArrowUpRight size={14} /></a>
      </div>
    </header>

    <section className="learn-hero learn-wrap">
      <div className="learn-hero-copy learn-reveal">
        <span className="learn-badge"><span className="learn-dot" /> 14 Days of Product Engineering · Starts {fmt(c.start, { month: "short", day: "numeric" })}</span>
        <h1>Build with AI.<br />Ship your idea.<br /><em>Show your work.</em></h1>
        <p className="learn-lede">AI can write the code. Learn everything else it takes to ship a real product.</p>
        <p className="learn-hero-for">For aspiring designers, PMs, founders and developers who want to ship real products.</p>
        <div className="learn-hero-actions"><CTA>Join the waitlist</CTA><a className="learn-ghost" href="#journey">See the course</a></div>
        <dl className="learn-hero-facts"><div><dt>Dates</dt><dd>{dates}</dd></div><div><dt>Live</dt><dd>5 classes + 2 bonus</dd></div><div><dt>You build</dt><dd>Your own product</dd></div><div><dt>Start</dt><dd>First 2 classes free</dd></div></dl>
      </div>
      <aside className="learn-enrollment learn-reveal" style={{ ["--d" as string]: ".12s" }}>
        <div className="learn-card-label"><span>Introductory cohort</span><span>{dates}</span></div>
        <div className="learn-price"><span className="learn-price-currency">{c.currency}</span>{c.price}<span className="learn-price-note"><s className="learn-price-was" aria-label={`Was ${wasText}`}>{wasText}</s>introductory price</span></div>
        <p className="learn-price-timing">Try classes 1 and 2 free. Pay only if you want to continue.</p>
        <ul>
          <li><Check size={15} /> 5 live classes + 2 bonus workshops</li>
          <li><Check size={15} /> Your own product, live on the web</li>
          <li><Check size={15} /> Feedback on your project</li>
          <li><Check size={15} /> Demo day with awards</li>
        </ul>
        <CTA />
        <small>Join the waitlist free. Pay before class 3 {c.payBy}.</small>
        <div className="learn-enrollment-footer"><Code2 size={16} /><p>Taught by the engineer leading development at <a href="https://x.com/BungeeExchange" target="_blank" rel="noreferrer">Bungee Exchange</a></p></div>
      </aside>
    </section>

    <div className="learn-context learn-wrap">
      <span className="learn-context-label">Where my work is used</span>
      <div className="learn-company-logos">{companies.map(([name, href, logo]) => <a key={logo} href={href} target="_blank" rel="noreferrer" aria-label={name}><img src={`/learn/logos/${logo}.svg`} alt={name} /></a>)}</div>
    </div>

    <section className="learn-section learn-wrap" id="journey">
      <div className="learn-section-heading learn-heading-row learn-reveal"><div><Eyebrow>The course</Eyebrow><h2>Five live classes.<br /><em>One product, shipped.</em></h2></div><dl className="learn-days-facts"><div><dt>Live classes</dt><dd>5 × 60 min</dd></div><div><dt>Building on your own time</dt><dd>14–21 hrs</dd></div><div><dt>Class times</dt><dd>Shared before enrollment</dd></div></dl></div>
      <p className="learn-days-hint"><span aria-hidden="true">↓</span> <span className="learn-hint-desktop">Pick a live class to see what’s inside</span><span className="learn-hint-mobile">Tap a class day to see what’s inside</span></p>
      <ol className="learn-days learn-reveal">{days.map(([kind, label, title], index) => {
        const sessionIndex = sessions.findIndex(session => session.day === index + 1);
        const session = sessions[sessionIndex];
        const isSelected = sessionIndex === selected;
        return <li key={index} className={`learn-day is-${kind}${session ? " is-clickable" : ""}${isSelected ? " is-selected" : ""}`}>
          <span className="learn-day-date">{dayDate(index + 1)}</span>
          <span className="learn-day-mini" aria-hidden="true"><i>{dayParts(index + 1).weekday}</i>{dayParts(index + 1).date}</span>
          {label ? <div className="learn-day-body"><span>{label}</span><b>{title}</b></div> : <span className="sr-only">Build day</span>}
          {session && !isSelected && <span className="learn-day-view" aria-hidden="true">View <ArrowUpRight size={12} /></span>}
          {session && <>
            <button type="button" className="learn-day-hit" onClick={() => setSelected(sessionIndex)} aria-pressed={isSelected} aria-controls="class-detail"><span className="sr-only">Show details for {label}: {session.title}</span></button>
          </>}
        </li>;
      })}</ol>
      <ul className="learn-days-legend" aria-hidden="true"><li className="is-class">Live class</li><li className="is-due">Deadline</li><li className="is-bonus">Free bonus</li><li className="is-build">Build day</li><li className="is-demo">Demo day</li></ul>
      <div className="learn-class-panel learn-reveal" id="class-detail" aria-live="polite">
        <div className="learn-class-head">
          <div>
            <span className="learn-class-meta">Class {selected + 1} of 5 · {dayDate(current.day)}{current.quiz && <i>+ Quiz</i>}</span>
            <h3>{current.title}</h3>
            <p>{current.copy}</p>
          </div>
          <div className="learn-class-nav">
            <button type="button" onClick={() => setSelected(selected - 1)} disabled={selected === 0} aria-label="Previous class"><ArrowLeft size={16} /></button>
            <div className="learn-class-dots">{sessions.map((session, index) => <button key={session.title} type="button" className={index === selected ? "is-active" : undefined} onClick={() => setSelected(index)} aria-label={`Class ${index + 1}: ${session.title}`} aria-current={index === selected ? "true" : undefined} />)}</div>
            <button type="button" onClick={() => setSelected(selected + 1)} disabled={selected === sessions.length - 1} aria-label="Next class"><ArrowRight size={16} /></button>
          </div>
        </div>
        <div key={selected} className="learn-class-panel-inner">
          <div>
            <h4 className="learn-learn-title">What you’ll learn</h4>
            <ol className="learn-learn-steps">{current.learn.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol>
          </div>
          <div className="learn-class-side">
            <div><span>You leave with</span><strong>{current.output}</strong></div>
            <div><span>After class</span><strong>{current.after}</strong></div>
          </div>
        </div>
      </div>
    </section>

    <section className="learn-section learn-wrap learn-keep" id="capstone">
      <div className="learn-section-heading learn-heading-row learn-reveal"><div><Eyebrow>Capstone & demo day</Eyebrow><h2>Build your own product.<br /><em>Show it on demo day.</em></h2></div><p>Your idea, your code, your story. Here’s what you’ll ship and show.</p></div>
      <div className="learn-deliverables learn-reveal">{deliverables.map(([Icon, title, copy]) => <div key={title}><span className="learn-icon"><Icon size={20} strokeWidth={1.5} /></span><h3>{title}</h3><p>{copy}</p></div>)}</div>
      <div className="learn-demo-day learn-reveal">
        <div><span className="learn-demo-label"><Video size={15} /> Day 14 · Demo day</span><p>Everyone submits a recorded demo and gets feedback. Ten shortlisted builders present live to the cohort.</p></div>
        <div className="learn-awards">
          <div><Trophy size={18} strokeWidth={1.6} /><strong>Best Product</strong><span>$100 in Claude or Codex credit</span></div>
          <div><PenLine size={18} strokeWidth={1.6} /><strong>Best Blog</strong><span>For the clearest technical write-up</span></div>
        </div>
      </div>
      <div className="learn-ideas learn-reveal"><span>Capstone ideas</span><div>{ideas.map(idea => <span key={idea}>{idea}</span>)}</div></div>
    </section>

    <InstructorSection />
    <TestimonialsSection />

    <section className="learn-section learn-expectations">
      <div className="learn-wrap">
        <div className="learn-section-heading learn-reveal"><Eyebrow>Clear expectations</Eyebrow><h2>Know what <em>you’re joining.</em></h2></div>
        <div className="learn-expectation-grid learn-reveal">
          <div className="is-yes"><h3><span><Check size={16} strokeWidth={2.2} /></span> A good fit if you…</h3><ul>{["Want to build a real product, not follow a tutorial.", "Are happy to get technical, with AI as your co-pilot.", "Can give 14–21 hours to building across two weeks.", "Want to ship in public and explain your decisions."].map(item => <li key={item}><Check size={15} strokeWidth={2.2} />{item}</li>)}</ul></div>
          <div className="is-no"><h3><span><X size={16} strokeWidth={2.2} /></span> What this isn’t</h3><ul>{["A done-for-you build. Your capstone is yours to make.", "A full software engineering degree in five hours.", "A course where AI does it all. You’ll check and iterate.", "A job placement or income guarantee."].map(item => <li key={item}><X size={15} strokeWidth={2.2} />{item}</li>)}</ul></div>
        </div>
        <div className="learn-policy-row learn-reveal">
          <div><span>Introductory price</span><strong>{priceText} <s>{wasText}</s></strong><p>The first two classes are free. Pay before class 3, {c.payBy}, to access the remaining classes, project feedback and demo day. Any required tool or hosting costs will be shared before you pay.</p></div>
          <div><span>Try before you pay</span><strong>See if it suits you</strong><p>Attend the first two classes to assess the material and instructor. If you continue, your {priceText} payment is non-refundable.{c.payHelp}</p></div>
          <div><span>Awards</span><strong>Best Product & Best Blog</strong><p>Products are judged on usefulness, UX, engineering, originality and iteration. Blogs on clarity and insight.</p></div>
        </div>
      </div>
    </section>

    <section className="learn-section learn-wrap learn-faq" id="questions">
      <div className="learn-reveal"><Eyebrow>A few answers</Eyebrow><h2>Before you<br /><em>jump in.</em></h2></div>
      <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="learn-section learn-interest" id="interest">
      <div className="learn-wrap learn-interest-grid">
        <div><span className="learn-badge"><span className="learn-dot" /> Introductory cohort · {dates}</span><h2>Your idea deserves<br /><em>a first version.</em></h2><p>Fourteen days, five live classes, one product you ship. Join the waitlist for the schedule and enrollment details. Attend the first two classes free, then decide whether to continue.</p><div className="learn-interest-facts"><span>{dates}</span><span>First 2 classes free</span><span>{priceText} <s>{wasText}</s> to continue</span><span>No payment today</span></div></div>
        <div className="learn-reveal" style={{ ["--d" as string]: ".1s" }}><InterestForm phonePlaceholder={c.phonePlaceholder} /></div>
      </div>
    </section>
    <footer className="learn-footer learn-wrap"><a className="learn-brand" href="/"><span>Learn <em>with</em> Salil</span></a><span>14 Days of Product Engineering · Introductory cohort {dates}</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}
