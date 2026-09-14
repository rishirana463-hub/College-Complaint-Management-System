// Adapted from React Bits SpotlightCard: https://reactbits.dev/components/spotlight-card
import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(130, 185, 140, 0.13)",
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  return (
    <div
      ref={ref}
      className={"card-spotlight " + className}
      style={{ "--spotlight-color": spotlightColor }}
      onPointerMove={
        reduced
          ? undefined
          : (event) => {
              if (event.pointerType === "touch") return;
              const rect = ref.current.getBoundingClientRect();
              ref.current.style.setProperty(
                "--mouse-x",
                event.clientX - rect.left + "px",
              );
              ref.current.style.setProperty(
                "--mouse-y",
                event.clientY - rect.top + "px",
              );
            }
      }
    >
      {children}
    </div>
  );
}
