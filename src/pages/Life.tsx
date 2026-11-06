import "./life.css";

export default function Life() {
  return (
    <main
      className="life-scene"
      aria-label="A dreamy crayon landscape with mountains, a flowering meadow, and trees"
    >
      <div className="life-layer life-sky" aria-hidden="true" />
      <div className="life-layer life-meadow" aria-hidden="true" />
      <div className="life-layer life-trees" aria-hidden="true" />
    </main>
  );
}
