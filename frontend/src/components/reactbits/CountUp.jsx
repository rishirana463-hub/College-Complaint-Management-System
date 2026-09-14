// Adapted from React Bits CountUp: https://reactbits.dev/text-animations/count-up
// Uses the existing Framer Motion dependency and disables animation for reduced motion.
import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
export default function CountUp({ to, duration = 1.4 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const value = useMotionValue(0);
  const spring = useSpring(value, {
    damping: 20 + 40 / duration,
    stiffness: 100 / duration,
  });
  const visible = useInView(ref, { once: true });
  useEffect(() => {
    if (reduced) {
      if (ref.current) ref.current.textContent = to.toLocaleString();
      return;
    }
    if (visible) value.set(to);
  }, [to, visible, value, reduced]);
  useEffect(() => {
    if (reduced) return;
    return spring.on("change", (latest) => {
      if (ref.current)
        ref.current.textContent = Math.round(latest).toLocaleString();
    });
  }, [spring, reduced]);
  return (
    <>
      <span aria-hidden="true" ref={ref}>
        {reduced ? to.toLocaleString() : "0"}
      </span>
      <span className="sr-only">{to.toLocaleString()}</span>
    </>
  );
}
