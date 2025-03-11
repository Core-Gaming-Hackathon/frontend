"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ContainerScrollProps {
  children: React.ReactNode;
  titleComponent: React.ReactNode;
  className?: string;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  children,
  titleComponent,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setIsInView] = useState(false);

  // Check if the container is in view
  useEffect(() => {
    const currentContainer = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform scrollYProgress to scale and opacity for animation
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.3, 1]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <motion.div
        style={{ scale, opacity }}
        className="pb-8"
      >
        {titleComponent}
      </motion.div>
      <div className="mt-8">{children}</div>
    </div>
  );
};
