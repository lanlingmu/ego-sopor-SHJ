const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - (1 - clamp(value)) ** 3;

// Visual previews only. Full projects still open through the original links.
export function createProjectPreview(card, art, hitbox, { motion }) {
  const kind = card.getAttribute('href')?.split('/')[0];
  if (!['3d_sanddraw', 'Daily-Luck', 'particle-pagoda', 'ripples'].includes(kind)) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'project-preview'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  art.append(canvas);
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let width = 1, height = 1, frame = 0, previousTime = 0;
  let active = false, visible = true, progress = 0, opacity = 0;
  let pointer = { x: .5, y: .5 }, lastWave = null, waveClock = 0;
  let sandTimer = 0, sand = [], sandTargets = [], waves = [];
  const back = kind === 'Daily-Luck' ? new Image() : null;
  if (back) { back.onload = request; back.src = new URL('../tarot-back.svg', import.meta.url).href; }
  const towerArt = kind === 'particle-pagoda' ? new Image() : null;
  if (towerArt) { towerArt.onload = request; towerArt.src = new URL('../pagoda-tower.svg', import.meta.url).href; }

  function chooseSand() {
    let n = 2 + Math.floor(Math.random() * 6), m = 1 + Math.floor(Math.random() * 6);
    if (n === m) m = m % 6 + 1;
    const target = [];
    // Chladni-style nodal lines: sample points close to the zero field.
    for (let tries = 0; target.length < 1450 && tries < 90000; tries++) {
      const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
      const field = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y)
        - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
      if (Math.abs(field) < .055) target.push({ x, y });
    }
    sandTargets = target;
    if (!sand.length) sand = target.map(point => ({ ...point }));
    sandTimer = 0;
  }

  function addWave(point) {
    waves.push({ x: point.x, y: point.y, age: motion.matches ? .35 : 0 });
    if (waves.length > 14) waves.shift();
    lastWave = { ...point }; waveClock = 0;
  }

  function activate(point, pressed = false) {
    const entering = !active;
    const coldStart = entering && opacity < .003;
    active = true;
    pointer = point;
    if (coldStart) previousTime = 0;
    // Re-entry during the exit animation resumes its existing pattern.
    if (kind === '3d_sanddraw' && (coldStart || pressed)) chooseSand();
    if (kind === 'ripples') {
      const moved = !lastWave || Math.hypot((point.x-lastWave.x)*width, (point.y-lastWave.y)*height) > 10;
      if (entering || pressed || moved && waveClock > .055) addWave(point);
    }
    request();
  }

  function deactivate() { active = false; request(); }

  function drawSand(dt) {
    ctx.fillStyle = '#101719'; ctx.fillRect(0, 0, width, height);
    const size = Math.min(width * .66, height * .83);
    const centerX = width * .5, centerY = height * .5;
    const response = motion.matches ? 1 : 1 - Math.exp(-dt * 4);
    ctx.fillStyle = '#a7ddc9';
    sand.forEach((point, i) => {
      const target = sandTargets[i % sandTargets.length];
      point.x += (target.x-point.x) * response; point.y += (target.y-point.y) * response;
      const x = centerX + point.x * size / 2;
      const y = centerY + point.y * size / 2;
      ctx.globalAlpha = .45 + (i % 7) * .065;
      ctx.fillRect(x, y, i % 4 === 0 ? 1.6 : 1.1, i % 4 === 0 ? 1.6 : 1.1);
    });
    ctx.globalAlpha = 1;
  }

  function drawTarot() {
    ctx.fillStyle = '#111216'; ctx.fillRect(0, 0, width, height);
    const spread = ease(progress);
    for (const i of [-4, 4, -3, 3, -2, 2, -1, 1, 0]) {
      const baselineX = Math.sign(i) * width * .183;
      const fanX = i * width * .078;
      const x = width / 2 + baselineX * (1-spread) + fanX * spread;
      const y = height / 2 + Math.abs(i) * height * .024 * spread;
      const cardHeight = height * ((i === 0 ? .573 : .48) * (1-spread) + (.61-Math.abs(i)*.012)*spread);
      const cardWidth = cardHeight / 2;
      const angle = (Math.sign(i)*16*(1-spread) + i*11*spread) * Math.PI/180;
      ctx.save(); ctx.globalAlpha = Math.abs(i) > 1 ? spread : 1;
      ctx.translate(x + (pointer.x-.5)*5*spread, y - (i === 0 ? spread*height*.04 : 0));
      ctx.rotate(angle);
      ctx.shadowColor = '#0008'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 5;
      if (back.complete && back.naturalWidth) ctx.drawImage(back,-cardWidth/2,-cardHeight/2,cardWidth,cardHeight);
      ctx.restore();
    }
  }

  function drawPagodas() {
    // The original cover stays visible underneath: its main tower and ground
    // are never redrawn, resized or replaced during the transition.
    ctx.clearRect(0,0,width,height);
    if(!towerArt.complete||!towerArt.naturalWidth)return;
    const companions=[[-.30,.78,0,.84],[.30,.78,.08,.84],[-.19,.55,.18,.90],[.19,.55,.26,.90]];
    for(const [offset,size,delay,ground] of companions) {
      const growth=ease((progress-delay)/(1-delay));
      if(growth<=0)continue;
      const towerWidth=width*(320/900)*size;
      const towerHeight=height*(410/600)*size;
      const x=width*(.5+offset)-towerWidth/2, bottom=height*ground;
      ctx.save();ctx.globalAlpha=growth;
      // Reveal the exact source artwork from bottom to top, without stretching.
      ctx.drawImage(towerArt,0,410*(1-growth),320,410*growth,
        x,bottom-towerHeight*growth,towerWidth,towerHeight*growth);
      ctx.restore();
    }
  }

  function drawRipples(dt) {
    const gradient=ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,'#173345');gradient.addColorStop(.5,'#4d8994');gradient.addColorStop(1,'#142735');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    waves=waves.filter(wave=>wave.age<2.4);
    for(const wave of waves) {
      wave.age+=dt;
      const radius=wave.age*Math.min(width,height)*.5;
      const alpha=Math.max(0,1-wave.age/2.4)*.68;
      for(let ring=0;ring<3;ring++) {
        const r=radius-ring*7;
        if(r<=0)continue;
        ctx.beginPath();ctx.ellipse(wave.x*width,wave.y*height,r,r*.78,0,0,TAU);
        ctx.strokeStyle=ring%2 ? `rgba(12,42,59,${alpha})` : `rgba(187,238,226,${alpha})`;
        ctx.lineWidth=ring===0?1.6:1;ctx.stroke();
      }
    }
  }

  function tick(time) {
    frame=0;
    if(document.hidden||!visible||card.hidden)return;
    const dt=previousTime?Math.min((time-previousTime)/1000,.05):1/60;previousTime=time;
    waveClock+=dt;sandTimer+=dt;
    const response = motion.matches ? 1 : 1-Math.exp(-dt*(active?5.5:7));
    progress += (Number(active)-progress)*response;
    // First fold the visual back, then blend into its original cover. One
    // animation clock owns both; CSS no longer competes with this transition.
    const opacityTarget = active ? 1 : ease(progress/.3);
    opacity += (opacityTarget-opacity)*(motion.matches?1:1-Math.exp(-dt*9));
    if(!active && progress<.002 && opacity<.003){progress=0;opacity=0;}
    if(kind==='3d_sanddraw') {
      if(active&&!motion.matches&&sandTimer>2.2)chooseSand();
      if(sand.length)drawSand(dt);
    } else if(kind==='Daily-Luck')drawTarot();
    else if(kind==='particle-pagoda')drawPagodas();
    else {
      if(active&&!motion.matches&&waveClock>.42)addWave(pointer);
      drawRipples(motion.matches?0:dt);
    }
    const artReady = (!back || back.complete && back.naturalWidth) && (!towerArt || towerArt.complete && towerArt.naturalWidth);
    if(artReady) {
      canvas.style.opacity=String(opacity);
      art.classList.toggle('has-preview',active||opacity>0);
    }
    if(active&&!motion.matches||!active&&(progress>0||opacity>0)||kind==='Daily-Luck'&&!back.complete)request();
  }

  function request() { if(!frame&&visible&&!document.hidden&&!card.hidden)frame=requestAnimationFrame(tick); }
  function resize() {
    const box=hitbox.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);if(active||opacity>0)request();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(hitbox);
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;previousTime=0;
    if(!visible){cancelAnimationFrame(frame);frame=0;}else if(active||opacity>0)request();
  });observer.observe(hitbox);
  document.addEventListener('visibilitychange',()=>{
    previousTime=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(active||opacity>0)request();
  },options);
  motion.addEventListener('change',()=>{if(active||opacity>0)request();},options);
  resize();
  return {activate,deactivate,destroy(){controller.abort();resizeObserver.disconnect();observer.disconnect();cancelAnimationFrame(frame);if(back)back.onload=null;if(towerArt)towerArt.onload=null;canvas.remove();}};
}
