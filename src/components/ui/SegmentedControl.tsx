"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";

export interface SegmentedOption {
  id: string;
  label: string;
  /** Extra content shown before the label (an icon). */
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  /** What the group is for, read out by screen readers ("AI model", "Result status"). */
  ariaLabel: string;
  /**
   * "tabs": switches what's shown below - Arrow keys move between tabs, Enter / Space opens one.
   * "choice": picks one value from a set (filters) - Arrow keys pick directly.
   */
  kind?: "tabs" | "choice";
  /** Classes for the track that holds the buttons. */
  className?: string;
  /** Classes for each button; receives whether it's the selected one. */
  itemClassName: (active: boolean) => string;
  itemStyle?: (active: boolean) => React.CSSProperties | undefined;
  /** If set, the selected button gets a gliding highlight with these classes (framer-motion layoutId = gliderId). */
  gliderId?: string;
  gliderClassName?: string;
  /** Custom button content; defaults to icon + label. */
  renderOption?: (option: SegmentedOption, active: boolean) => React.ReactNode;
}

/**
 * Real <button>s in a tablist / radiogroup: one Tab stop for the whole group, Arrow / Home / End
 * keys inside it, visible focus ring, selected state announced.
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  kind = "tabs",
  className,
  itemClassName,
  itemStyle,
  gliderId,
  gliderClassName = "absolute inset-0 rounded-md bg-[#15463b] shadow-xs",
  renderOption,
}: SegmentedControlProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  // Exactly one button is in the tab order: the selected one (or the first, if nothing matches).
  const selectedIndex = options.findIndex((o) => o.id === value);
  const tabStop = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];

  const move = (from: number, step: number | "first" | "last") => {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(from);
    let target: number;
    if (step === "first") target = enabled[0];
    else if (step === "last") target = enabled[enabled.length - 1];
    else target = enabled[(pos + step + enabled.length) % enabled.length];
    refs.current[target]?.focus();
    if (kind === "choice") onChange(options[target].id);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(index, 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(index, -1);
    else if (e.key === "Home") move(index, "first");
    else if (e.key === "End") move(index, "last");
    else return;
    e.preventDefault();
  };

  const tabs = kind === "tabs";

  return (
    <div role={tabs ? "tablist" : "radiogroup"} aria-label={ariaLabel} className={className}>
      {options.map((opt, i) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role={tabs ? "tab" : "radio"}
            aria-selected={tabs ? active : undefined}
            aria-checked={tabs ? undefined : active}
            disabled={opt.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`${itemClassName(active)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15463b]`}
            style={itemStyle?.(active)}
          >
            {gliderId && active && (
              <motion.span
                layoutId={gliderId}
                className={gliderClassName}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                style={{ zIndex: -1 }}
              />
            )}
            {renderOption ? (
              renderOption(opt, active)
            ) : (
              <>
                {opt.icon}
                <span className="relative z-10">{opt.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
