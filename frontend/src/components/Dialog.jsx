import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = "",
}) {
  const ref = useRef(null);
  const previousFocus = useRef(null);
  const previousOverflow = useRef("");
  const reduced = useReducedMotion();
  const close = () => {
    if (!ref.current?.open) return;
    ref.current.close();
    document.body.style.overflow = previousOverflow.current;
    if (previousFocus.current?.isConnected) previousFocus.current.focus();
  };
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement;
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
    }
    if (!open && dialog.open) {
      const timer = setTimeout(close, reduced ? 0 : 160);
      return () => clearTimeout(timer);
    }
  }, [open, reduced]);
  useEffect(() => () => close(), []);
  return (
    <dialog
      ref={ref}
      className={"dialog " + className}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            className="dialog-content"
            initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.14 }}
          >
            <div className="dialog-header">
              <h2>{title}</h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
