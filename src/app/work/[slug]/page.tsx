import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// In a real app, this would come from a CMS or database.
// For now, we duplicate the data for the dynamic route lookup.
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
  'digital-couture-2025': {
    title: 'Digital Couture',
    category: 'Fashion Simulation',
    year: '2025',
    client: 'Self-Initiated',
    role: 'Creative Direction, 3D Design',
    description: 'A research project exploring the behavior of impossible fabrics in a zero-gravity digital environment. We utilized advanced cloth simulation algorithms to create garments that defy the laws of physics, yet retain a hyper-realistic tactile quality. The "Cyber Bodysuit" represents the fusion of skin and synthetic armor.',
    imageSrc: '/projects/digital-couture-cyber-bodysuit.jpg',
    gallery: [
      '/projects/digital-couture-shoe-black.jpg',
      '/projects/ethereal-white-drape.jpg'
    ]
  },
  'maison-meta': {
    title: 'Maison Meta',
    category: 'AI Campaign',
    year: '2024',
    client: 'Maison Meta',
    role: 'AI Prompt Engineering, Art Direction',
    description: 'A collaborative campaign exploring the "Digital Twin" concept. We generated a series of high-fidelity avatars wearing digital-only fashion collections. The project questions the necessity of physical sample production in the early stages of design.',
    imageSrc: '/projects/maison-meta-collaboration.jpg',
    gallery: [
      '/projects/fashion-illustration-white-coats.jpg',
      '/projects/editorial-group-suits.jpg'
    ]
  },
  'void-artifacts': {
    title: 'Void Artifacts',
    category: '3D Accessories',
    year: '2024',
    client: 'Concept',
    role: '3D Modeling, Texturing',
    description: 'Artifacts retrieved from the digital void. This collection of 3D-printed accessories and footwear explores organic growth algorithms applied to wearable objects. The "Black Beetle" shoe uses voronoi patterns to create a structure that is both lightweight and incredibly strong.',
    imageSrc: '/projects/digital-couture-shoe-black.jpg',
    gallery: [
      '/projects/digital-accessory-organic-black.jpg',
      '/projects/cybernetic-hand-detail.jpg'
    ]
  },
  'synthetic-skins': {
    title: 'Synthetic Skins',
    category: 'Material Research',
    year: '2023',
    client: 'Internal R&D',
    role: 'Material Design',
    description: 'An investigation into "Uncanny Textures". We created a library of procedural materials that mimic human skin but with synthetic properties—iridescence, subsurface scattering, and liquid chrome finishes. The goal was to create a visual language for the post-human body.',
    imageSrc: '/projects/avant-garde-mask-black.jpg',
    gallery: [
      '/projects/cyber-goth-twins.jpg',
      '/projects/beauty-editorial-blue.jpg'
    ]
  },
  'romance-campaign': {
    title: 'A Romance',
    category: 'Editorial',
    year: '2023',
    client: 'Vogue (Spec)',
    role: 'Art Direction',
    description: 'A speculative editorial campaign titled "A Romance That Can\'t Be Faked". Mixing traditional photography with AI-generated set extensions, we created a narrative about love in the age of synthetic media.',
    imageSrc: '/projects/editorial-romance-campaign.jpg',
    gallery: [
       '/projects/editorial-group-suits.jpg'
    ]
  },
  'meta-twins': {
    title: 'Meta Twins',
    category: 'Identity System',
    year: '2023',
    client: 'Amelie Lolie',
    role: 'Identity Design',
    description: 'The visual identity system for the "Meta-Human" project. Exploring duality, reflection, and the splitting of the self into digital copies. The grey-scale aesthetic emphasizes the sculptural quality of the digital form.',
    imageSrc: '/projects/meta-human-twins-grey.jpg',
    gallery: [
      '/projects/meta-human-avatar-full.jpg',
      '/projects/identity-sigils-vertical.jpg'
    ]
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  // Await the params promise
  const { slug } = await params;
  
  const project = PROJECTS_DATA[slug];

  if (!project) {
    notFound();
  }

  return (
    <article className="min-h-screen w-full bg-obsidian text-liquid-chrome pt-32 pb-20 px-6 md:px-12 selection:bg-skin selection:text-obsidian">
      
      {/* Navigation */}
      <nav className="absolute top-8 left-0 w-full px-6 md:px-12 flex justify-between items-center z-50">
        <Link href="/" className="font-mono text-xs tracking-[0.2em] uppercase hover:text-skin transition-colors">
          Amelie Lolie
        </Link>
        <Link href="/work" className="font-mono text-xs tracking-[0.2em] uppercase hover:text-skin transition-colors flex items-center gap-2">
          <span>←</span> Back to Archive
        </Link>
      </nav>

      <div className="container mx-auto max-w-6xl">
        
        {/* Header Section */}
        <header className="mb-20 grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8">
             <div className="flex items-center gap-4 mb-6 opacity-60">
                <span className="font-mono text-xs tracking-[0.2em] uppercase">{project.category}</span>
                <div className="w-12 h-px bg-current" />
                <span className="font-mono text-xs tracking-[0.2em] uppercase">{project.year}</span>
             </div>
             <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-none text-transparent bg-clip-text bg-chrome-gradient">
               {project.title}
             </h1>
          </div>
          
          <div className="md:col-span-4 flex flex-col gap-6 font-mono text-xs tracking-widest text-liquid-chrome/60 uppercase border-l border-white/10 pl-8">
            <div>
              <span className="block text-skin mb-1">Client</span>
              {project.client}
            </div>
            <div>
              <span className="block text-skin mb-1">Role</span>
              {project.role}
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="w-full aspect-[16/9] relative mb-24 bg-void rounded-sm overflow-hidden group">
           <Image 
             src={project.imageSrc} 
             alt={project.title} 
             fill 
             className="object-cover"
           />
           <div className="absolute inset-0 bg-skin/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-32">
           <div className="md:col-span-4 font-mono text-xs leading-loose tracking-wide text-liquid-chrome/50 sticky top-32 h-fit">
             <p>[ PROJECT_ANALYSIS_LOG ]</p>
             <p className="mt-4">
               Render Engine: Redshift<br/>
               Simulation: Houdini Vellum<br/>
               Post-Process: Nuke
             </p>
           </div>
           
           <div className="md:col-span-8">
             <p className="font-serif text-2xl md:text-3xl leading-relaxed text-liquid-chrome/90 mb-12">
               {project.description}
             </p>
             
             {/* Gallery Grid */}
             <div className="space-y-24">
               {project.gallery.map((img, idx) => (
                 <div key={idx} className="w-full relative aspect-[4/5] md:aspect-[3/4] bg-void">
                   <Image 
                     src={img} 
                     alt={`Gallery image ${idx + 1}`}
                     fill
                     className="object-cover"
                   />
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Next Project (Simple Logic for now) */}
        <div className="border-t border-white/10 pt-20 text-center">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-liquid-chrome/40 mb-4 block">Next Entry</span>
          <Link href="/work" className="font-serif text-4xl md:text-6xl hover:text-skin transition-colors inline-block">
             Return to Index
          </Link>
        </div>

      </div>
    </article>
  );
}

