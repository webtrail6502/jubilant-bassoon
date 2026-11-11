/* Water-ripple background: a "stone" drops in the water and rings spread out and fade.
   Usage: RippleBG.attach(element, { tone: "light" | "dark", interval: 2600 }) */
(function () {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TONES = {
    light: { shade: "rgba(40,92,104,", glow: "rgba(255,255,248,", dot: "rgba(40,92,104," },
    dark:  { shade: "rgba(0,0,0,",       glow: "rgba(130,170,235,", dot: "rgba(130,170,235," }
  };

  function attach(host, opts) {
    opts = opts || {};
    const tone = TONES[opts.tone] || TONES.light;
    const interval = opts.interval || 2600;
    const squash = opts.squash || 0.36;            /* ellipse flatness, like water seen at an angle */
    const canvas = document.createElement("canvas");
    canvas.className = "rp-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.insertBefore(canvas, host.firstChild);
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1, drops = [], last = 0, timer = 0, running = true;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function drop(x, y, big) {
      const reach = Math.max(W, H) * (big ? 0.55 : 0.4) + 120;
      drops.push({ x: x, y: y, t: 0, reach: reach, rings: 6 + Math.floor(Math.random() * 3) });
      if (drops.length > 7) drops.shift();
    }
    function randomDrop() {
      drop(W * (0.12 + Math.random() * 0.76), H * (0.2 + Math.random() * 0.65), false);
    }
    function ring(d, r, a, lw) {
      if (r <= 0 || a <= 0.01) return;
      ctx.beginPath(); ctx.ellipse(d.x, d.y + lw * 0.9, r, r * squash, 0, 0, Math.PI * 2);
      ctx.strokeStyle = tone.shade + (a * 0.55) + ")"; ctx.lineWidth = lw * 1.6; ctx.stroke();     /* soft shadow side */
      ctx.beginPath(); ctx.ellipse(d.x, d.y, r, r * squash, 0, 0, Math.PI * 2);
      ctx.strokeStyle = tone.glow + a + ")"; ctx.lineWidth = lw; ctx.stroke();                      /* bright crest */
    }
    function frame(ts) {
      if (!running) return;
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      ctx.clearRect(0, 0, W, H);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.t += dt;
        const life = d.t / 7;                       /* 7s per drop */
        if (life >= 1) { drops.splice(i, 1); continue; }
        const lead = d.reach * (1 - Math.pow(1 - life, 2.2));
        for (let k = 0; k < d.rings; k++) {
          const r = lead - k * (16 + k * 5);
          const fade = Math.max(0, 1 - life) * (1 - k / (d.rings + 1));
          ring(d, r, fade * 0.8, 1.4 + (d.rings - k) * 0.25);
        }
        if (d.t < 0.6) {                            /* splash dot where the stone landed */
          const s = 1 - d.t / 0.6;
          ctx.beginPath(); ctx.ellipse(d.x, d.y, 3 + 8 * (1 - s), (3 + 8 * (1 - s)) * squash, 0, 0, Math.PI * 2);
          ctx.fillStyle = tone.dot + (0.5 * s) + ")"; ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    function pos(e) { const b = host.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }

    size(); window.addEventListener("resize", size);
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);

    if (reduce) {                                   /* motion-sensitive users: one still frame of rings */
      const d = { x: W * 0.5, y: H * 0.55, t: 3, reach: Math.max(W, H) * 0.4 + 120, rings: 7 };
      const life = 3 / 7, lead = d.reach * (1 - Math.pow(1 - life, 2.2));
      for (let k = 0; k < d.rings; k++) ring(d, lead - k * (16 + k * 5), 0.5, 1.5);
      return;
    }
    host.addEventListener("pointerdown", function (e) { const p = pos(e); drop(p[0], p[1], true); });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { last = 0; requestAnimationFrame(frame); }
    });
    randomDrop(); setTimeout(randomDrop, 1100);
    timer = setInterval(function () { if (running) randomDrop(); }, interval);
    requestAnimationFrame(frame);
  }
  window.RippleBG = { attach: attach };
})();
