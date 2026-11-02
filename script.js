const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/3PUWHQCP5D';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ | /g, ' ');
  document.documentElement.classList.add('js');

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Moscow time =====
  const msk = $('#msk');
  const tick = () => {
    if (!msk) return;
    msk.textContent = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' }).format(new Date());
  };
  tick(); setInterval(tick, 15000);

  // ===== count up =====
  const countUp = (el, dur = 1100) => {
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.fmt === 'rub' ? ' ₽' : '';
    if (reduce || Number.isNaN(target)) return;
    const t0 = performance.now();
    const step = t => {
      const p = clamp((t - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ===== words split (headings) =====
  $$('[data-split]').forEach(el => {
    const text = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    text.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', i);
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < text.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // ===== reveal on scroll (rAF check, not IntersectionObserver) =====
  const rvSel = ['.cmd', '.then__lead', '.tile', '.never li', '.pr__names button', '.pr__stage', '.faq details', '.cta__p', '.dlg', '.ft', '.foot__cr', '.connect__ctl'];
  const rvEls = $$(rvSel.join(','));
  rvEls.forEach(el => {
    el.classList.add('rv');
    const sibs = el.parentElement ? [...el.parentElement.children] : [el];
    el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 70 + 'ms');
  });
  const splits = $$('[data-split]');
  let pending = [...rvEls, ...splits];

  const checkReveal = () => {
    const vh = innerHeight;
    pending = pending.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) {
        el.classList.add('in');
        return false;
      }
      return true;
    });
  };

  // ===== hero reel =====
  const hero = $('#top');
  const track = $('#reelTrack');
  const frames = $$('.frame', track);
  let heroPos = 0;
  const heroUpdate = () => {
    if (!hero || !track || reduce) return;
    const r = hero.getBoundingClientRect();
    const scrollable = hero.offsetHeight - innerHeight;
    const p = clamp(-r.top / scrollable);
    const n = frames.length;
    const s = p * (n - 1);
    const i = Math.min(n - 2, Math.floor(s));
    const f = s - i;
    const k = clamp((f - 0.5) / 0.5);
    const e = k * k * (3 - 2 * k);
    heroPos = p >= 1 ? n - 1 : i + e;
    const fh = frames[0].offsetHeight;
    const gap = parseFloat(getComputedStyle(frames[0]).marginBottom) || 0;
    track.style.transform = `translate3d(0, ${-(heroPos * (fh + gap)).toFixed(2)}px, 0)`;
    frames.forEach((fr, idx) => {
      const d = Math.abs(heroPos - idx);
      fr.style.opacity = (1 - Math.min(1, d) * 0.5).toFixed(3);
      fr.style.visibility = d > 1.05 ? 'hidden' : '';
      const on = d < 0.5;
      if (on && !fr.classList.contains('is-on')) {
        fr.classList.add('is-on');
        countUp($('[data-count]', fr));
      }
    });
    $$('.is-on', track).forEach(fr => {
      if (Math.abs(heroPos - frames.indexOf(fr)) >= 0.5) fr.classList.remove('is-on');
    });
  };
  heroUpdate();
  if (frames[0]) countUp($('[data-count]', frames[0]), 1600);

  // ===== header hide =====
  const header = $('#header');
  let lastY = scrollY;
  const headerUpdate = () => {
    const y = scrollY;
    if (!header) return;
    if (y > lastY + 6 && y > 240) header.classList.add('is-hid');
    else if (y < lastY - 6 || y < 120) header.classList.remove('is-hid');
    lastY = y;
  };

  // ===== parallax on pictures =====
  const pics = $$('.pic img');
  const parallax = () => {
    if (reduce) return;
    const vh = innerHeight;
    pics.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const off = (r.top + r.height / 2 - vh / 2) * -0.07;
      img.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) scale(1.14)`;
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      heroUpdate(); checkReveal(); headerUpdate(); parallax();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  // first paint + after fonts
  heroUpdate(); checkReveal(); parallax();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);
  addEventListener('load', onScroll);

  // ===== COMMAND LIST =====
  const cmdList = $('#cmdList');
  const cmdInput = $('#cmdInput');
  const cmdNone = $('#cmdNone');
  if (cmdList) {
    const items = $$('li', cmdList);
    const visible = () => items.filter(li => !li.hidden);
    const select = li => {
      items.forEach(x => { x.classList.toggle('is-sel', x === li); x.setAttribute('aria-selected', x === li ? 'true' : 'false'); });
    };
    items.forEach(li => {
      li.addEventListener('mouseenter', () => { if (fine) select(li); });
      li.addEventListener('click', () => select(li));
      li.addEventListener('focus', () => select(li));
    });
    cmdInput.addEventListener('input', () => {
      const q = cmdInput.value.trim().toLowerCase();
      items.forEach(li => { li.hidden = q && !li.textContent.toLowerCase().includes(q); });
      const vis = visible();
      cmdNone.hidden = vis.length > 0;
      if (vis.length && !vis.some(li => li.classList.contains('is-sel'))) select(vis[0]);
    });
    const move = dir => {
      const vis = visible();
      if (!vis.length) return;
      const cur = vis.findIndex(li => li.classList.contains('is-sel'));
      select(vis[(cur + dir + vis.length) % vis.length]);
    };
    $('#cmd').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    });
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      const li = items.find(x => x.dataset.key === e.key.toLowerCase());
      if (li && !li.hidden) {
        const r = $('#cmd').getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) select(li);
      }
    });
  }

  // ===== QR (decorative, drawn) =====
  const qr = $('#qrSvg');
  if (qr) {
    const N = 25;
    let seed = 20261101;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const cells = [];
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    const finder = (ox, oy) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) cells.push([ox + x, oy + y]);
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > 0.52) cells.push([x, y]);
    }
    qr.innerHTML = '<path fill="#10181C" d="' + cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('') + '"/>';
  }

  // ===== STAGE SLIDER =====
  const range = $('#stageRange');
  if (range) {
    const clauses = ['Сначала поставьте приложение', 'Затем добавьте расширение в 1С', 'Потом отсканируйте QR-код', 'Готово: отчёты на телефоне'];
    const names = ['Приложение', 'Расширение', 'QR-код', 'Готово'];
    const clause = $('#clause');
    const slides = $$('.fx__s');
    const nameLis = $$('#stageNames li');
    const fill = $('#rngFill');
    let cur = -1;
    const set = i => {
      if (i === cur) return;
      const first = cur === -1;
      cur = i;
      range.value = i;
      range.setAttribute('aria-valuetext', names[i]);
      fill.style.width = `calc(${i / 3} * (100% - 32px) + 16px)`;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
      nameLis.forEach((l, k) => l.classList.toggle('is-on', k === i));
      if (first) { clause.textContent = clauses[i]; return; }
      clause.classList.add('is-swap');
      setTimeout(() => { clause.textContent = clauses[i]; clause.classList.remove('is-swap'); }, 200);
    };
    range.addEventListener('input', () => set(+range.value));
    $$('#stageNames button').forEach(b => b.addEventListener('click', () => set(+b.dataset.i)));
    set(0);
  }

  // ===== PRICING =====
  const prNames = $$('.pr__names button');
  if (prNames.length) {
    const plans = [
      { n: 'Месяц', price: 1990, per: 'за месяц', text: 'Можно начать с одного месяца и остаться, если понравится. Чем дольше срок, тем дешевле выходит каждый месяц.' },
      { n: '3 месяца', price: 5670, per: 'за 3 месяца', text: 'Это 1 890 ₽ в месяц, на 300 ₽ дешевле, чем платить помесячно.' },
      { n: '6 месяцев', price: 10380, per: 'за 6 месяцев', text: 'Это 1 730 ₽ в месяц, на 1 560 ₽ дешевле, чем платить помесячно.' },
      { n: '12 месяцев', price: 14990, per: 'за 12 месяцев', text: 'Это около 1 250 ₽ в месяц, на 8 890 ₽ дешевле, чем платить помесячно.' },
    ];
    const num = $('#prNum'), per = $('#prPer'), txt = $('#prText'), btn = $('#prBtn'), stage = $('#prStage');
    let shown = 10380, cur = 2, anim = 0;
    const roll = to => {
      cancelAnimationFrame(anim);
      const from = shown, t0 = performance.now(), dur = reduce ? 1 : 650;
      const step = t => {
        const p = clamp((t - t0) / dur);
        shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
        num.textContent = fmt(shown);
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    const pick = i => {
      if (i === cur) return;
      cur = i;
      prNames.forEach((b, k) => { b.classList.toggle('is-sel', k === i); b.setAttribute('aria-selected', k === i); });
      stage.classList.add('is-swap');
      setTimeout(() => {
        per.textContent = plans[i].per;
        txt.textContent = plans[i].text;
        btn.textContent = plans[i].n + ': начать бесплатно';
        stage.classList.remove('is-swap');
      }, 160);
      roll(plans[i].price);
    };
    prNames.forEach((b, k) => { b.addEventListener('click', () => pick(k)); b.addEventListener('focus', () => pick(k)); });
  }

  // ===== magnetic buttons =====
  if (fine && !reduce) {
    $$('.btn, .ui__btn, .ft--go').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${(x * 8).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // ===== smooth anchors =====
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = href === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - (href === '#connect' ? 0 : 72);
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ===== FORM → CLOUDFLARE WORKER → TELEGRAM =====
  const form = $('#leadForm');
  const msg = $('#formMsg');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    msg.classList.remove('err');
    if (!payload.name || !payload.contact) { msg.textContent = 'Заполните имя и контакт'; msg.classList.add('err'); return; }
    if (!payload.consent) { msg.textContent = 'Нужно согласие на обработку данных'; msg.classList.add('err'); return; }
    delete payload.consent;
    payload.source = 'BossMonitor — лендинг';
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Отправлено';
      msg.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
      msg.textContent = 'Не удалось отправить. Попробуйте ещё раз.';
      msg.classList.add('err');
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });
})();
