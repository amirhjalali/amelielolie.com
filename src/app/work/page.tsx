import React from 'react';
import Link from 'next/link';
import { ProjectCard } from '@/components/ui/ProjectCard';

// Real Project Data from Migration
const PROJECTS = [
  {
    slug: 'skin-fur-metal',
    title: 'Skin, Fur, Metal',
    category: 'Digital Fashion',
    year: '2024',
    imageSrc: '/projects/skin-fur-metal-main.jpg',
  },
  {
    slug: 'red-dharma',
    title: 'Red Dharma',
    category: 'Editorial',
    year: '2023',
    imageSrc: '/projects/red-dharma-main.jpg',
  },
  {
    slug: 'modified-dna',
    title: 'Modified DNA',
    category: 'Bio-Digital Research',
    year: '2023',
    imageSrc: '/projects/modified-dna-main.jpg',
  },
  {
    slug: 'replica',
    title: 'Replica',
    category: 'Fashion Film',
    year: '2022',
    imageSrc: '/projects/replica-main.jpg',
  },
  {
    slug: 'digital-couture-2025',
    title: 'Void Artifacts',
    category: '3D Accessories',
    year: '2025',
    imageSrc: '/projects/digital-couture-shoe-black.jpg',
  },
];

export default function WorkPage() {
  return (
    <section className="min-h-screen w-full bg-obsidian text-liquid-chrome pt-32 pb-20 px-6 md:px-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-32">
        <div>
          <h1 className="font-serif text-5xl md:text-8xl mb-4 text-liquid-chrome">
            Selected Works
          </h1>
          <p className="font-mono text-sm tracking-widest text-skin/80 max-w-md">
            ARCHIVE: 2022 — 2025<br/>
            DIGITAL FASHION / AVATAR IDENTITY / EDITORIAL
          </p>
        </div>
        
        <div className="mt-8 md:mt-0 font-mono text-xs text-liquid-chrome/50 text-right">
          <p>INDEXING: COMPLETE</p>
          <p>DISPLAY: MASONRY_STREAM</p>
        </div>
      </div>

      {/* Projects Stream */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24 md:gap-y-48 px-0 md:px-12">
        {PROJECTS.map((project, index) => (
          <div 
            key={project.slug} 
            className={`${index % 2 === 1 ? 'md:mt-32' : ''} ${index % 2 === 0 ? 'md:mb-32' : ''}`}
          >
            <ProjectCard {...project} />
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="mt-40 flex justify-between border-t border-white/10 pt-8">
        <Link href="/" className="font-mono text-xs hover:text-skin transition-colors">
          ← SYSTEM ROOT
        </Link>
        <Link href="/about" className="font-mono text-xs hover:text-skin transition-colors">
          IDENTITY DATA →
        </Link>
      </div>

    </section>
  );
}
