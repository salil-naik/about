import { useEffect, useRef } from "react";
import { LifeModeSwitch } from "./LifeModeSwitch";
import "./life.css";

type Random = () => number;

function seededRandom(seed: number): Random {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function crayonStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  color: string,
  width: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + length * 0.45, y - length * 0.22, x + length, y - length * 0.3);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.stroke();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 252, 238, 0.94)";
  ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
  ctx.shadowBlur = size * 0.2;
  for (const [dx, dy, rx, ry] of [
    [-0.4, 0.12, 0.33, 0.23],
    [-0.13, -0.03, 0.37, 0.32],
    [0.18, -0.12, 0.31, 0.35],
    [0.46, 0.12, 0.33, 0.22],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * size, y + dy * size, rx * size, ry * size, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(127, 173, 218, 0.35)";
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.56, y + size * 0.21);
  ctx.quadraticCurveTo(x, y + size * 0.42, x + size * 0.68, y + size * 0.2);
  ctx.stroke();
  ctx.restore();
}

function texturedShape(
  ctx: CanvasRenderingContext2D,
  shape: Path2D,
  fill: string,
  texture: string,
  area: { x: number; y: number; width: number; height: number },
  count: number,
  random: Random,
) {
  ctx.fillStyle = fill;
  ctx.fill(shape);
  ctx.save();
  ctx.clip(shape);
  for (let i = 0; i < count; i++) {
    const x = area.x + random() * area.width;
    const y = area.y + random() * area.height;
    crayonStroke(ctx, x, y, 3 + random() * 15, texture, 0.5 + random() * 1.5);
  }
  ctx.restore();
}

function mountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  peakY: number,
  width: number,
  bottomY: number,
  color: string,
  random: Random,
) {
  const shape = new Path2D();
  shape.moveTo(x - width * 0.62, bottomY);
  shape.quadraticCurveTo(x - width * 0.25, peakY + width * 0.15, x, peakY);
  shape.quadraticCurveTo(x + width * 0.26, peakY + width * 0.15, x + width * 0.65, bottomY);
  shape.closePath();
  texturedShape(
    ctx,
    shape,
    color,
    "rgba(255, 251, 242, 0.18)",
    { x: x - width * 0.6, y: peakY, width: width * 1.2, height: bottomY - peakY },
    130,
    random,
  );
  ctx.beginPath();
  ctx.moveTo(x, peakY);
  ctx.lineTo(x - width * 0.13, peakY + width * 0.09);
  ctx.lineTo(x - width * 0.035, peakY + width * 0.065);
  ctx.lineTo(x + width * 0.08, peakY + width * 0.1);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 247, 232, 0.68)";
  ctx.fill();
}

function hill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  top: number,
  crest: number,
  fill: string,
  stroke: string,
  random: Random,
  count: number,
) {
  const shape = new Path2D();
  shape.moveTo(0, top);
  shape.bezierCurveTo(width * 0.2, top - crest, width * 0.32, top + crest, width * 0.52, top - crest * 0.2);
  shape.bezierCurveTo(width * 0.75, top - crest * 1.45, width * 0.84, top + crest * 0.5, width, top - crest * 0.25);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.closePath();
  texturedShape(ctx, shape, fill, stroke, { x: 0, y: top - crest * 1.5, width, height: height - top + crest * 1.5 }, count, random);
}

function tree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  radius: number,
  random: Random,
) {
  const crownY = baseY - height * 0.68;
  const trunkWidth = radius * 0.27;
  ctx.save();

  const trunk = new Path2D();
  trunk.moveTo(x - trunkWidth * 0.7, baseY);
  trunk.bezierCurveTo(x - trunkWidth * 0.45, crownY + radius * 0.85, x - trunkWidth * 0.2, crownY + radius * 0.3, x - trunkWidth * 0.36, crownY);
  trunk.lineTo(x + trunkWidth * 0.38, crownY);
  trunk.bezierCurveTo(x + trunkWidth * 0.12, crownY + radius * 0.6, x + trunkWidth * 0.6, baseY - radius * 0.5, x + trunkWidth * 0.85, baseY);
  trunk.closePath();
  ctx.fillStyle = "#a65b30";
  ctx.fill(trunk);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#8c4c2b";
  ctx.lineWidth = Math.max(2, trunkWidth * 0.28);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, crownY + radius * 0.9);
    ctx.quadraticCurveTo(x + side * radius * 0.22, crownY + radius * 0.2, x + side * radius * 0.72, crownY - radius * 0.08);
    ctx.stroke();
  }
  ctx.save();
  ctx.clip(trunk);
  for (let i = 0; i < 35; i++) {
    const px = x + (random() - 0.5) * trunkWidth * 2;
    const py = crownY + random() * (baseY - crownY);
    crayonStroke(ctx, px, py, random() * trunkWidth * 0.5, "rgba(255, 208, 145, 0.35)", 0.7 + random() * 1.2);
  }
  ctx.restore();

  const canopy = new Path2D();
  for (const [dx, dy, rx, ry] of [
    [-0.53, 0.15, 0.5, 0.54],
    [-0.24, -0.34, 0.55, 0.56],
    [0.3, -0.28, 0.58, 0.58],
    [0.61, 0.2, 0.43, 0.48],
    [0, 0.28, 0.68, 0.52],
  ]) {
    canopy.ellipse(x + dx * radius, crownY + dy * radius, rx * radius, ry * radius, 0, 0, Math.PI * 2);
  }
  const leafGradient = ctx.createRadialGradient(x - radius * 0.3, crownY - radius * 0.5, radius * 0.1, x, crownY, radius * 1.25);
  leafGradient.addColorStop(0, "#c4e870");
  leafGradient.addColorStop(0.55, "#67b34f");
  leafGradient.addColorStop(1, "#308652");
  ctx.fillStyle = leafGradient;
  ctx.fill(canopy);
  ctx.save();
  ctx.clip(canopy);
  for (let i = 0; i < 470; i++) {
    const px = x + (random() - 0.5) * radius * 2.4;
    const py = crownY + (random() - 0.5) * radius * 1.9;
    const color = random() > 0.55 ? "rgba(236, 246, 145, 0.55)" : "rgba(29, 103, 58, 0.25)";
    crayonStroke(ctx, px, py, 2 + random() * radius * 0.08, color, 1 + random() * 2.4);
  }
  ctx.restore();
  ctx.restore();
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = "#528d3b";
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.beginPath();
  ctx.moveTo(x, y + size * 1.8);
  ctx.quadraticCurveTo(x + size * 0.1, y + size * 0.8, x, y);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * size * 0.57, y + Math.sin(angle) * size * 0.57, size * 0.5, size * 0.33, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, size * 0.33, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd55c";
  ctx.fill();
}

function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const random = seededRandom(4628);
  const unit = Math.min(width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.75);
  sky.addColorStop(0, "#2489e5");
  sky.addColorStop(0.54, "#78c5f5");
  sky.addColorStop(1, "#d1edee");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 650; i++) {
    const x = random() * width;
    const y = random() * height * 0.72;
    crayonStroke(ctx, x, y, 4 + random() * 18, "rgba(238, 249, 255, 0.14)", 0.5 + random() * 1.3);
  }

  const sunX = width * 0.72;
  const sunY = height * 0.17;
  const sunRadius = unit * 0.065;
  const glow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.25, sunX, sunY, sunRadius * 2.3);
  glow.addColorStop(0, "rgba(255, 242, 166, 0.65)");
  glow.addColorStop(1, "rgba(255, 242, 166, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff2b3";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 0.72, 0, Math.PI * 2);
  ctx.fill();

  cloud(ctx, width * 0.19, height * 0.2, unit * 0.17);
  cloud(ctx, width * 0.84, height * 0.31, unit * 0.13);
  cloud(ctx, width * 0.51, height * 0.35, unit * 0.08);

  mountain(ctx, width * 0.13, height * 0.53, width * 0.49, height * 0.75, "#b9b4e7", random);
  mountain(ctx, width * 0.48, height * 0.58, width * 0.48, height * 0.76, "#9f9bd9", random);
  mountain(ctx, width * 0.78, height * 0.51, width * 0.55, height * 0.77, "#aaa4e3", random);

  hill(ctx, width, height, height * 0.69, height * 0.052, "#80bc73", "rgba(233, 244, 153, 0.3)", random, 650);
  hill(ctx, width, height, height * 0.77, height * 0.057, "#60ac62", "rgba(23, 113, 67, 0.26)", random, 950);
  hill(ctx, width, height, height * 0.87, height * 0.052, "#9ace5b", "rgba(250, 241, 133, 0.35)", random, 1250);

  tree(ctx, width * 0.055, height * 0.95, height * 0.47, unit * 0.16, random);
  tree(ctx, width * 0.95, height * 0.96, height * 0.48, unit * 0.16, random);
  tree(ctx, width * 0.23, height * 0.87, height * 0.29, unit * 0.092, random);
  tree(ctx, width * 0.79, height * 0.88, height * 0.28, unit * 0.088, random);

  const flowerColors = ["#f69ab9", "#fff9eb", "#f7d45a", "#c6a4ec"];
  for (let i = 0; i < 115; i++) {
    const y = height * (0.75 + random() * 0.27);
    const size = unit * (0.002 + (y / height - 0.75) * 0.024) * (0.6 + random() * 0.8);
    flower(ctx, random() * width, y, size, flowerColors[Math.floor(random() * flowerColors.length)]);
  }
}

export default function LifeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const redraw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawScene(ctx, width, height);
    };

    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    redraw();
    return () => observer.disconnect();
  }, []);

  return (
    <main className="life-scene" aria-label="A hand-drawn canvas fantasy landscape">
      <canvas
        ref={canvasRef}
        className="life-canvas"
        role="img"
        aria-label="Blue sky, clouds, lavender mountains, green hills, flowering grass, and trees"
      />
      <LifeModeSwitch current="canvas" />
    </main>
  );
}
