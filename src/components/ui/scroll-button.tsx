"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const ScrollButton = () => {
  const scrollToNextSection = () => {
    if (typeof window !== 'undefined') {
      const viewportHeight = window.innerHeight;
      window.scrollTo({
        top: viewportHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.button
      onClick={scrollToNextSection}
      className="flex items-center justify-center w-12 h-12 rounded-full bg-background border border-border hover:border-primary/50 shadow-lg hover:shadow-xl transition-all"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      whileTap={{ y: 0 }}
    >
      <ChevronDown className="w-5 h-5 text-muted-foreground" />
    </motion.button>
  );
};
