"use client";

import React, { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Number of dialogs open at once, so page scrolling is only unlocked when the last one closes.
let openDialogs = 0;
let previousOverflow = "";

interface DialogProps {
  /** Called on Escape, on a click outside the panel, and by anything inside that wants to close. */
  onClose: () => void;
  /** Accessible name when the dialog has no visible heading (otherwise pass labelledBy). */
  label?: string;
  labelledBy?: string;
  /** Classes for the dimmed full-screen layer (position, z-index, backdrop, padding). */
  overlayClassName?: string;
  /** Classes for the panel itself. */
  className?: string;
  /** Set false for dialogs that must not be dismissed by a click outside (e.g. while a scan runs). */
  closeOnOverlayClick?: boolean;
  /** Set false for dialogs that must not close on Escape. */
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

/**
 * The behaviour shared by every modal: focus moves in on open and returns on close, the page behind
 * doesn't scroll, Escape closes, Tab stays inside. Attach `ref` to the panel and `onKeyDown` to it
 * (or any ancestor). Use <Dialog> unless the panel needs its own animation wrapper.
 */
export function useDialogBehavior({ onClose, closeOnEscape = true }: { onClose: () => void; closeOnEscape?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const panel = panelRef.current;
    const returnTo = document.activeElement as HTMLElement | null;

    if (openDialogs === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openDialogs += 1;

    // Move focus inside unless something in the panel already grabbed it (autoFocus).
    if (panel && !panel.contains(document.activeElement)) {
      (panel.querySelector<HTMLElement>(FOCUSABLE) || panel).focus();
    }

    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = previousOverflow;
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && closeOnEscape) {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { panelRef, onKeyDown, onCloseRef };
}

/**
 * One accessible modal for the whole app: role="dialog", Escape closes, Tab stays inside,
 * focus moves in on open and goes back to where it was on close, the page behind doesn't scroll.
 */
export default function Dialog({
  onClose,
  label,
  labelledBy,
  overlayClassName = "fixed inset-0 z-[999] flex items-center justify-center bg-[#0f1c18]/55 backdrop-blur-sm p-4",
  className = "",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
}: DialogProps) {
  const { panelRef, onKeyDown, onCloseRef } = useDialogBehavior({ onClose, closeOnEscape });

  return (
    <div
      className={overlayClassName}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
