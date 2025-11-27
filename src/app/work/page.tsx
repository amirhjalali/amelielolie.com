import React from 'react';
import Link from 'next/link';
import { ProjectCard } from '@/components/ui/ProjectCard';

// Real Project Data from Migration
const PROJECTS = [
  {
    slug: 'digital-couture-2025',
    title: 'Digital Couture',
    category: 'Fashion Simulation',
    year: '2025',
    imageSrc: '/projects/digital-couture-cyber-bodysuit.jpg',
  },
  {
    slug: 'maison-meta',
    title: 'Maison Meta',
    category: 'AI Campaign',
    year: '2024',
    imageSrc: '/projects/maison-meta-collaboration.jpg',
  },
  {
    slug: 'void-artifacts',
    title: 'Void Artifacts',
    category: '3D Accessories',
    year: '2024',
    imageSrc: '/projects/digital-couture-shoe-black.jpg',
  },
  {
    slug: 'synthetic-skins',
    title: 'Synthetic Skins',
    category: 'Material Research',
    year: '2023',
    imageSrc: '/projects/avant-garde-mask-black.jpg',
  },
  {
    slug: 'romance-campaign',
    title: 'A Romance',
    category: 'Editorial',
    year: '2023',
    imageSrc: '/projects/editorial-romance-campaign.jpg',
  },
  {
    slug: 'meta-twins',
    title: 'Meta Twins',
    category: 'Identity System',
    year: '2023',
    imageSrc: '/projects/meta-human-twins-grey.jpg',
  },
];

export default function WorkPage() {
  return (
    <section className="min-h-screen w-full bg-obsidian text-liquid-chrome pt-32 pb-20 px-6 md:px-12">
      
      {/* Navigation (Consistent with About) */}
      <nav className="absolute top-8 left-0 w-full px-6 md:px-12 flex justify-between items-center z-50">
        <Link href="/" className="font-mono text-xs tracking-[0.2em] uppercase hover:text-skin transition-colors">
          Amelie Lolie
        </Link>
        <div className="flex gap-8">
          <Link href="/about" className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/50 hover:text-skin transition-colors">
            Identity
          </Link>
          <Link href="/work" className="font-mono text-xs tracking-[0.2em] uppercase text-skin">
            Work
          </Link>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/30 cursor-not-allowed">
            Labs
          </span>
        </div>
      </nav>

      {/* Header */}
      <div className="container mx-auto mb-20 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] text-skin/60 uppercase block mb-4">
            Archive // 01—04
          </span>
          <h1 className="font-serif text-5xl md:text-7xl text-transparent bg-clip-text bg-chrome-gradient">
            Selected Works
          </h1>
        </div>
        <p className="font-mono text-xs md:text-sm text-liquid-chrome/60 max-w-md text-right md:text-left leading-relaxed">
          A collection of digital artifacts, fashion simulations, and identity systems designed for the post-physical era.
        </p>
      </div>

      {/* Project Grid / Stream */}
      <div className="container mx-auto grid grid-cols-1 gap-12 md:gap-24">
        {PROJECTS.map((project, index) => (
          <div key={project.slug} 
               className={`transform transition-all duration-1000 ${
                 index % 2 === 0 ? 'md:ml-0 md:mr-auto md:w-10/12' : 'md:ml-auto md:mr-0 md:w-10/12'
               }`}
          >
            <ProjectCard {...project} />
          </div>
        ))}
      </div>

      {/* Footer / Pagination Placeholder */}
      <div className="container mx-auto mt-32 flex justify-center">
        <div className="flex items-center gap-4 opacity-50">
           <div className="w-12 h-px bg-liquid-chrome" />
           <span className="font-mono text-xs tracking-[0.2em] uppercase">End of Archive</span>
           <div className="w-12 h-px bg-liquid-chrome" />
        </div>
      </div>

    </section>
  );
}

