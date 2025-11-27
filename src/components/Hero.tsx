import React from 'react';

export const Hero = () => {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center bg-obsidian text-liquid-chrome overflow-hidden selection:bg-skin selection:text-obsidian">
      
      {/* Background Ambient Effects (Subsurface Skin & Chrome) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Warm skin glow representing the 'Biological' */}
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-skin/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        
        {/* Cold chrome glow representing the 'Digital' */}
        <div className="absolute bottom-[20%] right-[15%] w-[600px] h-[600px] bg-liquid-chrome/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center">
        
        {/* Metadata / Navigation Context - Digital Voice (Mono) */}
        <div className="mb-8 flex items-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <span className="font-mono text-xs tracking-[0.2em] text-liquid-chrome/60 uppercase">
            System: Online
          </span>
          <div className="h-px w-12 bg-liquid-chrome/20" />
          <span className="font-mono text-xs tracking-[0.2em] text-liquid-chrome/60 uppercase">
            v.2025.1
          </span>
        </div>

        {/* Main Headline - Human Voice (Serif) */}
        <h1 className="max-w-5xl font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight text-transparent bg-clip-text bg-chrome-gradient opacity-0 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          Curating Identity in the <br />
          <span className="italic font-light text-skin-light/90">Post-Physical Age.</span>
        </h1>

        {/* Glassmorphism Bio Card - Digital Voice (Mono) */}
        <div className="mt-12 max-w-2xl p-px rounded-xl bg-gradient-to-b from-white/20 to-transparent opacity-0 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="rounded-xl p-8 bg-obsidian/40 backdrop-blur-[12px] border border-white/5 relative overflow-hidden group">
            
            {/* Hover overlay effect */}
            <div className="absolute inset-0 bg-skin/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <p className="relative font-mono text-sm md:text-base leading-relaxed text-liquid-chrome/80 tracking-wide">
              Exploring the boundaries between <span className="text-skin">biological self</span> and <span className="text-white">digital representation</span> through AI and Fashion. 
              We construct the meta-human aesthetic for a new era of existence.
            </p>
          </div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-liquid-chrome to-transparent" />
      </div>

    </section>
  );
};

