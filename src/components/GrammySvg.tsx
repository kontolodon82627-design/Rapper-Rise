import React from 'react';

export const GrammySvg = ({ className = "w-6 h-6", fill = "currentColor" }: { className?: string, fill?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill={fill} stroke={fill} strokeWidth="2" strokeLinejoin="round">
      {/* Base */}
      <polygon points="20,85 80,85 85,95 15,95" />
      <rect x="25" y="75" width="50" height="10" />
      
      {/* Box / Arm mount */}
      <rect x="35" y="55" width="30" height="20" rx="2" />
      <path d="M45 55 L35 35" strokeWidth="4" />
      
      {/* Horn/Bell */}
      <path d="M35 35 C35 15 65 5 85 15 C85 45 65 55 35 35" fill="none" strokeWidth="4" />
      <ellipse cx="80" cy="28" rx="10" ry="25" fill="none" strokeWidth="3" transform="rotate(20 80 28)" />
      
      {/* Details/lines inside horn */}
      <path d="M45 33 L70 15 M43 36 L78 28 M45 39 L68 45" strokeWidth="1" />
    </g>
  </svg>
);
