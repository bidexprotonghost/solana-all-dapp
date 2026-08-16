"use client";

import { useState } from 'react';

export default function PauseToggle() {
  const [paused, setPaused] = useState(false);

  const handleToggle = () => {
    setPaused((prev) => !prev);
  };

  return (
    <button
      onClick={handleToggle}
      className={`rounded-xl px-4 py-2 font-medium transition ${
        paused
          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
      }`}
    >
      {paused ? 'Resume Contract' : 'Pause Contract'}
    </button>
  );
}
