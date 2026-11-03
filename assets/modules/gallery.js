export function createGallery(grid, { motion }) {
  if (!grid) return;
  const controller = new AbortController();
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cleanups = [];
  grid.querySelectorAll('.project').forEach(card => {
    const art = card.querySelector('.project-art');
    const hitbox = card.querySelector('.project-visual');
    let frame = 0, targetX = 0, targetY = 0, x = 0, y = 0;
    function render() {
      frame = 0;
      x += (targetX - x) * .14; y += (targetY - y) * .14;
      art.style.setProperty('--rx', `${-y * 5}deg`);
      art.style.setProperty('--ry', `${x * 7}deg`);
      art.style.setProperty('--px', `${x * 7}px`);
      art.style.setProperty('--py', `${y * 7}px`);
      if (Math.abs(x - targetX) + Math.abs(y - targetY) > .002) frame = requestAnimationFrame(render);
    }
    function request() { if (!frame) frame = requestAnimationFrame(render); }
    hitbox.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      // The stationary image wrapper owns pointer input. The inner artwork
      // can tilt without moving the hitbox into the caption.
      const bounds = hitbox.getBoundingClientRect();
      const localX = Number.isFinite(event.offsetX) ? event.offsetX : event.clientX - bounds.left;
      const localY = Number.isFinite(event.offsetY) ? event.offsetY : event.clientY - bounds.top;
      const px = Math.max(0, Math.min(1, localX / (hitbox.clientWidth || bounds.width)));
      const py = Math.max(0, Math.min(1, localY / (hitbox.clientHeight || bounds.height)));
      art.style.setProperty('--spot-x', `${px * 100}%`);
      art.style.setProperty('--spot-y', `${py * 100}%`);
      if (!motion.matches) {
        targetX = px * 2 - 1; targetY = py * 2 - 1;
        request();
      }
    }, { signal: controller.signal });
    const reset = () => { targetX = targetY = 0; request(); };
    hitbox.addEventListener('pointerleave', reset, { signal: controller.signal });
    motion.addEventListener('change', reset, { signal: controller.signal });
    cleanups.push(() => cancelAnimationFrame(frame));
  });
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
    });
  }, { threshold: .08 });
  grid.querySelectorAll('.project').forEach(card => reveal.observe(card));
  grid.classList.add('has-motion');
  return { destroy() { controller.abort(); reveal.disconnect(); cleanups.forEach(cleanup => cleanup()); } };
}
