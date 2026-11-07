import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./life.css";

type ScenePhase = "overview" | "approaching" | "under-tree" | "returning";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function PostageStamp() {
  return (
    <svg className="life-postcard-stamp" viewBox="0 0 180 240" aria-hidden="true">
      <defs>
        <mask id="life-stamp-edge">
          <rect width="180" height="240" fill="white" />
          {Array.from({ length: 10 }, (_, index) => (
            <g key={`horizontal-${index}`} fill="black">
              <circle cx={index * 20} cy="0" r="6" />
              <circle cx={index * 20} cy="240" r="6" />
            </g>
          ))}
          {Array.from({ length: 13 }, (_, index) => (
            <g key={`vertical-${index}`} fill="black">
              <circle cx="0" cy={index * 20} r="6" />
              <circle cx="180" cy={index * 20} r="6" />
            </g>
          ))}
        </mask>
        <clipPath id="life-stamp-window">
          <rect x="14" y="14" width="152" height="212" rx="3" />
        </clipPath>
      </defs>
      <g mask="url(#life-stamp-edge)">
        <rect width="180" height="240" fill="#f7f6f1" />
        <image href="/life/painterly-distant.png" x="14" y="14" width="152" height="212" preserveAspectRatio="xMidYMid slice" clipPath="url(#life-stamp-window)" />
        <rect x="14" y="14" width="152" height="46" fill="#f4f5f0" opacity="0.72" />
        <text x="24" y="42" fill="#596b71" fontFamily="Georgia, serif" fontSize="19">GOA</text>
        <text x="157" y="42" textAnchor="end" fill="#596b71" fontFamily="Georgia, serif" fontSize="19">2026</text>
      </g>
    </svg>
  );
}

function Paperclip({ className, side }: { className: string; side: "front" | "back" }) {
  const wire = side === "front"
    ? "M28 12C28 5 23 2 17 2S6 7 6 14v70c0 11 7 18 17 18s18-8 18-19V24c0-8-5-13-12-13s-12 5-12 13v57c0 5 3 8 7 8s7-3 7-8V30"
    : "M31 28V17c0-8-5-13-12-13S7 9 7 17v62c0 12 7 20 17 20s17-8 17-20V28c0-8-5-13-12-13s-12 5-12 13v51";

  return (
    <svg className={className} viewBox="0 0 44 104" fill="none" aria-hidden="true">
      <path d={wire} stroke="#8c8e89" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={wire} stroke="#f5f4ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LifePainterly() {
  const [phase, setPhase] = useState<ScenePhase>("overview");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [songOpened, setSongOpened] = useState(false);
  const [songPlaying, setSongPlaying] = useState(false);
  const [songTime, setSongTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const songRef = useRef<HTMLAudioElement>(null);
  const transitionTimer = useRef<number | null>(null);

  const toggleSong = () => {
    const song = songRef.current;
    if (!song) return;
    setSongOpened(true);
    if (!song.paused) {
      song.pause();
      return;
    }
    if (song.ended) song.currentTime = 0;
    void song.play().catch(() => setSongPlaying(false));
  };

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const visitTree = () => {
    if (phase !== "overview") return;
    setCardFlipped(false);
    setPhase("approaching");
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1450;
    transitionTimer.current = window.setTimeout(() => setPhase("under-tree"), delay);
  };

  const returnToMeadow = () => {
    if (phase !== "under-tree") return;
    setPhase("returning");
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1750;
    transitionTimer.current = window.setTimeout(() => setPhase("overview"), delay);
  };

  useEffect(() => {
    if (phase !== "under-tree") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") returnToMeadow();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  return (
    <main
      className="life-scene life-painterly"
      data-phase={phase}
      data-song-open={songOpened}
      aria-label="A quiet, painterly landscape with distant mountains and wildflowers"
    >
      <div className="life-layer life-painterly-distant" aria-hidden="true" />
      <div className="life-layer life-painterly-midground" aria-hidden="true" />
      <div className="life-layer life-painterly-flowers" aria-hidden="true">
        <img className="life-painterly-flowers-art" src="/life/painterly-flowers-breeze.gif" alt="" />
      </div>
      <div className="life-layer life-painterly-under-tree" aria-hidden="true" />
      <audio
        ref={songRef}
        src="/life/gehra-hua.mp3"
        preload="metadata"
        onLoadedMetadata={(event) => setSongDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setSongTime(event.currentTarget.currentTime)}
        onPlay={() => setSongPlaying(true)}
        onPause={() => setSongPlaying(false)}
        onEnded={() => setSongPlaying(false)}
      />
      <div className="life-intro" aria-hidden={phase !== "overview"}>
        <span className="life-intro-kicker">A little world for you</span>
        <h1>Come wander<br />with me.</h1>
        <p>Follow the light. A song is waiting beneath the tree.</p>
      </div>

      <button
        className="life-tree-spot"
        type="button"
        onClick={visitTree}
        aria-label="Visit Our song"
        disabled={phase !== "overview"}
      >
        <span className="life-tree-spot-dot" aria-hidden="true" />
        <span className="life-tree-spot-label" aria-hidden="true">Our song</span>
      </button>

      {phase !== "overview" && phase !== "approaching" && (
        <button
          className="life-return"
          type="button"
          onClick={returnToMeadow}
          disabled={phase !== "under-tree"}
        >
          <span aria-hidden="true">←</span> Back to the meadow
        </button>
      )}

      <section className="life-song-place" aria-label="Our song" aria-hidden={phase !== "under-tree"} inert={phase !== "under-tree"}>
        <div className="life-postcard-wrap">
          <button
            className={`life-postcard${cardFlipped ? " is-flipped" : ""}`}
            type="button"
            onClick={() => setCardFlipped((flipped) => !flipped)}
            disabled={phase !== "under-tree"}
            aria-label={cardFlipped ? "Turn postcard to the picture" : "Turn postcard to the message"}
          >
            <span className="life-postcard-attachment" aria-hidden="true">
              <span className="life-postcard-attachment-face life-postcard-attachment-front" />
              <span className="life-postcard-attachment-face life-postcard-attachment-back">
                <img src="/life/our-song-photo.jpg" alt="" />
              </span>
            </span>
            <span className="life-postcard-face life-postcard-front" aria-hidden={cardFlipped}>
              <span className="life-postcard-photo" />
              <span className="life-postcard-photo-caption">
                <span>tambdi surla, goa, 2026</span>
              </span>
            </span>
            <span className="life-postcard-face life-postcard-back" aria-hidden={!cardFlipped}>
              <span className="life-postcard-message">
                <span className="life-postcard-heading">Our song</span>
                <span className="life-postcard-paragraph">Remember when you asked me what our song was? And you thought it was this one specific song from a movie we watched together.</span>
                <span className="life-postcard-paragraph life-postcard-paragraph-muted">So here&apos;s that beautiful song, for the most beautiful person in my life.</span>
                <span className="life-postcard-paragraph life-postcard-paragraph-last">Hope you love it as much I love you!</span>
              </span>
              <span className="life-postcard-address" aria-hidden="true">TAMBDI SURLA · GOA · 2026</span>
              <span className="life-postcard-artifacts" aria-hidden="true">
                <PostageStamp />
              </span>
            </span>
            <span className="life-postcard-clip" aria-hidden="true">
              <Paperclip className="life-postcard-clip-face life-postcard-clip-front" side="front" />
              <Paperclip className="life-postcard-clip-face life-postcard-clip-back" side="back" />
            </span>
          </button>
          <button className={`life-postcard-play${cardFlipped ? " is-visible" : ""}`} type="button" onClick={toggleSong}>
            <span className="life-postcard-play-icon" aria-hidden="true">{songPlaying ? "Ⅱ" : "▶"}</span>
            {songPlaying ? "Pause the song" : "Play the song"}
          </button>
        </div>

        <div className="life-song-details">
          <span className="life-song-eyebrow">First stop · beneath the tree</span>
          <h1>Our song</h1>
          <p>A place to pause and listen.</p>
        </div>
      </section>

      {songOpened && <div className="life-player is-open">
        <span className="life-player-record" aria-hidden="true">
          <span className={`life-vinyl${songPlaying ? " is-spinning" : ""}`}>
            <span className="life-vinyl-shine" />
            <span className="life-vinyl-label" />
          </span>
        </span>
        <div className="life-player-content">
          <div className="life-player-heading">
            <span className="life-player-kicker">{songPlaying ? "NOW PLAYING" : "PAUSED"} <span aria-hidden="true">/</span> OUR SONG</span>
            <span className="life-player-title">Gehra Hua</span>
          </div>
          <div className="life-player-timeline">
            <span>{formatTime(songTime)}</span>
            <input
              aria-label="Seek through Gehra Hua"
              type="range"
              min="0"
              max={songDuration || 1}
              step="0.1"
              value={Math.min(songTime, songDuration || 1)}
              onChange={(event) => {
                const time = Number(event.currentTarget.value);
                if (songRef.current) songRef.current.currentTime = time;
                setSongTime(time);
              }}
              style={{ "--song-progress": `${songDuration ? (songTime / songDuration) * 100 : 0}%` } as CSSProperties}
            />
            <span>{formatTime(songDuration)}</span>
          </div>
        </div>
        <button
          className="life-player-toggle"
          type="button"
          onClick={toggleSong}
          aria-label={songPlaying ? "Pause Gehra Hua" : "Play Gehra Hua"}
          aria-pressed={songPlaying}
          title={songPlaying ? "Pause song" : "Play song"}
        >
          <svg className="life-player-play-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {songPlaying ? (
              <path d="M8 5.5v13M16 5.5v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M8.5 5.5 18 12l-9.5 6.5v-13Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>}

    </main>
  );
}
