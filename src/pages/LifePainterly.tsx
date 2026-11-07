import { useEffect, useRef, useState } from "react";
import { LifeModeSwitch } from "./LifeModeSwitch";
import "./life.css";

type ScenePhase = "overview" | "approaching" | "under-tree" | "returning";

export default function LifePainterly() {
  const [phase, setPhase] = useState<ScenePhase>("overview");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transitionTimer = useRef<number | null>(null);

  const resumeSound = () => {
    if (!soundEnabled || soundPlaying) return;
    void audioRef.current?.play().then(() => setSoundPlaying(true)).catch(() => setSoundPlaying(false));
  };

  const toggleSound = () => {
    if (soundPlaying) {
      setSoundEnabled(false);
      return;
    }
    setSoundEnabled(true);
    void audioRef.current?.play().then(() => setSoundPlaying(true)).catch(() => setSoundPlaying(false));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!soundEnabled) {
      audio.pause();
      setSoundPlaying(false);
      return;
    }

    let active = true;
    const start = (event?: Event) => {
      if (event?.target instanceof Element && event.target.closest(".life-sound-toggle")) return;
      void audio.play().then(() => {
        if (active) setSoundPlaying(true);
      }).catch(() => {
        if (active) setSoundPlaying(false);
      });
    };

    start();
    // Browsers may wait for the first gesture before allowing audible playback.
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      active = false;
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const visitTree = () => {
    if (phase !== "overview") return;
    resumeSound();
    setPhase("approaching");
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1450;
    transitionTimer.current = window.setTimeout(() => setPhase("under-tree"), delay);
  };

  const returnToMeadow = () => {
    if (phase !== "under-tree") return;
    resumeSound();
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
  }, [phase, soundEnabled, soundPlaying]);

  return (
    <main
      className="life-scene life-painterly"
      data-phase={phase}
      aria-label="A quiet, painterly landscape with distant mountains and wildflowers"
    >
      <div className="life-layer life-painterly-distant" aria-hidden="true" />
      <div className="life-layer life-painterly-midground" aria-hidden="true" />
      <div className="life-layer life-painterly-flowers" aria-hidden="true">
        <img className="life-painterly-flowers-art" src="/life/painterly-flowers-breeze.gif" alt="" />
      </div>
      <div className="life-layer life-painterly-under-tree" aria-hidden="true" />
      <audio
        ref={audioRef}
        src="/life/painterly-ambience.wav"
        loop
        preload="auto"
        onPlay={() => setSoundPlaying(true)}
        onPause={() => setSoundPlaying(false)}
      />

      <button
        className="life-tree-spot"
        type="button"
        onClick={visitTree}
        aria-label="Visit the tree"
        disabled={phase !== "overview"}
      >
        <span className="life-tree-spot-dot" aria-hidden="true" />
        <span className="life-tree-spot-label" aria-hidden="true">Under the tree</span>
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

      <div className="life-place-caption" aria-live="polite">
        {phase === "under-tree" && (
          <>
            <span>First stop</span>
            <h1>Under the tree</h1>
            <p>Stay a while.</p>
          </>
        )}
      </div>

      <button
        className="life-sound-toggle"
        type="button"
        onClick={toggleSound}
        aria-label={soundEnabled && soundPlaying ? "Pause nature sounds" : "Play nature sounds"}
        aria-pressed={soundEnabled && soundPlaying}
        title={soundEnabled && soundPlaying ? "Pause nature sounds" : "Play nature sounds"}
      >
        <span className="life-vinyl" aria-hidden="true">
          <span className="life-vinyl-shine" />
          <span className="life-vinyl-label" />
        </span>
      </button>

      <LifeModeSwitch current="painterly" />
    </main>
  );
}
