// Adapted from React Bits. See LICENSE.md and ATTRIBUTION.md.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import useVisualActivity from "../../hooks/useVisualActivity";
import "./WarpText.css";
const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture(uTextTexture, uv);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);

  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;

  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);

  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;

  vec2 displaced = uv + ambient + pointerWarp;
  vec2 splitDir = ambient + pointerWarp;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);

  vec4 base = sampleText(displaced);
  float r = sampleText(displaced + split).r;
  float g = base.g;
  float b = sampleText(displaced - split).b;
  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);

  vec3 color = vec3(r, g, b) + lens * base.a * 0.055;
  fragColor = vec4(color, a);
}
`;

const getFontValue = (value) =>
  typeof value === "number" ? `${value}px` : value;

const measureLine = (ctx, line, letterSpacing) => {
  const chars = Array.from(line);
  const textWidth = chars.reduce(
    (width, char) => width + ctx.measureText(char).width,
    0,
  );
  return textWidth + Math.max(0, chars.length - 1) * letterSpacing;
};

const drawLine = (ctx, line, x, y, letterSpacing) => {
  const chars = Array.from(line);
  let cursor = x - measureLine(ctx, line, letterSpacing) / 2;

  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor +=
      ctx.measureText(char).width +
      (index === chars.length - 1 ? 0 : letterSpacing);
  });
};

const buildTextCanvas = ({ container, width, height, dpr, props }) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const probe = document.createElement("span");
  probe.textContent = props.text;
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    whiteSpace: "pre",
    inset: "0 auto auto 0",
    fontFamily: props.fontFamily,
    fontSize: getFontValue(props.fontSize),
    fontWeight: String(props.fontWeight),
    letterSpacing: getFontValue(props.letterSpacing),
    lineHeight:
      typeof props.lineHeight === "number"
        ? String(props.lineHeight)
        : props.lineHeight,
  });
  container.appendChild(probe);
  const computed = window.getComputedStyle(probe);
  let fontSizePx = parseFloat(computed.fontSize) || 96;
  const fontFamily = computed.fontFamily || "sans-serif";
  const fontWeight = computed.fontWeight || String(props.fontWeight);
  let letterSpacing =
    computed.letterSpacing === "normal"
      ? 0
      : parseFloat(computed.letterSpacing) || 0;
  let lineHeight = parseFloat(computed.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    lineHeight =
      fontSizePx *
      (typeof props.lineHeight === "number" ? props.lineHeight : 0.92);
  }
  probe.remove();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = props.color;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const lines = String(props.text || "").split("\n");
  const applyFont = () => {
    ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  };
  applyFont();

  const maxWidth = width * 0.86;
  const maxHeight = height * 0.78;
  const widest = Math.max(
    ...lines.map((line) => measureLine(ctx, line, letterSpacing)),
    1,
  );
  const blockHeight = Math.max(lineHeight * lines.length, 1);
  const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

  if (fit < 1) {
    fontSizePx *= fit;
    letterSpacing *= fit;
    lineHeight *= fit;
    applyFont();
  }

  const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
  lines.forEach((line, index) =>
    drawLine(
      ctx,
      line,
      width * 0.04 + measureLine(ctx, line, letterSpacing) / 2,
      startY + index * lineHeight,
      letterSpacing,
    ),
  );

  return canvas;
};

export default function WarpText({
  text = "Campusdesk",
  color = "#f8f5ff",
  warpStrength = 0.08,
  warpScale = 1.7,
  speed = 0.55,
  pointerInfluence = 0.42,
  pointerStrength = 0.38,
  refraction = 0.018,
  ripple = true,
  fontSize = 60,
  fontWeight = 700,
  fontFamily = "inherit",
  letterSpacing = "-0.03em",
  lineHeight = 1.1,
  className = "",
  style,
}) {
  const rootRef = useRef(null);
  const { interactive } = useVisualActivity(rootRef);
  useEffect(() => {
    const container = rootRef.current;
    if (!interactive || !container) return;
    const props = {
      text,
      color,
      warpStrength,
      warpScale,
      speed,
      pointerInfluence,
      pointerStrength,
      refraction,
      ripple,
      fontSize,
      fontWeight,
      fontFamily,
      letterSpacing,
      lineHeight,
    };
    let renderer, gl, texture, geometry, program, mesh;
    let disposed = false;
    let lost = false;
    let frame = 0;
    let rasterVersion = 0;
    const release = () => {
      cancelAnimationFrame(frame);
      delete container.dataset.rendered;
      if (gl) {
        if (!lost) {
          if (texture?.texture) gl.deleteTexture(texture.texture);
          geometry?.remove();
          program?.remove();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
        gl.canvas.remove();
      }
    };
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      texture = new Texture(gl, {
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });
      geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex,
        fragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTextTexture: { value: texture },
          uResolution: { value: new Float32Array([1, 1]) },
          uPointer: { value: new Float32Array([0.5, 0.5]) },
          uPointerActive: { value: 0 },
          uTime: { value: 0 },
          uMotion: { value: 1 },
          uWarpStrength: { value: warpStrength },
          uWarpScale: { value: warpScale },
          uSpeed: { value: speed },
          uPointerInfluence: { value: pointerInfluence },
          uPointerStrength: { value: pointerStrength },
          uRefraction: { value: refraction },
          uRipple: { value: ripple ? 1 : 0 },
        },
      });
      if (!gl.getProgramParameter(program.program, gl.LINK_STATUS))
        throw new Error("Shader unavailable");
      mesh = new Mesh(gl, { geometry, program });
    } catch {
      release();
      return;
    }
    const canvas = gl.canvas;
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, target: 0 };
    const start = performance.now();
    const draw = () => {
      if (disposed || lost || !texture.image) return;
      renderer.render({ scene: mesh });
      container.dataset.rendered = "true";
    };
    const rasterize = async () => {
      const version = ++rasterVersion;
      await document.fonts?.ready;
      if (disposed || lost || version !== rasterVersion) return;
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value.set([
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ]);
      texture.image = buildTextCanvas({
        container,
        width,
        height,
        dpr: renderer.dpr,
        props,
      });
      texture.needsUpdate = true;
      draw();
    };
    const loop = (now) => {
      if (disposed || lost) return;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      pointer.active += (pointer.target - pointer.active) * 0.08;
      program.uniforms.uPointer.value.set([pointer.x, pointer.y]);
      program.uniforms.uPointerActive.value = pointer.active;
      program.uniforms.uTime.value = (now - start) / 1000;
      draw();
      frame = requestAnimationFrame(loop);
    };
    const move = (event) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
      pointer.target = 1;
    };
    const leave = () => {
      pointer.target = 0;
    };
    const contextLost = (event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      delete container.dataset.rendered;
      canvas.style.visibility = "hidden";
    };
    const observer = new ResizeObserver(rasterize);
    observer.observe(container);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", contextLost);
    rasterize();
    frame = requestAnimationFrame(loop);
    return () => {
      disposed = true;
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", contextLost);
      release();
    };
  }, [
    interactive,
    text,
    color,
    warpStrength,
    warpScale,
    speed,
    pointerInfluence,
    pointerStrength,
    refraction,
    ripple,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
    lineHeight,
  ]);

  return (
    <div
      ref={rootRef}
      className={`warp-text ${className}`}
      role="img"
      aria-label={text}
      style={{
        ...style,
        color,
        fontSize,
        fontWeight,
        fontFamily,
        letterSpacing,
        lineHeight,
      }}
    >
      <span className="warp-text-fallback" aria-hidden="true">
        {text}
      </span>
    </div>
  );
}
