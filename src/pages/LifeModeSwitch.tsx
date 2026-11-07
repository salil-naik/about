export function LifeModeSwitch({ current }: { current: "images" | "canvas" | "painterly" }) {
  return (
    <nav className="life-mode-switch" aria-label="Life scene version">
      <a href="/life/crayon" aria-current={current === "images" ? "page" : undefined}>
        Crayon
      </a>
      <a
        href="/life/canvas"
        aria-current={current === "canvas" ? "page" : undefined}
      >
        Canvas
      </a>
      <a
        href="/life"
        aria-current={current === "painterly" ? "page" : undefined}
      >
        Painterly
      </a>
    </nav>
  );
}
