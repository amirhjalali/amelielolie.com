export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  client: string;
  role: string;
  description: string;
  imageSrc: string;
  gallery: string[];
};

export const PROJECTS: Project[] = [
  {
    slug: "skin-fur-metal",
    title: "Skin, Fur, Metal",
    category: "Digital Fashion",
    year: "2024",
    client: "Nasty Magazine",
    role: "Creative Direction, 3D Design",
    description:
      'An exploration of texture and surface in the post-biological age. "Skin, Fur, Metal" challenges the boundaries between organic softness and synthetic hardness, creating a hybrid aesthetic that questions where the body ends and the garment begins.',
    imageSrc: "/projects/skin-fur-metal-main.jpg",
    gallery: ["/projects/skin-fur-metal-2.jpg", "/projects/skin-fur-metal-3.jpg"],
  },
  {
    slug: "red-dharma",
    title: "Red Dharma",
    category: "Editorial",
    year: "2023",
    client: "Kaltblut Magazine",
    role: "Art Direction",
    description:
      "A crimson-soaked editorial exploring ritual and repetition. Red Dharma visualizes the spiritual weight of color in a digital void, using high-contrast lighting and surreal composition to evoke a sense of digital spirituality.",
    imageSrc: "/projects/red-dharma-main.jpg",
    gallery: ["/projects/red-dharma-2.jpg", "/projects/red-dharma-3.jpg"],
  },
  {
    slug: "modified-dna",
    title: "Modified DNA",
    category: "Bio-Digital Research",
    year: "2023",
    client: "Gush Magazine",
    role: "3D Artist",
    description:
      'Traces of the unknown. This project hypothesizes a future where genetic modification is the ultimate fashion statement. Through 3D simulation, we explore new biological forms and "fashion" that grows from the skin itself.',
    imageSrc: "/projects/modified-dna-main.jpg",
    gallery: ["/projects/modified-dna-2.jpg", "/projects/modified-dna-3.jpg"],
  },
  {
    slug: "replica",
    title: "Replica",
    category: "Fashion Film",
    year: "2022",
    client: "MAFF.tv",
    role: "Director",
    description:
      "A short film about the duplication of self. Replica deals with the uncanny valley and the emotional disconnect between a physical human and their digital twin. Featured on Maff.tv as part of the Exhalte series.",
    imageSrc: "/projects/replica-main.jpg",
    gallery: [],
  },
  {
    slug: "digital-couture-2025",
    title: "Void Artifacts",
    category: "3D Accessories",
    year: "2025",
    client: "Self-Initiated",
    role: "Design",
    description:
      'Experimental accessories designed for zero-gravity environments. These "Void Artifacts" are impossible objects that exist only within the digital realm, showcasing complex organic modeling and procedural material generation.',
    imageSrc: "/projects/digital-couture-shoe-black.jpg",
    gallery: [
      "/projects/digital-couture-cyber-bodysuit.jpg",
      "/projects/avant-garde-mask-black.jpg",
    ],
  },
  {
    slug: "meta-human-protocol",
    title: "Meta-Human Protocol",
    category: "Avatar Identity",
    year: "2025",
    client: "Self-Initiated",
    role: "Creative Direction, Avatar Design",
    description:
      "A research-driven digital twin pipeline that lets clients dial between biological warmth and liquid-chrome armor. The protocol retopologizes Ready Player Me bases, bakes cloth simulations, and applies shader-driven identity sliders for real-time fittings.",
    imageSrc: "/projects/meta-human-avatar-full.jpg",
    gallery: [
      "/projects/meta-human-twins-grey.jpg",
      "/projects/identity-sigils-vertical.jpg",
    ],
  },
  {
    slug: "maison-meta-ai",
    title: "Maison Meta // AI Fashion Week",
    category: "Runway Concept",
    year: "2024",
    client: "Maison Meta",
    role: "Digital Fashion Designer",
    description:
      "Commissioned for AI Fashion Week at Spring Studios, this capsule translated couture draping into procedural garments. Identity schematics guided the generative silhouettes, allowing Maison Meta to present avatars that feel simultaneously human and spectral.",
    imageSrc: "/projects/maison-meta-collaboration.jpg",
    gallery: [
      "/projects/fashion-illustration-white-coats.jpg",
      "/projects/identity-schematic-white.jpg",
    ],
  },
  {
    slug: "ethereal-white-drape",
    title: "Ethereal White Drape",
    category: "Editorial",
    year: "2023",
    client: "Narcisse Magazine",
    role: "Creative Direction",
    description:
      "Shot for Narcisse Magazine, this story leans into the spiritual softness of translucent fabric. The palette drifts from porcelain whites to cool blues, capturing the quiet tension between ritualistic romance and synthetic light.",
    imageSrc: "/projects/ethereal-white-drape.jpg",
    gallery: [
      "/projects/beauty-editorial-blue.jpg",
      "/projects/editorial-romance-campaign.jpg",
    ],
  },
  {
    slug: "cyber-reliquary",
    title: "Cyber Reliquary",
    category: "3D Accessory Study",
    year: "2024",
    client: "Nasty Magazine",
    role: "3D Artist",
    description:
      "An accessories suite that imagines devotional objects for the cyber-goth future. Procedural metalwork wraps around meta-human hands while twin avatars test how chrome, latex, and biotech skin merge into a single relic.",
    imageSrc: "/projects/digital-accessory-organic-black.jpg",
    gallery: [
      "/projects/cybernetic-hand-detail.jpg",
      "/projects/cyber-goth-twins.jpg",
    ],
  },
];

