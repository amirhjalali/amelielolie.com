import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// In a real app, this would come from a CMS or database.
const PROJECTS_DATA: Record<string, {
  title: string;
  category: string;
  year: string;
  client: string;
  role: string;
  description: string;
  imageSrc: string;
  gallery: string[];
}> = {
  'skin-fur-metal': {
    title: 'Skin, Fur, Metal',
    category: 'Digital Fashion',
    year: '2024',
    client: 'Nasty Magazine',
    role: 'Creative Direction, 3D Design',
    description: 'An exploration of texture and surface in the post-biological age. "Skin, Fur, Metal" challenges the boundaries between organic softness and synthetic hardness, creating a hybrid aesthetic that questions where the body ends and the garment begins.',
    imageSrc: '/projects/skin-fur-metal-main.jpg',
    gallery: [
      '/projects/skin-fur-metal-2.jpg',
      '/projects/skin-fur-metal-3.jpg',
    ]
  },
  'red-dharma': {
    title: 'Red Dharma',
    category: 'Editorial',
    year: '2023',
    client: 'Kaltblut Magazine',
    role: 'Art Direction',
    description: 'A crimson-soaked editorial exploring ritual and repetition. Red Dharma visualizes the spiritual weight of color in a digital void, using high-contrast lighting and surreal composition to evoke a sense of digital spirituality.',
    imageSrc: '/projects/red-dharma-main.jpg',
    gallery: [
      '/projects/red-dharma-2.jpg',
      '/projects/red-dharma-3.jpg',
    ]
  },
  'modified-dna': {
    title: 'Modified DNA',
    category: 'Bio-Digital Research',
    year: '2023',
    client: 'Gush Magazine',
    role: '3D Artist',
    description: 'Traces of the unknown. This project hypothesizes a future where genetic modification is the ultimate fashion statement. Through 3D simulation, we explore new biological forms and "fashion" that grows from the skin itself.',
    imageSrc: '/projects/modified-dna-main.jpg',
    gallery: [
      '/projects/modified-dna-2.jpg',
      '/projects/modified-dna-3.jpg',
    ]
  },
  'replica': {
    title: 'Replica',
    category: 'Fashion Film',
    year: '2022',
    client: 'Maff.tv',
    role: 'Director',
    description: 'A short film about the duplication of self. "Replica" deals with the uncanny valley and the emotional disconnect between a physical human and their digital twin. Featured on Maff.tv as part of the Exhalte series.',
    imageSrc: '/projects/replica-main.jpg',
    gallery: []
  },
  'digital-couture-2025': {
    title: 'Void Artifacts',
    category: '3D Accessories',
    year: '2025',
    client: 'Self-Initiated',
    role: 'Design',
    description: 'Experimental accessories designed for zero-gravity environments. These "Void Artifacts" are impossible objects that exist only within the digital realm, showcasing complex organic modeling and procedural material generation.',
    imageSrc: '/projects/digital-couture-shoe-black.jpg',
    gallery: [
        '/projects/digital-couture-cyber-bodysuit.jpg',
        '/projects/avant-garde-mask-black.jpg'
    ]
  },
};

export default function ProjectPage({ params }: { params: { slug: string } }) {
  // Awaiting params in Next.js 15+ if necessary, but standard access usually works.
  // Ideally, we should ensure params is treated as a Promise if using latest Next.js canary types,
  // but for stable 15, direct access is often still supported or it's an async component.
  // To be safe with strict types:
  const slug = params.slug; 
  const project = PROJECTS_DATA[slug];

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
