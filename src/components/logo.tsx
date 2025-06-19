'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure consistent rendering between server and client
  if (!mounted) {
    return (
      <div 
        className={`rounded-lg bg-gradient-to-br from-primary to-accent flex-shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // Fallback gradient logo if image fails to load
  if (imageError) {
    return (
      <div 
        className={`rounded-lg flex-shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-white font-bold text-sm">S</span>
      </div>
    );
  }

  return (
    <img 
      src="/logo.webp" 
      alt="SkillSprint Logo" 
      width={size} 
      height={size} 
      className={`rounded-lg flex-shrink-0 transition-all duration-200 hover:scale-105 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={() => setImageError(true)}
    />
  );
}
