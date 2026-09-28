// Adapted from Componentry's magnetic-dock (MIT, Harsh Jadhav).
// Source and license: ./COMPONENTRY-LICENSE.md
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import "./magnetic-dock.css";

const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };

function DockItem({ item, mouseX, maxScale, magneticDistance, animated }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Measure the fixed slot, so magnification never moves its own target.
  const distance = useTransform(mouseX, (position) => {
    if (!ref.current) return magneticDistance + 1;
    const rect = ref.current.getBoundingClientRect();
    return position - rect.left - rect.width / 2;
  });
  const scale = useTransform(
    distance,
    [-magneticDistance, 0, magneticDistance],
    [1, maxScale, 1],
  );
  const smoothScale = useSpring(scale, springConfig);
  const y = useTransform(smoothScale, (value) => (value - 1) * -18);
  const showLabel = !dismissed && (hovered || focused);
  const unreadLabel = item.badge ? `, ${item.badge} unread updates` : "";

  return (
    <li className="magnetic-dock-slot" ref={ref}>
      <Link
        to={item.to}
        className={"magnetic-dock-link" + (item.isActive ? " is-active" : "")}
        aria-label={item.label + unreadLabel}
        aria-current={item.isActive ? "page" : undefined}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => {
          setFocused(false);
          setDismissed(false);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            setHovered(true);
            setDismissed(false);
          }
        }}
        onPointerLeave={() => {
          setHovered(false);
          setDismissed(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDismissed(true);
            event.stopPropagation();
          }
        }}
      >
        <motion.span
          className="magnetic-dock-tile"
          style={{ scale: animated ? smoothScale : 1, y: animated ? y : 0 }}
        >
          <span className="magnetic-dock-icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.badge > 0 && (
            <span className="magnetic-dock-badge" aria-hidden="true">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
          {item.isActive && (
            <span className="magnetic-dock-indicator" aria-hidden="true" />
          )}
        </motion.span>
        <span className="magnetic-dock-caption" aria-hidden="true">
          {item.shortLabel || item.label}
        </span>
        <span
          className={"magnetic-dock-tooltip" + (showLabel ? " is-visible" : "")}
          aria-hidden="true"
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}

export function MagneticDock({
  items,
  maxScale = 1.45,
  magneticDistance = 150,
}) {
  const mouseX = useMotionValue(Infinity);
  const reducedMotion = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 701px) and (hover: hover) and (pointer: fine)",
    );
    const update = () => {
      setFinePointer(media.matches);
      mouseX.set(Infinity);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mouseX]);
  const animated = finePointer && !reducedMotion;
  useEffect(() => {
    mouseX.set(Infinity);
  }, [animated, mouseX]);

  const navigateWithKeys = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const links = [
      ...event.currentTarget.querySelectorAll(".magnetic-dock-link"),
    ];
    const current = links.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (current + 1) % links.length;
    if (event.key === "ArrowLeft")
      next = (current - 1 + links.length) % links.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = links.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      links[next].focus();
    }
  };

  return (
    <nav
      className="magnetic-dock"
      aria-label="Dock navigation"
      onKeyDown={navigateWithKeys}
      onPointerMove={
        animated
          ? (event) => {
              if (event.pointerType === "mouse") mouseX.set(event.clientX);
            }
          : undefined
      }
      onPointerLeave={() => mouseX.set(Infinity)}
    >
      <ul>
        {items.map((item) => (
          <DockItem
            key={item.id}
            item={item}
            mouseX={mouseX}
            maxScale={maxScale}
            magneticDistance={magneticDistance}
            animated={animated}
          />
        ))}
      </ul>
    </nav>
  );
}
