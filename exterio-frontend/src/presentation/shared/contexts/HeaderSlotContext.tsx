import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type SlotElement = HTMLElement | null;

interface HeaderSlotContextType {
  slot: SlotElement;
  setSlot: (element: SlotElement) => void;
}

const HeaderSlotContext = createContext<HeaderSlotContextType | undefined>(undefined);

/**
 * Lets a page put its own navigation into the app header (the studio puts its stepper there),
 * without the layout knowing about pages. The header marks where with `HeaderSlotTarget`; a
 * page fills it with `HeaderSlot`.
 */
export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<SlotElement>(null);
  return (
    <HeaderSlotContext.Provider value={{ slot, setSlot }}>{children}</HeaderSlotContext.Provider>
  );
}

function useHeaderSlotContext(): HeaderSlotContextType {
  const context = useContext(HeaderSlotContext);
  if (!context) {
    throw new Error('Header slots must be used inside a HeaderSlotProvider');
  }
  return context;
}

/** Where page content appears in the header. Rendered once, by the header. */
export function HeaderSlotTarget({ className }: { className?: string }) {
  const { setSlot } = useHeaderSlotContext();
  return <div ref={setSlot} className={className} />;
}

/** Renders its children into the header while the page that uses it is shown. */
export function HeaderSlot({ children }: { children: ReactNode }) {
  const { slot } = useHeaderSlotContext();
  return slot ? createPortal(children, slot) : null;
}
