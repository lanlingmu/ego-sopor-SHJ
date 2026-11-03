import { createProjectPreview } from './project-previews.js';

export function createGallery(grid, { motion }) {
  if (!grid) return;
  const controller = new AbortController();
  const cleanups = [];
  grid.querySelectorAll('.project').forEach(card => {
    const art = card.querySelector('.project-art');
    const hitbox = card.querySelector('.project-visual');
    const preview = createProjectPreview(card, art, hitbox, { motion });
    cleanups.push(() => preview?.destroy());
    let frame = 0, lastTime = 0, engaged = false, targetX = 0, targetY = 0, x = 0, y = 0;
    let activeTouch = null, touchStart = null, suppressClickUntil = 0;
    function render(time) {
      frame = 0;
      const dt=lastTime?Math.min((time-lastTime)/1000,.05):1/60;
      lastTime=time;
      const response=1-Math.exp(-dt*(engaged?14:8));
      x += (targetX - x) * response; y += (targetY - y) * response;
      art.style.setProperty('--rx', `${-y * 5}deg`);
      art.style.setProperty('--ry', `${x * 7}deg`);
      art.style.setProperty('--px', `${x * 7}px`);
      art.style.setProperty('--py', `${y * 7}px`);
      if (Math.abs(x - targetX) + Math.abs(y - targetY) > .002) frame = requestAnimationFrame(render);
    }
    function request() { if (!frame) frame = requestAnimationFrame(render); }
    function followPointer(event) {
      if (event.pointerType === 'touch' && event.pointerId !== activeTouch) return;
      engaged = true;
      hitbox.classList.add('is-pointer-active');
      // The stationary image wrapper owns pointer input. The inner artwork
      // can tilt without moving the hitbox into the caption.
      const bounds = hitbox.getBoundingClientRect();
      const localX = Number.isFinite(event.offsetX) ? event.offsetX : event.clientX - bounds.left;
      const localY = Number.isFinite(event.offsetY) ? event.offsetY : event.clientY - bounds.top;
      const px = Math.max(0, Math.min(1, localX / (hitbox.clientWidth || bounds.width)));
      const py = Math.max(0, Math.min(1, localY / (hitbox.clientHeight || bounds.height)));
      art.style.setProperty('--spot-x', `${px * 100}%`);
      art.style.setProperty('--spot-y', `${py * 100}%`);
      preview?.activate({ x: px, y: py }, event.type === 'pointerdown');
      if (!motion.matches) {
        targetX = px * 2 - 1; targetY = py * 2 - 1;
        request();
      }
    }
    const reset = () => {
      engaged = false; targetX = targetY = 0; activeTouch = touchStart = null;
      hitbox.classList.remove('is-pointer-active'); preview?.deactivate(); request();
    };
    const options = { signal: controller.signal };
    hitbox.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') followPointer(event);
    }, options);
    hitbox.addEventListener('pointerdown', event => {
      if (event.isPrimary === false) return;
      suppressClickUntil = 0;
      if (event.pointerType === 'touch') {
        activeTouch = event.pointerId;
        touchStart = { x: event.clientX, y: event.clientY };
      }
      followPointer(event);
    }, options);
    hitbox.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' && event.pointerId === activeTouch && touchStart) {
        if (Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) {
          suppressClickUntil = performance.now() + 700;
        }
      }
      followPointer(event);
    }, options);
    hitbox.addEventListener('pointerup', event => {
      if (event.pointerType === 'touch' && event.pointerId === activeTouch) reset();
    }, options);
    hitbox.addEventListener('pointercancel', reset, options);
    hitbox.addEventListener('pointerleave', reset, options);
    card.addEventListener('click', event => {
      // A deliberate tap still opens the project; a finger swipe only previews it.
      if (event.detail !== 0 && performance.now() < suppressClickUntil) event.preventDefault();
    }, { ...options, capture: true });
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
