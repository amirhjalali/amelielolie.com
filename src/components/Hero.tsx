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
        <div className="text-center space-y-6">
          <h1
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight text-transparent bg-clip-text bg-chrome-gradient opacity-0 animate-slide-up"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          >
            Identity in the <br />
            <span className="italic font-light text-skin-light/90">Digital Age.</span>
          </h1>
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

