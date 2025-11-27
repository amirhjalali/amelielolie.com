import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-8 flex justify-between items-center mix-blend-difference text-liquid-chrome">
      
      {/* Logo / Identity */}
      <Link href="/" className="group flex flex-col">
        <span className="font-serif text-xl tracking-tight group-hover:text-skin transition-colors duration-300">
          Amelie Lolie
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] opacity-50 group-hover:opacity-80 transition-opacity">
          DIGITAL ATELIER
        </span>
      </Link>

      {/* Navigation Links */}
      <ul className="flex gap-8 md:gap-12">
        {[
          { name: 'WORK', href: '/work' },
          { name: 'ABOUT', href: '/about' },
          { name: 'LABS', href: '/labs' },
        ].map((item) => (
          <li key={item.name}>
            <Link 
              href={item.href}
              className="relative font-mono text-xs tracking-[0.2em] hover:text-skin transition-colors duration-300
                after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-px after:bg-skin 
                after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

    </nav>
  );
};

