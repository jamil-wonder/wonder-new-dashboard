"use client";

import React from "react";
import { motion } from "framer-motion";

interface WonderscoreSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export function WonderscoreLogo({ size = 32, color = "#15463b", className = "" }: WonderscoreSpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <path d="M12 1 C12.6 6.7 17.3 11.4 23 12 C17.3 12.6 12.6 17.3 12 23 C11.4 17.3 6.7 12.6 1 12 C6.7 11.4 11.4 6.7 12 1 Z" />
    </svg>
  );
}

export function WonderscoreSpinner({ size = 32, color = "#15463b", label }: WonderscoreSpinnerProps & { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <WonderscoreLogo size={size} color={color} />
      </motion.div>
      {label && (
        <span className="text-[13px] font-semibold text-[#8a8273] tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}

export function WonderscoreEmptyState({
  title = "No data found",
  description = "There is currently no information to display here.",
  actionButton,
}: {
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#ece3d1] rounded-[18px] bg-[#fdfcf8] my-4">
      <div className="w-12 h-12 rounded-full bg-[#f5f0e6] flex items-center justify-center mb-3">
        <WonderscoreLogo size={24} color="#15463b" />
      </div>
      <h3 className="font-spectral text-[18px] font-semibold text-[#15463b] mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-[#8a8273] max-w-[380px] mb-4 leading-relaxed">
        {description}
      </p>
      {actionButton}
    </div>
  );
}
