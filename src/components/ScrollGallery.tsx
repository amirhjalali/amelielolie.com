'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';

// All gallery images from the old site
const GALLERY_IMAGES = [
  '0f558fc6f63b5b8db339e396f7980573.jpg',
  '102b3d9b67a90fd0f7f26ccc04f6968f.jpg',
  '11f8d06ccea9ba44e3a18ac17ec00c91.jpg',
  '1282fecb03bdfc5ed58f576921440f2a.jpg',
  '1470a8501837ed320d654507629d44fd.jpg',
  '19fedb9ebc6b478ca12a459a7ef9282b.jpg',
  '1b413d181241d6ba3423e4ef08dd0115.jpg',
  '1c0857a97ea0d88e2aa10f89b24f4e47.jpg',
  '1f87a328358b43182e3086ad1b718233.jpg',
  '2a77a1d11c1dc8103d1e9a137bb09425.jpg',
  '2b6322b2f3864a8c884176a588ef1f8e.jpg',
  '2c045657adec107f1308e98f47b7a6c3.jpg',
  '2da78a06e9d3ca5ca8f58aabbf773420.jpg',
  '2e46fd94ccd8ce66216b2eeabc3fb76e.jpg',
  '37dc682994ecf2e3bf241390e4df4173.jpg',
  '3818265301377fdde25b6476f9a99519.jpg',
  '398973b63e7b7f6689d99a8894988b95.jpg',
  '3c119658fce92ceaeff5e8869c368b04.jpg',
  '3c4b88443f6e2e1818bb5852a004d666.jpg',
  '3da1abbc8924fe146bea223ce40beb1d.jpg',
  '3decab46658888949789bd3bd4d91e2e.jpg',
  '44287f5f296f61873568def99a78e7a0.jpg',
  '489af1c1493a61e28110f81911474d2a.jpg',
  '49ca6c540bcfcaffa38a3f90f40d4afb.jpg',
  '4af755700a65e448b5a7b3c58699b588.jpg',
  '4fbca2cfe042a0d44e0a740ec6955998.jpg',
  '531a89045b5355f9e62bb8587b8d0ee5.jpg',
  '5d29c5332be55c88ddc317bd24fc3a25.jpg',
  '5f119f61ec4c2994659f8bf7e5c4e580.jpg',
  '5f1553e54e3dc326c521c26bfa207385.jpg',
  '6089143179fe32f2da9ccf31e38f63e9.jpg',
  '61de807282ab9e52029265f49348015c.jpg',
  '6392fcd4e4b95cf866f56da11247eed4.jpg',
  '64c0c3eb93e1877e14e0aa0fe3118ce9.jpg',
  '6fe95dfaa23032caee4377613ad03b2b.jpg',
  '70f16445c4a75471100205b8773b0dc6.jpg',
  '7189f5e902dc2a4a99c6c762be65310e.jpg',
  '72375ca7ce4fe01fc9a1ac2642bacd8a.jpg',
  '74664cb2108c969add9b96c5d6eb7565.jpg',
  '78f95304d04a46076187013e769835ff.jpg',
  '8178bf6bebabc5cdd3c4fd02cfc0fce0.jpg',
  '8441bc7bfb3eaaca774bf048a636e59c.jpg',
  '85e2c5a3b5a5fd929c0d9350c97481eb.jpg',
  '8abef8c880ac2582192ae571e9109a08.jpg',
  '8d7ee2ae39058a8826c4ff5f22e129f7.jpg',
  '94142424b63c276b2450c5ffafad38f8.jpg',
  '95c33a4ce59f3779dec18d6598396dfb.jpg',
  '9a66050caa734f1f3822e7c29c73f68f.jpg',
  '9c8c27364553548792977e61a5edbd63.jpg',
  '9e5ecdb7eed3cb3ac217213415049491.jpg',
  'a2761214c62e4b73a2a8744d20447f38.jpg',
  'a5211ddfa9802f2b6ddafdf09a839bc8.jpg',
  'a5d0ef755d5abd0b794420f72dff2d19.jpg',
  'a5f998e2f48155a632e15d8a7c720857.jpg',
  'a79e1c8fa203d337448581200686d887.jpg',
  'aae1687135ddaa24bb804979a5695bde.jpg',
  'ad8ce925eea9fd69956ea503fa7e82a4.jpg',
  'b291aa2773be225700c42c85141db3f6.jpg',
  'b4674eccd918c87c602cdc0248e201a3.jpg',
  'b7a258ddb5097f91dd25862b7ab2c093.jpg',
  'bb85a3d188b6989ef366b2661fca3621.jpg',
  'bf5c858cdc727f8bc7da436da88e2349.jpg',
  'c36208845423ee1c787afa3e025916c6.jpg',
  'c490788a78d5a8e170cddc3888eb3221.jpg',
  'c5be95f59f26bb39730b8c1994c859ed.jpg',
  'cb168bd2a642e118e051cc1e33a41eb3.jpg',
  'cb187029f2581255a09721edc189f79e.jpg',
  'd4cdcbf822081a6b587ec467b7f1a7b6.jpg',
  'd6223c1e3a856a9988d1e1d6580b724a.jpg',
  'd6332c5f3a34841b0db1818b1c24054f.jpg',
  'd91b50a730497690a1411a304b82642e.jpg',
  'dc458e8c23c4fa0e71b6de6ee93c7bc5.jpg',
  'dfc014b01a8ecc847c9dad5d57527463.jpg',
  'e060e8c073958a72be40ee43e36ddf66.jpg',
  'eb02bb2a9a5a9a77b8aa28c24eb4375b.jpg',
  'ee90000d419d5770f1c4d799f9c85d25.jpg',
  'f2c56908a45219858703cf65955417e7.jpg',
  'f32105d6dee593edca9b95ba54fde010.jpg',
  'f7a07f7d38da66c6c2801f829219d583.jpg',
  'f807df7862a75ed335a17957352c32f6.jpg',
  'f89895eb4a26ee3c7980547f63432160.jpg',
  'fa787a5e8b8aa6fa9a70233350ebdd31.jpg',
  'fbabb44da94d31bb1cf126f9f519d26d.jpg',
  'fd1e9bd6fb31f8d1b6a08109220a6ac2.jpg',
  'fe20643b1f3e377e14907e2282d32d4a.jpg',
  'ffe6dc5594758a3503ac03f9668349b1.jpg',
];

// Seeded random for consistent "random" offsets
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate random offsets for each image (consistent across renders)
const generateImageOffsets = () => {
  return GALLERY_IMAGES.map((_, index) => ({
    // Random vertical offset within column (0-150px)
    marginTop: Math.floor(seededRandom(index * 7) * 120),
    // Random horizontal nudge (-10 to 10px)
    translateX: Math.floor(seededRandom(index * 13) * 20) - 10,
    // Slight rotation (-2 to 2 degrees)
    rotate: (seededRandom(index * 17) * 4) - 2,
  }));
};

const GalleryImage = ({ 
  image, 
  offset 
}: { 
  image: string; 
  offset: { marginTop: number; translateX: number; rotate: number };
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Image is "in view" when it enters from bottom
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        rootMargin: '100px 0px -50px 0px', // Trigger slightly before fully in view
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group cursor-pointer"
      style={{
        marginTop: `${offset.marginTop}px`,
        transform: isInView 
          ? `translateX(${offset.translateX}px) translateY(0) rotate(${offset.rotate}deg)` 
          : `translateX(${offset.translateX}px) translateY(100px) rotate(${offset.rotate}deg)`,
        opacity: isInView ? 1 : 0,
        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out',
      }}
    >
      <div className="overflow-hidden rounded-sm">
        <Image
          src={`/gallery/${image}`}
          alt=""
          width={600}
          height={800}
          className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          loading="lazy"
          unoptimized
        />
      </div>
    </div>
  );
};

export const ScrollGallery = () => {
  const [hasStartedScrolling, setHasStartedScrolling] = useState(false);
  
  // Generate consistent random offsets
  const imageOffsets = useMemo(() => generateImageOffsets(), []);

  // Distribute images into columns (staggered distribution for organic feel)
  const columns = useMemo(() => {
    const numCols = 4; // We'll use CSS to make this responsive
    const cols: { image: string; offset: typeof imageOffsets[0] }[][] = Array.from({ length: numCols }, () => []);
    
    // Distribute images in a scattered pattern
    GALLERY_IMAGES.forEach((image, index) => {
      // Use seeded random to pick column (not just modulo)
      const colIndex = Math.floor(seededRandom(index * 23) * numCols);
      cols[colIndex].push({ image, offset: imageOffsets[index] });
    });
    
    return cols;
  }, [imageOffsets]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80 && !hasStartedScrolling) {
        setHasStartedScrolling(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasStartedScrolling]);

  return (
    <div className="min-h-[300vh] relative bg-obsidian">
      {/* Initial empty screen with scroll indicator */}
      <div 
        className="h-screen flex items-center justify-center fixed inset-0 z-20 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: hasStartedScrolling ? 0 : 1 }}
      >
        <div className="flex flex-col items-center gap-6">
          <span className="font-mono text-[11px] tracking-[0.4em] text-liquid-chrome/50 uppercase">
            Scroll to explore
          </span>
          <div className="w-px h-20 bg-gradient-to-b from-liquid-chrome/50 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Gallery Grid - Manual columns for organic spacing */}
      <div 
        className="px-6 md:px-10 lg:px-16 pb-40 pt-[30vh] transition-opacity duration-1000"
        style={{ opacity: hasStartedScrolling ? 1 : 0.3 }}
      >
        <div className="flex gap-6 md:gap-10 lg:gap-14">
          {columns.map((column, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 flex flex-col gap-8 md:gap-12 lg:gap-16"
              style={{
                // Stagger column start positions
                marginTop: `${colIndex * 60}px`,
              }}
            >
              {column.map(({ image, offset }) => (
                <GalleryImage key={image} image={image} offset={offset} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
