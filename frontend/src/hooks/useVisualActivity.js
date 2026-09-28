import { useEffect, useState } from "react";

// Decorative work only runs while its surface is visible and motion is welcome.
export default function useVisualActivity(ref) {
  const [activity, setActivity] = useState({
    visible: false,
    interactive: false,
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    let inView = false;
    const update = () => {
      const visible = inView && !document.hidden;
      setActivity({ visible, interactive: visible && media.matches });
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.boundingClientRect.width > 0;
      update();
    });
    observer.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return activity;
}
