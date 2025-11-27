import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className="relative min-h-screen w-full bg-obsidian text-liquid-chrome overflow-hidden selection:bg-skin selection:text-obsidian pt-32 pb-20 px-6 md:px-12">
      
      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: The "Digital Intelligence" / Metadata */}
        <div className="md:col-span-4 flex flex-col gap-12 sticky top-32">
          
          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/50">
              01. The Entity
            </h2>
            <div className="h-px w-full bg-liquid-chrome/10" />
            <p className="font-mono text-sm leading-relaxed text-liquid-chrome/80">
              Creative Director &<br/> Digital Fashion Architect.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/50">
              02. Coordinates
            </h2>
            <div className="h-px w-full bg-liquid-chrome/10" />
            <ul className="font-mono text-sm space-y-2 text-liquid-chrome/80">
              <li>Based in the Cloud</li>
              <li>Operating Globally</li>
              <li>GMT +0</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/50">
              03. Capabilities
            </h2>
            <div className="h-px w-full bg-liquid-chrome/10" />
            <ul className="font-mono text-sm space-y-2 text-liquid-chrome/80">
              <li>Digital Fashion Design</li>
              <li>3D Cloth Simulation</li>
              <li>Avatar Identity Systems</li>
              <li>Creative Direction</li>
            </ul>
          </div>

        </div>

        {/* Right Column: The "Human" Narrative */}
        <div className="md:col-span-8 flex flex-col gap-20">
          
          <div className="relative">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-transparent bg-clip-text bg-chrome-gradient">
              Constructing the <br/>
              <span className="italic font-light text-skin-light">Meta-Human.</span>
            </h1>
            
            {/* Ambient Glow behind text */}
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-skin/5 rounded-full blur-[100px] -z-10" />
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="font-serif text-2xl md:text-3xl leading-relaxed text-liquid-chrome/90">
              We live in an era where the digital self is as tangible as the physical body.
            </p>
            
            <div className="h-px w-24 bg-skin/30 my-8" />

            <p className="font-sans text-liquid-chrome/70 text-lg leading-loose">
              Amelie Lolie is a digital atelier exploring the boundaries between biological reality and artificial intelligence. We believe that fashion is no longer bound by fabric and gravity—it is a medium for identity construction in the post-physical age.
            </p>

            <p className="font-sans text-liquid-chrome/70 text-lg leading-loose mt-8">
              By merging high-fidelity 3D cloth simulation with avant-garde aesthetics, we create garments that exist solely in the digital realm, yet evoke deep human emotion. We don't just dress avatars; we curate the visual language of the meta-human.
            </p>
          </div>

          {/* Image Placeholder - To be replaced with a Digital Twin render later */}
          <div className="w-full aspect-[16/9] rounded-xl bg-void border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-obsidian via-transparent to-skin/10" />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="font-mono text-xs tracking-[0.2em] text-liquid-chrome/30 group-hover:text-skin transition-colors duration-500">
                 [ DIGITAL TWIN RENDERING INIT ]
               </span>
            </div>
            {/* Optional: Add a subtle grid or scanline effect here */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          </div>

        </div>

      </div>
    </section>
  );
}

