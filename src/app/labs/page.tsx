'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DigitalFabric } from '@/components/labs/DigitalFabric';
import { FluidMirror } from '@/components/labs/FluidMirror';
import { TwinPreview } from '@/components/labs/TwinPreview';

const experiments = [
  {
    key: 'fabric',
    title: 'Digital Silk',
    subtitle: 'Zero-gravity cloth physics',
    description:
      'A plane geometry driven by harmonic wind noise + transmission shading to study how fabric behaves when freed from gravity.',
    Component: DigitalFabric,
  },
  {
    key: 'mirror',
    title: 'The Mirror',
    subtitle: 'Cursor-driven identity distortion',
    description:
      'A shader-based fluid system that refracts the UI as you move, referencing the oil-slick aura of the meta-human.',
    Component: FluidMirror,
  },
  {
    key: 'twin',
    title: 'Digital Twin Preview',
    subtitle: 'Identity blend slider',
    description:
      'A placeholder avatar rig that will host the outfit configurator. Blend between human warmth and chrome armor in real time.',
    Component: TwinPreview,
  },
] as const;

export default function LabsPage() {
  const [activeKey, setActiveKey] = useState<(typeof experiments)[number]['key']>('fabric');
  const activeExperiment = experiments.find((exp) => exp.key === activeKey) ?? experiments[0];
  const ActiveComponent = activeExperiment.Component;

  return (
    <section className="relative min-h-screen w-full bg-obsidian text-liquid-chrome overflow-hidden pt-32 pb-24">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-skin/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-[10%] w-[700px] h-[700px] bg-skin/20 rounded-full blur-[220px] opacity-40" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-32">
          <div>
            <p className="font-mono text-xs tracking-[0.4em] uppercase text-skin">
              ATELIER
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-liquid-chrome uppercase mt-2">
              LAB
            </h1>
          </div>
          <div className="mt-8 md:mt-0 font-mono text-xs text-liquid-chrome/50 text-right">
            <Link
              href="/work"
              className="hover:text-skin transition-colors"
            >
              ← RETURN TO WORK
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-[280px_auto] gap-10">
          <div className="space-y-4">
            {experiments.map((experiment) => (
              <button
                key={experiment.key}
                onClick={() => setActiveKey(experiment.key)}
                className={`w-full text-left p-4 border rounded-xl transition-all duration-300 ${
                  activeKey === experiment.key
                    ? 'border-skin bg-white/5 shadow-[0_0_30px_rgba(255,178,178,0.15)]'
                    : 'border-white/10 hover:border-skin/40 hover:bg-white/5'
                }`}
              >
                <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-skin">{experiment.title}</p>
                <p className="font-sans text-sm text-liquid-chrome/70 mt-2">{experiment.subtitle}</p>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <div className="font-mono text-sm tracking-[0.3em] text-skin uppercase">{activeExperiment.title}</div>
              <p className="font-serif text-3xl text-liquid-chrome mt-3">{activeExperiment.subtitle}</p>
              <p className="font-sans text-liquid-chrome/70 mt-4">{activeExperiment.description}</p>
            </div>
            <ActiveComponent />
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="font-mono text-xs tracking-[0.3em] uppercase text-liquid-chrome/60">
            Next: Outfit Configurator · AI cloth baking pipeline
          </div>
          <p className="font-sans text-sm text-liquid-chrome/50">
            Built with React Three Fiber · Drei · custom shader work. Optimized for desktop (mobile fallbacks coming
            soon).
          </p>
        </div>
      </div>
    </section>
  );
}
