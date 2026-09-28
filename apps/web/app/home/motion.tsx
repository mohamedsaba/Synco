'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const site = document.querySelector<HTMLElement>('.ct-site');
    if (!site) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      site.classList.remove('ct-animated');
      if (preference.matches || !('IntersectionObserver' in window)) return;
      const sections = site.querySelectorAll<HTMLElement>('.ct-reveal');
      sections.forEach((section) => section.classList.remove('ct-visible'));
      site.classList.add('ct-animated');
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('ct-visible');
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 },
      );
      sections.forEach((section) => observer?.observe(section));
    };
    setup();
    preference.addEventListener('change', setup);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', setup);
      site.classList.remove('ct-animated');
    };
  }, [pathname]);
  return null;
}
