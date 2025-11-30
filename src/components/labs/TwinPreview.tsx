'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { TWIN_FRAMES } from '@/content/twinFrames';

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const useFramePreloader = () => {
  useEffect(() => {
    const handles: HTMLImageElement[] = [];

    TWIN_FRAMES.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
      handles.push(img);
    });

    return () => {
      handles.forEach((img) => {
        img.src = '';
      });
    };
  }, []);
};

const resolveFrameForBlend = (blend: number) => {
  const frameCount: number = TWIN_FRAMES.length;
  if (!frameCount) return null;
  if (frameCount === 1) return TWIN_FRAMES[0];

  const index = Math.min(frameCount - 1, Math.round(clamp01(blend) * (frameCount - 1)));
  return TWIN_FRAMES[index];
};

export const TwinPreview = () => {
  useFramePreloader();
  const [identityBlend, setIdentityBlend] = useState(0);

  const organicPercent = useMemo(() => ((1 - identityBlend) * 100).toFixed(0), [identityBlend]);
  const digitalPercent = useMemo(() => (identityBlend * 100).toFixed(0), [identityBlend]);
  const sliderReadout = useMemo(() => {
    if (identityBlend < 0.3) return 'Stage 01 · Organic origin';
    if (identityBlend > 0.7) return 'Stage 03 · Twin forged';
    return 'Stage 02 · Hybridizing';
  }, [identityBlend]);

  const currentFrameSrc = useMemo(
    () => resolveFrameForBlend(identityBlend),
    [identityBlend]
  );

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdentityBlend(clamp01(Number(event.target.value)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-obsidian via-[#07050c] to-[#0b101f]">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_25%,rgba(255,193,182,0.15),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(113,206,255,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_60%)] mix-blend-overlay" />

        {currentFrameSrc && (
          <img
            src={currentFrameSrc}
            alt="Digital twin transformation frame"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}

        <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_78%,rgba(255,183,168,0.2),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(111,213,255,0.35),transparent_60%)]" />
        </div>

        <div className="absolute top-4 left-4 z-20">
          <div className="rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 backdrop-blur">
            Subject: Meta-Human 07
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
          <div className="text-skin">{organicPercent}% Organic</div>
          <div className="text-liquid-chrome">{digitalPercent}% Digital</div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex justify-between text-xs font-mono uppercase tracking-[0.2em] text-liquid-chrome/70">
          <span>Timeline start</span>
          <span>Timeline end</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={identityBlend}
          onChange={handleSliderChange}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-skin transition-all hover:accent-white"
        />
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/40">Timeline scrub</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-skin">{sliderReadout}</p>
        </div>
      </div>
    </div>
  );
};
