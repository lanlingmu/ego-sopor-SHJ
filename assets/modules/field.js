import { axisAngle, distance, matrix, multiply, rotationBetween, slerp, spherePoint } from './rotation.js';

const TAU = Math.PI * 2;
const RESET_SECONDS = .85;
const DRAG_RESPONSE = 19;
const smoothstep = t => t * t * (3 - 2 * t);

// Geometry is generated once. Each frame only rotates and projects it.
function makeLines() {
  return Array.from({ length: 44 }, (_, row) => {
    const t = row / 43;
    const points = new Float32Array(129 * 3);
    for (let i = 0; i <= 128; i++) {
      const u = i / 128 * TAU;
      const radius = 122 + 34 * Math.cos(u * 3 + t * 3.4);
      points[i * 3] = Math.cos(u) * radius * (.72 + t * .5);
      points[i * 3 + 1] = (t - .5) * 220 + Math.sin(u * 2 + t * 4) * 27;
      points[i * 3 + 2] = Math.sin(u) * radius * (.85 + t * .15);
    }
    return { points, alpha: .22 + t * .52, color: `239,${91 + row},${92 + row}` };
  });
}

export function createField(canvas, { motion }) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const area = canvas.parentElement;
  const controller = new AbortController();
  const listen = (dragTarget, event, fn) => dragTarget?.addEventListener(event, fn, { signal: controller.signal });
  const pause = area.querySelector('[data-field-pause]');
  const reset = area.querySelector('[data-field-reset]');
  const lines = makeLines().map(line => ({ ...line, projected: new Float32Array(line.points.length) }));
  const home = axisAngle(1, 0, 0, -.28);
  // Dragging changes only this camera-space orientation.
  let dragCurrent = home.slice(), dragTarget = home.slice(), resetTween = null;
  // Automatic motion changes only this local-space phase.
  let spinAngle = 0;
  const spinOrientation = () => axisAngle(0, 1, 0, spinAngle);
  const inverseSpin = () => axisAngle(0, 1, 0, -spinAngle);
  let width = 0, height = 0, frame = 0, lastTime = 0, visible = true;
  let dragging = false, paused = false;
  let activePointer = null, grab = null;
  let autoDelay = 0;

  function holdCurrentView() {
    dragTarget = dragCurrent.slice(); resetTween = null;
  }

  function beginGrab(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(width / 440, height / 470);
    const pointerX = (event.clientX - rect.left - width / 2) / scale;
    const pointerY = (event.clientY - rect.top - height / 2 + 4) / scale;
    let closest = null, bestDistance = Infinity;
    for (const { projected } of lines) {
      for (let i = 0; i < projected.length; i += 3) {
        const x = projected[i], y = projected[i + 1], z = projected[i + 2];
        const inversePerspective = (680 - z) / 680;
        const px = x * inversePerspective, py = y * inversePerspective;
        const radius = Math.hypot(px, py, z);
        // Pick the viewer-facing surface, not a line visible through the back.
        if (680 * z <= radius * radius) continue;
        const separation = Math.hypot(x - pointerX, y - pointerY);
        if (separation < bestDistance) { bestDistance = separation; closest = { x, y, radius }; }
      }
    }
    const anchor = closest && bestDistance * scale < 55 ? closest : { x: pointerX, y: pointerY, radius: 190 };
    return {
      originX: event.clientX, originY: event.clientY, scale,
      x: anchor.x, y: anchor.y, radius: anchor.radius,
      start: spherePoint(anchor.x, anchor.y, anchor.radius), orientation: dragCurrent.slice(),
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 440, height / 470);
    const m = matrix(multiply(dragCurrent, spinOrientation()));
    ctx.save(); ctx.translate(width / 2, height / 2 - 4); ctx.scale(scale, scale);
    for (const { points, projected } of lines) {
      for (let i = 0; i < points.length; i += 3) {
        const x = points[i], y = points[i + 1], z = points[i + 2];
        const px = m[0] * x + m[1] * y + m[2] * z;
        const py = m[3] * x + m[4] * y + m[5] * z;
        const depth = m[6] * x + m[7] * y + m[8] * z;
        const perspective = 680 / (680 - depth);
        projected[i] = px * perspective; projected[i + 1] = py * perspective; projected[i + 2] = depth;
      }
    }
    for (const { projected, alpha, color } of lines) {
      ctx.beginPath();
      for (let i = 0; i < projected.length; i += 3) {
        if (i === 0) ctx.moveTo(projected[i], projected[i + 1]);
        else ctx.lineTo(projected[i], projected[i + 1]);
      }
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = .8;
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick(time) {
    frame = 0;
    if (!visible || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
    lastTime = time;
    const follow = motion.matches ? 1 : 1 - Math.exp(-dt * DRAG_RESPONSE);
    autoDelay = Math.max(0, autoDelay - dt);
    if (resetTween) {
      resetTween.elapsed += dt;
      const progress = motion.matches ? 1 : Math.min(1, resetTween.elapsed / RESET_SECONDS);
      dragCurrent = slerp(resetTween.from, resetTween.to, smoothstep(progress));
      if (progress === 1) { dragCurrent = home.slice(); dragTarget = home.slice(); spinAngle = 0; resetTween = null; autoDelay = 1; }
    } else {
      dragCurrent = slerp(dragCurrent, dragTarget, follow);
      if (distance(dragCurrent, dragTarget) < 1e-8) dragCurrent = dragTarget.slice();
    }
    const auto = !paused && !motion.matches && !dragging && !resetTween && autoDelay === 0;
    if (auto) {
      // Clockwise from above around the original local vertical axis.
      // Never bake this turn into the drag orientation.
      spinAngle = (spinAngle - dt * .16) % TAU;
    }
    draw();
    const settling = distance(dragCurrent, dragTarget) > 1e-8;
    if (auto || resetTween || settling || autoDelay > 0 && !paused && !motion.matches) requestDraw();
  }

  function requestDraw() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw(); requestDraw();
  }

  function endDrag(event) {
    if (event.pointerId !== activePointer) return;
    dragging = false; activePointer = null; grab = null;
    autoDelay = .8; area.classList.remove('is-dragging'); requestDraw();
  }

  listen(canvas, 'pointerdown', event => {
    if (event.button !== 0 || activePointer !== null) return;
    holdCurrentView();
    dragging = true; activePointer = event.pointerId;
    grab = beginGrab(event);
    canvas.setPointerCapture(event.pointerId); area.classList.add('is-dragging'); requestDraw();
  });
  listen(canvas, 'pointermove', event => {
    if (dragging) {
      if (event.pointerId !== activePointer) return;
      const x = grab.x + (event.clientX - grab.originX) / grab.scale;
      const y = grab.y + (event.clientY - grab.originY) / grab.scale;
      const point = spherePoint(x, y, grab.radius);
      dragTarget = multiply(rotationBetween(grab.start, point), grab.orientation);
    }
    requestDraw();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => listen(canvas, event, endDrag));
  listen(canvas, 'keydown', event => {
    const turns = { ArrowLeft: [0, 1, 0, -.16], ArrowRight: [0, 1, 0, .16], ArrowUp: [1, 0, 0, .16], ArrowDown: [1, 0, 0, -.16] };
    if (!turns[event.key]) return;
    event.preventDefault(); resetTween = null; autoDelay = 1;
    dragTarget = multiply(axisAngle(...turns[event.key]), dragTarget); requestDraw();
  });
  listen(pause, 'click', () => {
    paused = !paused; pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? '继续转动' : '暂停转动'; requestDraw();
  });
  listen(reset, 'click', () => {
    holdCurrentView();
    // Keep the spin phase frozen during the tween; absorb it into the goal.
    // Rebase both states only after arriving, so reset cannot snap mid-flight.
    const goal = multiply(home, inverseSpin());
    resetTween = { from: dragCurrent.slice(), to: goal, elapsed: 0 };
    dragTarget = goal; requestDraw();
  });
  listen(document, 'visibilitychange', () => { lastTime = 0; requestDraw(); });
  listen(motion, 'change', requestDraw);
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; lastTime = 0; requestDraw(); });
  resizeObserver.observe(canvas); intersectionObserver.observe(canvas); resize();
  return { destroy() { controller.abort(); resizeObserver.disconnect(); intersectionObserver.disconnect(); cancelAnimationFrame(frame); } };
}
