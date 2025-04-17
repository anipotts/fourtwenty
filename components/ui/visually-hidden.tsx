import React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
}

/**
 * VisuallyHidden component
 *
 * Renders content that is visually hidden but still accessible to screen readers.
 * Based on the styles from Tailwind Visually Hidden utility.
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span
      className="absolute h-px w-px p-0 m-0 overflow-hidden clip whitespace-nowrap border-0"
      style={{
        clip: "rect(0, 0, 0, 0)",
        clipPath: "inset(50%)",
      }}
    >
      {children}
    </span>
  );
}
