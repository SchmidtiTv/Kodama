import { useCallback, useRef, useState } from "react";

// Keep conditionally mounted modals alive long enough for react-aria's exit animation.
// Keep this duration in sync with .modal__container[data-exiting].
const EXIT_MS = 200;

export function useAnimatedClose(onClose) {
  const [isOpen, setIsOpen] = useState(true);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsOpen(false);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  return [isOpen, close];
}
