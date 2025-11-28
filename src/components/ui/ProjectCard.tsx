import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/content/projects';

type ProjectCardProps = Pick<Project, "title" | "category" | "year" | "imageSrc" | "slug">;

export const ProjectCard: React.FC<ProjectCardProps> = ({ title, category, year, imageSrc, slug }) => {
  return (
    <Link href={`/work/${slug}`} className="group relative block w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden rounded-sm bg-void">
      
      {/* Image Container with Zoom Effect */}
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
         <Image 
           src={imageSrc} 
           alt={title} 
           fill 
           className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
         />
         
         <div className="w-full h-full absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60" />
            
         {/* Abstract Digital Noise / Texture for "Uncanny" feel */}
         <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      {/* Overlay: "The Digital Veil" - Darkens slightly on hover to make text pop */}
      <div className="absolute inset-0 bg-obsidian/20 group-hover:bg-obsidian/40 transition-colors duration-500" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col justify-end">
        
        {/* Metadata Line */}
        <div className="flex items-center gap-3 mb-2 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
           <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-skin">
             {year}
           </span>
           <div className="w-8 h-px bg-skin/30" />
           <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-liquid-chrome">
             {category}
           </span>
        </div>

        {/* Title with Slide-Up Animation */}
        <h3 className="font-serif text-3xl md:text-5xl text-liquid-chrome transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          {title}
        </h3>

        {/* Hidden "View Project" Button that reveals on hover */}
        <div className="h-0 overflow-hidden group-hover:h-8 transition-[height] duration-500 delay-100">
           <div className="pt-4 flex items-center gap-2">
             <span className="font-mono text-xs uppercase tracking-widest text-skin/80">View Case Study</span>
             <span className="text-skin/80">→</span>
           </div>
        </div>

      </div>

      {/* Border Glitch Effect on Hover */}
      <div className="absolute inset-0 border border-transparent group-hover:border-skin/20 transition-colors duration-500 rounded-sm pointer-events-none" />
    </Link>
  );
};

