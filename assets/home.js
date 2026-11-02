'use strict';
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    document.querySelectorAll('.project').forEach(project => {
      project.hidden = filter !== 'all' && project.dataset.type !== filter;
      if (!project.hidden) count++;
    });
    document.querySelector('.results').textContent = `显示 ${count} 个网站`;
  });
});

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
if (ctx) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, phase = 0, frame = 0, inView = true;
  const resize = () => {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 500, height / 450);
    ctx.save(); ctx.translate(width / 2, height / 2 - 5); ctx.scale(scale, scale);
    for (let row = 0; row < 52; row++) {
      const t = row / 51;
      ctx.beginPath();
      for (let i = 0; i <= 155; i++) {
        const u = i / 155 * Math.PI * 2;
        const r = 130 + 43 * Math.cos(u * 3 + t * 2.5 + phase);
        const x = Math.cos(u) * r * (0.7 + t * .55);
        const y = Math.sin(u) * r * .55 + (t - .5) * 190 + Math.sin(u * 2 + phase + t * 4) * 22;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.strokeStyle = `rgba(${150 + row},${183 + row},${104 + row},${.2 + t * .47})`;
      ctx.lineWidth = .7; ctx.stroke();
    }
    ctx.restore();
  }
  let previous = 0;
  function animate(time) {
    frame = 0;
    if (document.hidden || !inView || reduced.matches) return;
    if (time - previous > 32) {phase = time * .00012; draw(); previous = time;}
    frame = requestAnimationFrame(animate);
  }
  function resume() {if (!frame && !document.hidden && inView && !reduced.matches) frame = requestAnimationFrame(animate);}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {inView = entries[0].isIntersecting; resume();}).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', () => {if (reduced.matches) {cancelAnimationFrame(frame); frame = 0; draw();} else resume();});
  resume();
}
