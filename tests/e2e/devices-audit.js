/** Auditoría en 7 tamaños y 2 temas: modal, desbordes, objetivos táctiles y contraste. Informe en $OUT/audit.json. Ver tests/README.md. */
const { chromium } = require('playwright');
const fs0 = require('fs'), os0 = require('os'), path0 = require('path');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const OUT = process.env.OUT || path0.join(os0.tmpdir(), 'clz-e2e'); fs0.mkdirSync(OUT, { recursive: true });

const VPS = [
  ['phone-320', 320, 568, 2, true], ['phone-375', 375, 740, 2, true], ['phone-414', 414, 896, 2, true],
  ['phone-land-740x360', 740, 360, 2, true], ['tablet-768', 768, 1024, 2, true], ['laptop-1024', 1024, 768, 1, false], ['desk-1440', 1440, 900, 1, false],
];
const pageFns = {
  contrast: () => {
    const parse = (c) => {
      let m = c.match(/rgba?\(([^)]+)\)/);
      if (m) { const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [r, g, b, a]; }
      m = c.match(/color\(srgb ([^)]+)\)/);
      if (m) { const [r, g, b, a = 1] = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [r * 255, g * 255, b * 255, a]; }
      return null;
    };
    const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const t = walker.currentNode; const txt = t.textContent.trim(); if (!txt) continue;
      const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('[disabled],button:disabled,.hidden,[aria-hidden="true"]')) continue;
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName)) continue;
      let fg = parse(cs.color); if (!fg) continue;
      let op = 1, n = el, layers = [], grad = false;
      while (n) { const s = getComputedStyle(n); op *= parseFloat(s.opacity); const bg = parse(s.backgroundColor); if (bg && bg[3] > 0) layers.push(bg); if (s.backgroundImage !== 'none' && /gradient/.test(s.backgroundImage)) grad = true; if (bg && bg[3] >= .99) break; n = n.parentElement; }
      let base = [255, 255, 255, 1]; const root = getComputedStyle(document.body).backgroundColor; const rb = parse(root); if (rb && rb[3] > 0) base = [rb[0], rb[1], rb[2], 1];
      let bgc = base; for (let i = layers.length - 1; i >= 0; i--) bgc = over(layers[i], bgc);
      fg = [fg[0], fg[1], fg[2], fg[3] * op]; const fgc = over(fg, bgc);
      const L1 = lum(fgc), L2 = lum(bgc); const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (cr < need) out.push({ sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), cr: +cr.toFixed(2), need, size, grad, txt: txt.slice(0, 40) });
    }
    return out;
  },
  layout: () => {
    const vw = innerWidth, vh = innerHeight; const res = { hScroll: document.documentElement.scrollWidth > vw + 1, clipped: [], small: [], offscreen: [] };
    const nav = document.getElementById('floatingNav')?.getBoundingClientRect();
    document.querySelectorAll('button, a.btn-doc, select, input:not([type=hidden]):not([type=checkbox]), summary, .nav-item, .seg-btn, .rating-opt, .icon-btn').forEach(e => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || e.closest('.hidden,[aria-hidden="true"],.collapsible-content,details:not([open]) > :not(summary)')) return;
      const id = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '');
      if (r.right > vw + 1 || r.left < -1) res.offscreen.push(id + ' ' + Math.round(r.left) + '→' + Math.round(r.right));
      if (e.scrollWidth > e.clientWidth + 2 && cs.overflow !== 'visible' && ['BUTTON', 'A', 'SUMMARY'].includes(e.tagName)) res.clipped.push(id + ' "' + e.textContent.trim().slice(0, 24) + '"');
      if ((r.width < 44 || r.height < 44) && !(e.type === 'checkbox')) res.small.push(id + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    res.small = [...new Set(res.small)]; return res;
  },
};
(async () => {
  const b = await chromium.launch();
  const summary = {};
  for (const theme of ['dark', 'light']) {
    for (const [name, w, h, dsf, mobile] of VPS) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile });
      const p = await ctx.newPage(); p.on('dialog', d => d.accept());
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(BASE + '/index.html'); await p.waitForTimeout(500);
      await p.evaluate(t => { const s = document.getElementById('themeSelect'); s.value = t; s.dispatchEvent(new Event('change')); }, theme);
      await p.evaluate(() => document.querySelector('[data-tab="ajustes"]').click());
      await p.evaluate(() => { document.getElementById('btnLoadDemoManual').closest('details').open = true; document.getElementById('btnLoadDemoManual').click(); });
      await p.waitForTimeout(600);
      // --- modal ---
      const modalInfo = await p.evaluate(() => {
        const bd = document.getElementById('modalBackdrop'); const m = document.querySelector('.modal'); const btn = document.getElementById('btnModalClose');
        if (getComputedStyle(bd).display === 'none') return { open: false };
        const mr = m.getBoundingClientRect(), br = btn.getBoundingClientRect();
        const nav = document.getElementById('floatingNav').getBoundingClientRect();
        const hdr = document.querySelector('.site-header').getBoundingClientRect();
        const topAtNav = document.elementFromPoint(nav.left + nav.width / 2, nav.top + nav.height / 2);
        const topAtHdr = document.elementFromPoint(hdr.left + hdr.width / 2, hdr.top + hdr.height / 2);
        return {
          open: true, modalH: Math.round(mr.height), vh: innerHeight, btnVisible: br.bottom <= innerHeight && br.top >= 0, modalClipped: mr.bottom > innerHeight || mr.top < 0,
          navAboveBackdrop: !bd.contains(topAtNav), headerAboveBackdrop: !bd.contains(topAtHdr), bodyScrollLocked: getComputedStyle(document.body).overflow === 'hidden',
          labelled: !!bd.getAttribute('aria-labelledby'), role: bd.getAttribute('role'),
        };
      });
      await p.screenshot({ path: `${OUT}/aud-${theme}-${name}-modal.png` });
      await p.evaluate(() => document.getElementById('btnModalClose').click());
      const rec = { modal: modalInfo, errs, tabs: {} };
      for (const [tab, view] of [['registro', 'form'], ['registro', 'list'], ['graficas'], ['ajustes'], ['recursos']]) {
        await p.evaluate(([t, v]) => { document.querySelector(`[data-tab="${t}"]`).click(); if (v) window.setRegView(v); document.querySelectorAll('#tab-' + t + ' details').forEach(d => d.open = true); }, [tab, view]);
        await p.waitForTimeout(250);
        const key = tab + (view ? ':' + view : '');
        rec.tabs[key] = { layout: await p.evaluate(pageFns.layout), contrast: await p.evaluate(pageFns.contrast) };
        if (['phone-375', 'tablet-768', 'phone-land-740x360', 'desk-1440'].includes(name) && theme === 'dark') await p.screenshot({ path: `${OUT}/aud-${name}-${key.replace(':', '-')}.png`, fullPage: false });
      }
      summary[theme + '/' + name] = rec; await ctx.close();
    }
  }
  require('fs').writeFileSync(OUT + '/audit.json', JSON.stringify(summary, null, 1));
  await b.close(); console.log('done');
})();
