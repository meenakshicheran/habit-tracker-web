'use client';

import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

interface ConfettiProps {
  fire: boolean;
}

export function Confetti({ fire }: ConfettiProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!fire || firedRef.current) return;
    firedRef.current = true;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#4f46e5', '#818cf8', '#a5b4fc', '#ffffff'],
    });
  }, [fire]);

  useEffect(() => {
    if (!fire) firedRef.current = false;
  }, [fire]);

  return null;
}
