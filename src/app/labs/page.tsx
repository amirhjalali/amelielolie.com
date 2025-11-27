import React from 'react';
import Link from 'next/link';

export default function LabsPage() {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center bg-obsidian text-liquid-chrome overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 text-center space-y-8">
        <h1 className="font-serif text-6xl md:text-9xl text-liquid-chrome mix-blend-screen">
          LABS
        </h1>
        <div className="font-mono text-sm tracking-[0.3em] text-skin uppercase">
          [ Digital Atelier : Offline ]
        </div>
        <p className="max-w-md mx-auto text-gray-400 font-light">
          We are currently synthesizing the digital twin environment. 
          Return later for WebGL experiments and cloth simulations.
        </p>
        
        <div className="pt-12">
          <Link href="/" className="px-8 py-3 border border-white/20 hover:bg-white/10 hover:border-skin hover:text-skin transition-all duration-300 font-mono text-xs tracking-widest">
            RETURN TO SYSTEM ROOT
          </Link>
        </div>
      </div>

    </section>
  );
}

