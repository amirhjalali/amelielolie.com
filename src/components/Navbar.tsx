'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navbar = () => {
  const pathname = usePathname() ?? '';
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-8 flex justify-between items-start mix-blend-difference text-liquid-chrome">
      
      {/* Logo / Identity */}
      <Link href="/" className="group flex flex-col leading-tight translate-y-1">
        <span className="font-mono text-sm tracking-[0.25em] text-liquid-chrome uppercase group-hover:text-skin transition-colors duration-300">
          AMELIE LOLIE
        </span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-skin uppercase mt-0.5 block">
          <span className="block [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0%_0_0)] transition-[clip-path] duration-500 ease-in-out">
            DIGITAL ATELIER
          </span>
        </span>
      </Link>

      {/* Navigation Links */}
      <ul className="flex gap-8 md:gap-12">
        {[
          { name: 'WORK', href: '/work' },
          { name: 'ABOUT', href: '/about' },
          { name: 'LAB', href: '/labs' },
        ].map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`relative font-mono text-xs tracking-[0.2em] transition-colors duration-300
                after:content-[''] after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-skin after:transition-all after:duration-300
                ${pathname === item.href ? 'text-skin after:w-0' : 'hover:text-skin after:w-0 hover:after:w-full'}`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

    </nav>
  );
};

