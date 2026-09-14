import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./ColorBends.css";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uFrequency;
uniform float uNoise;
uniform float uBandWidth;
uniform float uIntensity;
uniform float uRotation;
uniform float uFadeTop;
uniform vec2 uPointer;
uniform vec3 uColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= uResolution.x / max(uResolution.y, 1.0);
  float s = sin(uRotation);
  float c = cos(uRotation);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  p += uPointer * 0.08;

  float wave = sin(p.x * uFrequency + sin(p.y * 2.1 + t) * 1.4 + t * 0.7);
  wave += sin(p.y * (uFrequency * 0.72) - t * 0.45 + p.x * 1.7) * 0.65;
  wave += noise(p * 2.4 + t * 0.12) * uNoise;
  float waveShape = abs(sin(wave * 2.2));
  float ribbons = exp(-pow(waveShape / max(uBandWidth * 2.8, 0.08), 2.0));
  float halo = exp(-pow(waveShape / 0.58, 2.0));
  float vignette = 1.0 - smoothstep(0.15, 1.7, length(p * vec2(0.72, 0.95)));
  float topFade = 1.0 - smoothstep(uFadeTop, 1.0, vUv.y);
  vec3 green = vec3(0.012, 0.042, 0.032);
  vec3 color = green + uColor * (0.035 + ribbons * 0.55 + halo * 0.12 + vignette * 0.08) * topFade;
  color *= uIntensity;
  gl_FragColor = vec4(color, 0.72);
}
`;

export default function ColorBends({
  color = "#DEF4A0",
  speed = 0.2,
  frequency = 1.0,
  noise = 0.15,
  bandWidth = 0.14,
  rotation = 90,
  intensity = 1.1,
  fadeTop = 0.75,
}) {
  const containerRef = useRef(null);
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: reducedMotion ? 0 : speed },
        uFrequency: { value: frequency },
        uNoise: { value: noise },
        uBandWidth: { value: bandWidth },
        uIntensity: { value: intensity },
        uRotation: { value: (rotation * Math.PI) / 180 },
        uFadeTop: { value: fadeTop },
        uPointer: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x071c16, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const pointerMove = (event) => {
      material.uniforms.uPointer.value.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener("pointermove", pointerMove, { passive: true });

    let visible = true;
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(container);

    const clock = new THREE.Clock();
    let frame;
    const render = () => {
      const delta = clock.getDelta();
      if (visible && !document.hidden) {
        material.uniforms.uTime.value += delta;
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", pointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      container.removeChild(renderer.domElement);
    };
  }, [
    bandWidth,
    color,
    frequency,
    intensity,
    fadeTop,
    noise,
    reducedMotion,
    rotation,
    speed,
  ]);

  return <div ref={containerRef} className="color-bends-container" />;
}
