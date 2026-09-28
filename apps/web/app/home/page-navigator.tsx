'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type Chapter = { id: string; label: string };

export function PageNavigator() {
  const pathname = usePathname();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.ct-site main > section, .ct-site > footer',
      ),
    );
    const items = sections.map((section, index) => {
      if (!section.id) section.id = `chapter-${index + 1}`;
      return {
        id: section.id,
        label:
          section.dataset.chapter ??
          section
            .querySelector<HTMLElement>('h1, h2')
            ?.innerText.replace(/\s+/g, ' ')
            .trim() ??
          'Explore',
      };
    });
    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const maximum = document.documentElement.scrollHeight - innerHeight;
      const progress =
        maximum > 0 ? Math.min(1, Math.max(0, scrollY / maximum)) : 1;
      root.current?.style.setProperty('--page-progress', String(progress));
      let index = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= innerHeight * 0.36)
          index = i;
      });
      if (progress > 0.995) index = Math.max(0, sections.length - 1);
      if (current !== index) {
        current = index;
        setActive(index);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(() => {
      setChapters(items);
      update();
    });
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    const site = document.querySelector('.ct-site');
    if (site) observer.observe(site);
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (!menu.current?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return;
        menu.current.open = false;
        menu.current.querySelector('summary')?.focus();
      } else if (!root.current?.contains(event.target as Node))
        menu.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [pathname]);
  useEffect(() => {
    if (!chapters.length) return;
    document.documentElement.classList.add('ct-scroll-enhanced');
    return () =>
      document.documentElement.classList.remove('ct-scroll-enhanced');
  }, [chapters.length]);
  if (!chapters.length) return null;
  const next = (active + 1) % chapters.length;
  const jump = (id: string) => {
    if (menu.current) menu.current.open = false;
    const section = document.getElementById(id);
    if (section) {
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  };
  return createPortal(
    <div className="ct-site-controls ct-page-navigator" ref={root}>
      <svg
        className="ct-page-progress"
        viewBox="0 0 224 54"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="220" height="50" rx="25" />
        <rect
          className="ct-page-progress-value"
          x="2"
          y="2"
          width="220"
          height="50"
          rx="25"
          pathLength="100"
        />
      </svg>
      <details ref={menu}>
        <summary
          aria-label={`Page sections: ${chapters[active]?.label}, ${active + 1} of ${chapters.length}`}
        >
          <span className="ct-chapter-count">
            {String(active + 1).padStart(2, '0')}
            <span> / {String(chapters.length).padStart(2, '0')}</span>
          </span>
          <span className="ct-chapter-label">{chapters[active]?.label}</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4 10 4-4 4 4" />
          </svg>
        </summary>
        <nav aria-label="On this page">
          <p>Follow the thread</p>
          {chapters.map((chapter, index) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={index === active ? 'location' : undefined}
              onClick={() => jump(chapter.id)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {chapter.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </details>
      <a
        className="ct-next-chapter"
        href={`#${chapters[next].id}`}
        onClick={() => jump(chapters[next].id)}
        aria-label={
          next === 0 ? 'Back to top' : `Next section: ${chapters[next].label}`
        }
      >
        <svg
          viewBox="0 0 24 24"
          style={{ transform: next === 0 ? 'rotate(180deg)' : undefined }}
          aria-hidden="true"
        >
          <path d="M12 4v15m-6-6 6 6 6-6" />
        </svg>
      </a>
    </div>,
    document.body,
  );
}
