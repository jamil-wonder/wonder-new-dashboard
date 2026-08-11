"use client";

import { motion } from "framer-motion";
import { WonderscoreSpinner } from "../ui/WonderscoreSpinner";

export default function AdminPageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf8f3]"
    >
      <WonderscoreSpinner size={64} color="#15463b" label="Loading admin dashboard..." />
    </motion.div>
  );
}

// Used inside a panel's own body (tab switches, refetches) — sits in the
// content area only, doesn't cover the header/tab nav like AdminPageLoader.
export function AdminSectionLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center py-24"
    >
      <WonderscoreSpinner size={48} color="#15463b" label={label} />
    </motion.div>
  );
}
