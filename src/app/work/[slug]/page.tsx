import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PROJECTS } from '@/content/projects';

type ProjectParams = {
  slug: string;
};

export const generateStaticParams = (): ProjectParams[] =>
  PROJECTS.map((project) => ({
    slug: project.slug,
  }));

export default async function ProjectPage({
  params,
}: {
  params: Promise<ProjectParams>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((entry) => entry.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <section className="min-h-screen w-full bg-obsidian text-liquid-chrome selection:bg-skin selection:text-obsidian">
      
      {/* Hero Image */}
      <div className="relative w-full h-[60vh] md:h-[80vh]">
        <Image 
          src={project.imageSrc} 
          alt={project.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <h1 className="font-serif text-5xl md:text-9xl text-white mix-blend-difference mb-4">
            {project.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-20 flex flex-col md:flex-row gap-12 md:gap-24">
        
        {/* Sidebar / Metadata */}
        <div className="w-full md:w-1/3 space-y-8 md:sticky md:top-32 h-fit">
          <div className="border-t border-white/20 pt-4">
            <h3 className="font-mono text-xs text-skin tracking-widest mb-1">CLIENT</h3>
            <p className="font-serif text-xl">{project.client}</p>
          </div>
          
          <div className="border-t border-white/20 pt-4">
            <h3 className="font-mono text-xs text-skin tracking-widest mb-1">ROLE</h3>
            <p className="font-serif text-xl">{project.role}</p>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h3 className="font-mono text-xs text-skin tracking-widest mb-1">YEAR</h3>
            <p className="font-mono text-xl">{project.year}</p>
          </div>

          <div className="pt-12">
             <Link href="/work" className="font-mono text-xs hover:text-skin transition-colors">
              ← BACK TO ARCHIVE
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3">
          <div className="prose prose-invert prose-lg max-w-none mb-24">
            <p className="text-xl md:text-2xl leading-relaxed text-gray-300 font-light">
              {project.description}
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="flex flex-col gap-12">
            {project.gallery.map((img, i) => (
              <div key={i} className="relative w-full aspect-[4/5] md:aspect-[16/9] bg-void overflow-hidden">
                <Image 
                  src={img}
                  alt={`${project.title} detail ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
