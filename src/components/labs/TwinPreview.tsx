'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TRANSFORMATION_VIDEO_PATH = '/videos/twin-xform.mp4';
const FRAME_COUNT = 72;
const TARGET_RENDER_WIDTH = 1280;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return '--:--';
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const TwinPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [identityBlend, setIdentityBlend] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [cacheState, setCacheState] = useState<'idle' | 'caching' | 'ready' | 'error'>('idle');
  const [frameStrip, setFrameStrip] = useState<string[] | null>(null);
  const [cacheProgress, setCacheProgress] = useState(0);
  const seekFrameRef = useRef<number | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleReady = () => {
      setVideoReady(true);
      video.pause();
    };

    const handleError = () => {
      setCacheState((prev) => (prev === 'ready' ? prev : 'error'));
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const applyPendingSeek = useCallback(() => {
    const video = videoRef.current;
    if (!video || pendingSeekTimeRef.current == null) return;
    video.currentTime = pendingSeekTimeRef.current;
    pendingSeekTimeRef.current = null;
  }, []);

  const scheduleSeek = useCallback(() => {
    if (seekFrameRef.current) {
      cancelAnimationFrame(seekFrameRef.current);
    }
    seekFrameRef.current = requestAnimationFrame(() => {
      seekFrameRef.current = null;
      applyPendingSeek();
    });
  }, [applyPendingSeek]);

  useEffect(() => {
    return () => {
      if (seekFrameRef.current) {
        cancelAnimationFrame(seekFrameRef.current);
      }
    };
  }, []);

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextBlend = clamp01(Number(event.target.value));
    setIdentityBlend(nextBlend);
    if (cacheState === 'error' && duration) {
      pendingSeekTimeRef.current = nextBlend * duration;
      scheduleSeek();
    }
  };

  useEffect(() => {
    if (!videoReady || !duration || cacheState !== 'idle') return;
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const captureFrames = async () => {
      try {
        setCacheState('caching');
        setCacheProgress(0);
        const intrinsicWidth = video.videoWidth || TARGET_RENDER_WIDTH;
        const intrinsicHeight = video.videoHeight || Math.round(TARGET_RENDER_WIDTH * 0.5625);
        const width = TARGET_RENDER_WIDTH;
        const height = Math.round((intrinsicHeight / intrinsicWidth) * width);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          throw new Error('Unable to capture timeline frames');
        }

        const frames: string[] = [];
        const totalSteps = Math.max(1, FRAME_COUNT - 1);

        const seekTo = (time: number) =>
          new Promise<void>((resolve, reject) => {
            let resolved = false;
            const cleanup = () => {
              video.removeEventListener('seeked', handleSeeked);
              video.removeEventListener('error', handleError);
            };

            const handleSeeked = () => {
              if (resolved) return;
              resolved = true;
              cleanup();
              resolve();
            };

            const handleError = () => {
              if (resolved) return;
              resolved = true;
              cleanup();
              reject(new Error('Video seek failed while caching frames'));
            };

            video.addEventListener('seeked', handleSeeked, { once: true });
            video.addEventListener('error', handleError, { once: true });
            video.currentTime = time;
          });

        video.pause();
        for (let i = 0; i < FRAME_COUNT; i += 1) {
          if (cancelled) return;
          const time = (duration * i) / totalSteps;
          await seekTo(time);
          if (cancelled) return;
          context.drawImage(video, 0, 0, width, height);
          let dataUrl: string;
          try {
            dataUrl = canvas.toDataURL('image/webp', 0.82);
          } catch {
            dataUrl = canvas.toDataURL('image/png');
          }
          frames[i] = dataUrl;
          setCacheProgress((i + 1) / FRAME_COUNT);
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }

        if (cancelled) return;
        setFrameStrip(frames);
        setCacheProgress(1);
        setCacheState('ready');
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setCacheState('error');
      }
    };

    captureFrames();

    return () => {
      cancelled = true;
    };
  }, [videoReady, duration, cacheState]);

  const organicPercent = useMemo(() => ((1 - identityBlend) * 100).toFixed(0), [identityBlend]);
  const digitalPercent = useMemo(() => (identityBlend * 100).toFixed(0), [identityBlend]);
  const sliderReadout = useMemo(() => {
    if (identityBlend < 0.3) return 'Stage 01 · Organic origin';
    if (identityBlend > 0.7) return 'Stage 03 · Twin forged';
    return 'Stage 02 · Hybridizing';
  }, [identityBlend]);

  const timelineReadout = useMemo(() => {
    if (!duration) {
      return '00:00 / --:--';
    }
    return `${formatTime(identityBlend * duration)} / ${formatTime(duration)}`;
  }, [identityBlend, duration]);

  const statusReadout = useMemo(() => {
    if (cacheState === 'caching') return `assembling timeline ${Math.round(cacheProgress * 100)}%`;
    if (cacheState === 'ready') return 'frame cache ready';
    if (cacheState === 'error') return 'fallback: direct video scrub';
    return 'initializing source';
  }, [cacheState, cacheProgress]);

  const currentFrameSrc = useMemo(() => {
    if (!frameStrip || frameStrip.length === 0) return null;
    if (frameStrip.length === 1) return frameStrip[0];
    const index = Math.min(
      frameStrip.length - 1,
      Math.round(identityBlend * (frameStrip.length - 1))
    );
    return frameStrip[index];
  }, [frameStrip, identityBlend]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-obsidian via-[#07050c] to-[#0b101f]">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_25%,rgba(255,193,182,0.15),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(113,206,255,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_60%)] mix-blend-overlay" />

        <video
          ref={videoRef}
          src={TRANSFORMATION_VIDEO_PATH}
          preload="auto"
          playsInline
          muted
          controls={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            cacheState === 'ready' ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {cacheState === 'ready' && currentFrameSrc && (
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

        {cacheState === 'caching' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
              {`Capturing frames ${Math.round(cacheProgress * 100)}%`}
            </span>
          </div>
        )}

        {cacheState === 'error' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
              Video fallback active
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4 z-20">
          <div className="rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 backdrop-blur">
            Subject: Meta-Human 07
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
          <div className="text-skin">{organicPercent}% Organic</div>
          <div className="text-liquid-chrome">{digitalPercent}% Digital</div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          <span>source: twin-xform.mp4</span>
          <span>{statusReadout}</span>
          <span>{timelineReadout}</span>
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
          disabled={cacheState === 'caching' || cacheState === 'idle'}
        />
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/40">Timeline scrub</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-skin">{sliderReadout}</p>
        </div>
      </div>
    </div>
  );
};
