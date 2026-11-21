import { useCallback, useState } from 'react';

/** Open/closed state for dialogs, panels and menus. */
export function useDisclosure(initiallyOpen = false) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);
  return { isOpen, open, close, toggle };
}
