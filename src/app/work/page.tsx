import React from 'react';
import Link from 'next/link';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { PROJECTS } from '@/content/projects';

export default function WorkPage() {
  return (
    <section className="min-h-screen w-full bg-obsidian text-liquid-chrome pt-32 pb-20 px-6 md:px-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-32">
        <div>
          <p className="font-mono text-xs tracking-[0.4em] uppercase text-skin">
            ARCHIVE DOSSIER
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-liquid-chrome uppercase mt-2">
            SELECTED WORKS
          </h1>
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
