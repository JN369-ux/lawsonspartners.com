// Lawsons Partners — first look. One gold-and-teal ribbon behind the page; it twists (folds) and moves with each chapter.
(() => {
  document.documentElement.classList.add('js');
  const body = document.body, root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // entry: the mark is drawn, fills, the name is written, then the logo settles into the nav and the ribbon unfurls.
  // Once per session; any input skips straight to the landing.
  const intro = document.getElementById('intro');
  let seen = false; try { seen = sessionStorage.getItem('lp-intro') === '1'; } catch (e) {}
  if (intro && !reduce && !seen) {
    root.classList.add('intro-on', 'intro-nav'); intro.hidden = false;
    const timers = [], at = (ms, f) => timers.push(setTimeout(f, ms));
    const skip = () => open(true), evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach(e => addEventListener(e, skip, { passive: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.add('draw')));
    at(950, () => intro.classList.add('fill'));
    at(1300, () => intro.classList.add('write'));
    at(2450, () => open(false));
    function open(fast) {
      if (intro.classList.contains('open')) return;
      timers.forEach(clearTimeout); evs.forEach(e => removeEventListener(e, skip));
      intro.classList.add('draw', 'fill', 'write', 'open');
      const logo = intro.querySelector('.intro-logo'), a = logo.getBoundingClientRect(), b = document.querySelector('.wm img').getBoundingClientRect();
      logo.style.transform = `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${b.width / a.width})`;
      setTimeout(() => { root.classList.remove('intro-on'); t0 = performance.now(); }, fast ? 0 : 250);
      setTimeout(() => { root.classList.remove('intro-nav'); intro.classList.add('done'); }, 880);
      setTimeout(() => { intro.hidden = true; }, 1400);
      try { sessionStorage.setItem('lp-intro', '1'); } catch (e) {}
    }
  }

  // entrances
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ribbon: centre line is a gentle wave; the ribbon's width follows cos(twist), so it folds where the twist passes 90°.
  // Front face is gold, back face is teal, shaded by how square-on the face is.
  const cv = document.getElementById('ribbon'), g = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, small = false;
  const resize = () => { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; small = W < 700; cv.width = W * DPR; cv.height = H * DPR; };
  resize(); addEventListener('resize', resize);

  // per chapter: vertical centre, wave height, tilt (radians), width, number of folds across the screen, opacity
  const STATES = {
    hero:      { y: .86, amp: .05, tilt: -.1, w: 34, folds: 1.5, a: 1 },
    borders:   { y: .5,  amp: .2,  tilt: -.6,  w: 26, folds: 2.5, a: .55 },
    help:      { y: .82, amp: .03, tilt: 0,    w: 30, folds: 4,   a: 1 },
    providers: { y: 1.0, amp: .012, tilt: 0, w: 14, folds: 6, a: .32 },
    standards: { y: .9,  amp: .05, tilt: .08,  w: 22, folds: 2,   a: .6 },
    contact:   { y: .9,  amp: .06, tilt: -.12, w: 26, folds: 1.5, a: .55 },
  };
  const fitHero = () => { STATES.hero.y = small ? .95 : .86; }; fitHero(); addEventListener('resize', fitHero);
  const sections = [...document.querySelectorAll('[data-ribbon]')], keys = Object.keys(STATES.hero);
  const cur = { ...STATES.hero }, vel = {};
  const smooth = t => t * t * (3 - 2 * t);
  function target() {
    const mid = H * .5;
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        const a = STATES[sections[i].dataset.ribbon], nx = sections[i + 1];
        if (!nx) return a;
        const f = smooth(Math.min(1, Math.max(0, ((mid - r.top) / r.height - .45) / .55))), b = STATES[nx.dataset.ribbon], o = {};
        keys.forEach(k => o[k] = a[k] + (b[k] - a[k]) * f);
        return o;
      }
    }
    return STATES.hero;
  }

  const STOPS = [[0, 243, 154, 59], [.38, 236, 196, 76], [.68, 60, 193, 182], [1, 20, 158, 216]];
  const hue = u => { for (let s = 1; s < STOPS.length; s++) if (u <= STOPS[s][0]) { const [p, ...A] = STOPS[s - 1], [q, ...B] = STOPS[s], f = (u - p) / (q - p); return A.map((v, i) => v + (B[i] - v) * f); } return STOPS[3].slice(1); };
  let t0 = performance.now(), last = t0;
  function draw(time, grow) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    const N = 160, x0 = -W * .15, x1 = W * 1.15, cy = cur.y * H, tilt = cur.tilt;
    const phase = time * .25 + scrollY * .0022, wBase = cur.w * (small ? .7 : 1);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = x0 + (x1 - x0) * u;
      const y = cy + Math.sin(u * Math.PI * 1.6 + phase * .6) * cur.amp * H + (x - W / 2) * Math.tan(tilt);
      const tw = u * Math.PI * cur.folds + phase;               // twist angle
      pts.push([x, y, Math.cos(tw)]);
    }
    const end = Math.max(1, Math.floor(N * grow));
    for (let i = 0; i < end; i++) {
      const [ax, ay, ac] = pts[i], [bx, by, bc] = pts[i + 1];
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      const ha = wBase * ac, hb = wBase * bc;
      const front = (ac + bc) / 2 >= 0, shade = Math.min(1, Math.abs((ac + bc) / 2)), [r, gg, b] = hue(i / N);
      const k = front ? .94 + .06 * shade : .84 + .08 * shade, m = front ? 0 : .06;
      g.fillStyle = `rgba(${Math.round((r * (1 - m) + 6 * m) * k)},${Math.round((gg * (1 - m) + 56 * m) * k)},${Math.round((b * (1 - m) + 65 * m) * k)},${cur.a})`;
      g.beginPath();
      g.moveTo(ax + nx * ha, ay + ny * ha); g.lineTo(bx + nx * hb, by + ny * hb);
      g.lineTo(bx - nx * hb, by - ny * hb); g.lineTo(ax - nx * ha, ay - ny * ha); g.closePath(); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = .8; g.stroke();   // seals the hairline seams between segments
    }
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = target();
    keys.forEach(k => { vel[k] = ((vel[k] || 0) + (t[k] - cur[k]) * 26 * dt) * Math.exp(-9 * dt); cur[k] += vel[k] * dt; });
    const grow = Math.min(1, (now - t0) / 1400);                 // the ribbon unfurls from the left on load
    draw(now / 1000, 1 - Math.pow(1 - grow, 3));
    requestAnimationFrame(frame);
  }
  if (reduce) { const still = () => { Object.assign(cur, target()); draw(0, 1); }; addEventListener('scroll', still, { passive: true }); addEventListener('resize', still); still(); }
  else requestAnimationFrame(frame);

  // nav background once the hero has scrolled
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // enquiry form: validates, then posts to /api/enquiry (a Pages Function that emails it); if that fails, offers the note as a ready-made email
  const form = document.getElementById('enquiry'), status = form.querySelector('.form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelectorAll('.err').forEach(x => x.remove());
    let first = null;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.setAttribute('aria-invalid', bad);
      if (bad) { const m = document.createElement('p'); m.className = 'err'; m.id = f.id + '-err'; m.textContent = f.type === 'email' && f.value.trim() ? 'Please check this email address.' : 'Please fill this in.'; f.after(m); f.setAttribute('aria-describedby', m.id); first = first || f; }
      else f.removeAttribute('aria-describedby');
    });
    if (first) { first.focus(); return; }
    const d = new FormData(form), btn = form.querySelector('button[type="submit"]'); btn && (btn.disabled = true);
    const body = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\nCountry: ${d.get('country')}\n\n${d.get('help')}`;
    const href = 'mailto:info@lawsonspartners.com?subject=' + encodeURIComponent('Speak to an adviser') + '&body=' + encodeURIComponent(body);
    fetch('https://lawsons-partners.pages.dev/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(d)) })
      .then(r => { if (!r.ok) throw new Error(r.status); status.hidden = false; status.textContent = 'Thank you. Your message has been sent, and an adviser will be in touch.'; form.reset(); })
      .catch(() => { status.hidden = false; status.innerHTML = 'Sorry, that didn’t send. <a href="' + href + '">Send it by email instead</a> — your message is already filled in.'; })
      .finally(() => { btn && (btn.disabled = false); });
  });

  // provider lines: each row drifts (opposite ways), quickens with the scroll, slows under the pointer, pauses on request
  const lines = document.querySelector('.lines');
  if (lines) {
    const rows = [...lines.querySelectorAll('.line')].map(line => {
      const track = line.querySelector('.track');
      [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
      return { line, track, dir: +line.dataset.dir, x: 0, set: 0, hover: 0, hoverT: 0 };
    });
    const btn = document.querySelector('.lines-pause');
    let paused = reduce, seen = false, lastY = scrollY, boost = 0, prev = performance.now();
    if (reduce) lines.classList.add('static');
    const measure = () => rows.forEach(r => { r.set = r.track.scrollWidth / 2; if (r.dir > 0 && !r.x) r.x = -r.set; });
    measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
    rows.forEach(r => { r.line.addEventListener('pointerenter', () => r.hoverT = 1); r.line.addEventListener('pointerleave', () => r.hoverT = 0); });
    new IntersectionObserver(([e]) => seen = e.isIntersecting).observe(lines);
    btn.addEventListener('click', () => { paused = !paused; btn.textContent = paused ? 'Play the names' : 'Pause the names'; });
    const tick = now => {
      const dt = Math.min(.05, (now - prev) / 1000); prev = now;
      const v = Math.min(1, Math.abs(scrollY - lastY) / Math.max(dt, .001) / 2000); lastY = scrollY;
      boost += (v - boost) * (1 - Math.exp(-(v > boost ? 8 : 2) * dt));
      if (seen && !paused) rows.forEach(r => {
        r.hover += (r.hoverT - r.hover) * (1 - Math.exp(-6 * dt));
        r.x += r.dir * 38 * (1 + boost * 5) * (1 - r.hover * .85) * dt;
        if (r.x <= -r.set) r.x += r.set; if (r.x > 0) r.x -= r.set;
        r.track.style.transform = `translate3d(${r.x}px,0,0)`;
      });
      requestAnimationFrame(tick);
    };
    if (!reduce) requestAnimationFrame(tick);
  }

  // the figure counts up once, when it arrives
  const count = document.querySelector('.count');
  if (count && !reduce) {
    const to = +count.dataset.to; count.textContent = '0';
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now(), run = now => { const k = Math.min(1, (now - t0) / 1600); count.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(run); };
      requestAnimationFrame(run);
    }, { rootMargin: '0px 0px -20% 0px' }).observe(count);
  }

  // review marks
  const toggle = document.querySelector('.review-toggle');
  const label = () => toggle.textContent = body.classList.contains('clean') ? 'Show review marks' : 'Hide review marks';
  if (toggle) { toggle.addEventListener('click', () => { body.classList.toggle('clean'); label(); }); label(); }
})();
