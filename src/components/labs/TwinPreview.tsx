'use client';

import { useEffect, useMemo, useState } from 'react';

const SOURCE_IMAGE_FILENAME = 'meta-human-avatar-full.jpg';
const SOURCE_IMAGE_PATH = `/projects/${SOURCE_IMAGE_FILENAME}`;

type RGB = {
  r: number;
  g: number;
  b: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const loadSourceImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load source image: ${src}`));
    img.src = src;
  });

const sampleBackgroundColor = (data: Uint8ClampedArray, width: number, height: number): RGB => {
  const sampleOffsets = [
    { x: 6, y: 6 },
    { x: width - 6, y: 6 },
    { x: 6, y: height - 6 },
    { x: width - 6, y: height - 6 },
  ];

  const totals = sampleOffsets.reduce(
    (acc, point) => {
      const x = clamp(Math.round(point.x), 0, Math.max(width - 1, 0));
      const y = clamp(Math.round(point.y), 0, Math.max(height - 1, 0));
      const index = (y * width + x) * 4;
      acc.r += data[index];
      acc.g += data[index + 1];
      acc.b += data[index + 2];
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  const count = sampleOffsets.length || 1;
  return {
    r: totals.r / count,
    g: totals.g / count,
    b: totals.b / count,
  };
};

const isolateSilhouette = async (src: string) => {
  const image = await loadSourceImage(src);
  const naturalWidth = image.naturalWidth || image.width || 1;
  const naturalHeight = image.naturalHeight || image.height || 1;

  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Unable to create 2D context');
  }

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const background = sampleBackgroundColor(data, width, height);

  const tolerance = 85;
  const feather = 35;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - background.r;
    const dg = data[i + 1] - background.g;
    const db = data[i + 2] - background.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < tolerance - feather) {
      data[i + 3] = 0;
    } else if (distance < tolerance) {
      const ratio = (distance - (tolerance - feather)) / feather;
      data[i + 3] = data[i + 3] * ratio;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

export const TwinPreview = () => {
  const [identityBlend, setIdentityBlend] = useState(0.5);
  const [cutoutSrc, setCutoutSrc] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<'processing' | 'ready' | 'error'>('processing');

  useEffect(() => {
    let cancelled = false;

    isolateSilhouette(SOURCE_IMAGE_PATH)
      .then((dataUrl) => {
        if (cancelled) return;
        setCutoutSrc(dataUrl);
        setProcessingState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setProcessingState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const digitalClipStyle = useMemo(
    () => ({
      clipPath: `inset(0 0 0 ${(1 - identityBlend) * 100}%)`,
    }),
    [identityBlend]
  );

  const organicOverlayOpacity = useMemo(() => 0.25 + (1 - identityBlend) * 0.45, [identityBlend]);
  const syntheticGlareOpacity = useMemo(() => 0.35 + identityBlend * 0.5, [identityBlend]);
  const sourceLabel = useMemo(
    () => SOURCE_IMAGE_FILENAME.replace('.jpg', '').replace(/-/g, ' '),
    []
  );

  const sliderReadout = useMemo(() => {
    if (identityBlend < 0.35) return 'Organic lead';
    if (identityBlend > 0.65) return 'Digital lead';
    return 'Perfect split';
  }, [identityBlend]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-obsidian via-[#08050b] to-[#0b101f]">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_25%,rgba(255,193,182,0.14),transparent_55%),radial-gradient(circle_at_80%_18%,rgba(113,206,255,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)] mix-blend-overlay" />

        <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-8">
          <div className="relative h-full w-full">
            <img
              src={SOURCE_IMAGE_PATH}
              alt="Organic capture – Replica campaign still"
              className="absolute inset-0 h-full w-full select-none object-contain pointer-events-none drop-shadow-[0_35px_65px_rgba(0,0,0,0.45)] transition duration-500"
              style={{ opacity: 0.85 + (1 - identityBlend) * 0.15 }}
              draggable={false}
              loading="lazy"
            />

            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: organicOverlayOpacity }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f0d0d]/90 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(255,205,189,0.25),transparent_60%)]" />
            </div>

            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500"
              style={digitalClipStyle}
            >
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(9,16,36,0.95),rgba(30,9,50,0.5))]" />
              <div
                className="absolute inset-0 mix-blend-screen"
                style={{ opacity: syntheticGlareOpacity }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(109,205,255,0.45),transparent_65%)]" />
              </div>

              {cutoutSrc ? (
                <img
                  src={cutoutSrc}
                  alt="Digital twin composite"
                  className="relative z-10 h-full w-full select-none object-contain pointer-events-none drop-shadow-[0_25px_55px_rgba(109,205,255,0.35)] filter brightness-125 saturate-125 hue-rotate-[325deg]"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-[10px] font-mono uppercase tracking-[0.3em] text-liquid-chrome/60">
                  {processingState === 'processing' ? 'Isolating silhouette…' : 'Digital layer unavailable'}
                </div>
              )}

              <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[linear-gradient(transparent_94%,rgba(255,255,255,0.35)),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:100%_6px,150px_100%]" />
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 z-20">
          <div className="rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 backdrop-blur">
            Subject: Meta-Human 07
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
          <div className="text-skin">{((1 - identityBlend) * 100).toFixed(0)}% Organic</div>
          <div className="text-liquid-chrome">{(identityBlend * 100).toFixed(0)}% Digital</div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          <span>{`source: ${sourceLabel}`}</span>
          <span>
            {processingState === 'processing'
              ? 'background removal running'
              : processingState === 'ready'
              ? 'silhouette locked'
              : 'silhouette fallback'}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex justify-between text-xs font-mono uppercase tracking-[0.2em] text-liquid-chrome/70">
          <span>Biological capture</span>
          <span>Chromed twin</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={identityBlend}
          onChange={(event) => setIdentityBlend(Number(event.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-skin transition-all hover:accent-white"
        />
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome/40">Separation ratio</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-skin">{sliderReadout}</p>
        </div>
      </div>
    </div>
  );
};
