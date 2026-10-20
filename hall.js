const hero = document.querySelector('.hero-bg');

if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('scroll', () => {
    const offset = Math.min(scrollY * 0.08, 36);
    hero.style.transform = `scale(1.04) translateY(${offset}px)`;
  }, { passive: true });
}
