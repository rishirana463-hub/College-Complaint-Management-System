// Adapted from React Bits. See LICENSE.md and ATTRIBUTION.md.
import { useRef } from "react";
import "./BorderGlow.css";
function parseHSL(hslStr) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] =
      `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
];
const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] =
      `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

export default function BorderGlow({
  as: Tag = "div",
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "245 80 80",
  backgroundColor = "var(--surface)",
  borderRadius = 16,
  glowRadius = 24,
  glowIntensity = 0.7,
  coneSpread = 25,
  colors = ["#c084fc", "#a9b1fb", "#38bdf8"],
  fillOpacity = 0.08,
  ...rest
}) {
  const cardRef = useRef(null);
  const move = (event) => {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia(
        "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
      ).matches
    )
      return;
    const card = cardRef.current;
    const { left, top, width, height } = card.getBoundingClientRect();
    const dx = event.clientX - left - width / 2;
    const dy = event.clientY - top - height / 2;
    const proximity = Math.min(
      1,
      Math.max(Math.abs(dx) / (width / 2), Math.abs(dy) / (height / 2)),
    );
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    card.style.setProperty("--edge-proximity", String(proximity * 100));
    card.style.setProperty("--cursor-angle", `${angle}deg`);
  };
  return (
    <Tag
      {...rest}
      ref={cardRef}
      className={`border-glow-card ${className}`}
      onPointerMove={move}
      onPointerLeave={() =>
        cardRef.current?.style.setProperty("--edge-proximity", "0")
      }
      style={{
        "--card-bg": backgroundColor,
        "--edge-sensitivity": edgeSensitivity,
        "--border-radius": `${borderRadius}px`,
        "--glow-padding": `${glowRadius}px`,
        "--cone-spread": coneSpread,
        "--fill-opacity": fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" aria-hidden="true" />
      {children}
    </Tag>
  );
}
