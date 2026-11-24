/** Informe de accesibilidad: nombres de controles, encabezados, regiones y orden de tabulación. Ver tests/README.md. */
const { chromium } = require('playwright');
const fs0 = require('fs'), os0 = require('os'), path0 = require('path');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const OUT = process.env.OUT || path0.join(os0.tmpdir(), 'clz-e2e'); fs0.mkdirSync(OUT, { recursive: true });

const check = () => {
  const out = { sinNombre: [], encabezados: [], regiones: {}, tabs: [], foco: [] };
  const name = (e) => {
    const al = e.getAttribute('aria-label'); if (al) return al;
    const lb = e.getAttribute('aria-labelledby'); if (lb) return lb.split(' ').map(i => document.getElementById(i)?.textContent || '').join(' ').trim();
    if (e.id) { const l = document.querySelector(`label[for="${e.id}"]`); if (l && l.textContent.trim()) return l.textContent.trim(); }
    const wl = e.closest('label'); if (wl && wl.textContent.trim()) return wl.textContent.trim();
    if (e.title) return e.title;
    const t = (e.textContent || '').trim(); if (t) return t;
    return '';
  };
  const vis = (e) => { const r = e.getBoundingClientRect(); return (r.width > 0 && r.height > 0) || e.closest('details:not([open])'); };
  document.querySelectorAll('input:not([type=hidden]),select,textarea,button,summary,a[href],[role=tab],[role=radio]').forEach(e => {
    if (e.closest('[aria-hidden="true"],.hidden') && !e.closest('#modalBackdrop')) return;
    if (!name(e)) out.sinNombre.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
  });
  const hs = [...document.querySelectorAll('h1,h2,h3,h4')].filter(e => !e.closest('.hidden')).map(h => +h.tagName[1]);
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) out.encabezados.push(`h${hs[i - 1]}→h${hs[i]}`);
  out.regiones = { lang: document.documentElement.lang, title: document.title, header: !!document.querySelector('header'), main: !!document.querySelector('main'), nav: !!document.querySelector('nav[aria-label],nav'), footer: !!document.querySelector('footer'), h1: document.querySelectorAll('h1').length };
  out.tabs = [...document.querySelectorAll('[role=tab]')].map(t => `${t.dataset.tab || t.textContent.trim().slice(0, 12)}:${t.getAttribute('aria-selected')}`).slice(0, 8);
  return out;
};
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('dialog', d => d.accept());
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('[data-tab="ajustes"]').click());
  await p.evaluate(() => { document.getElementById('btnLoadDemoManual').closest('details').open = true; document.getElementById('btnLoadDemoManual').click(); });
  await p.waitForTimeout(500);
  // con el modal abierto
  const modal = await p.evaluate(() => { const bd = document.getElementById('modalBackdrop'); return { abierto: getComputedStyle(bd).display !== 'none', role: bd.getAttribute('role'), modal: bd.getAttribute('aria-modal'), titulo: document.getElementById(bd.getAttribute('aria-labelledby'))?.textContent }; });
  console.log('modal:', JSON.stringify(modal));
  await p.evaluate(() => document.getElementById('btnModalClose').click());
  for (const [tab, view] of [['registro', 'form'], ['registro', 'list'], ['graficas'], ['ajustes'], ['recursos']]) {
    await p.evaluate(([t, v]) => { document.querySelector(`[data-tab="${t}"]`).click(); if (v) window.setRegView(v); document.querySelectorAll('#tab-' + t + ' details').forEach(d => d.open = true); }, [tab, view]);
    await p.waitForTimeout(250);
    const r = await p.evaluate(check);
    console.log((tab + (view ? ':' + view : '')).padEnd(16), 'sin nombre:', JSON.stringify([...new Set(r.sinNombre)]), '| saltos de encabezado:', JSON.stringify(r.encabezados));
    if (tab === 'registro' && view === 'form') console.log('  regiones:', JSON.stringify(r.regiones), '| pestañas:', r.tabs.join(' '));
  }
  // orden de tabulación y foco visible (primeros 12 elementos)
  await p.evaluate(() => document.querySelector('[data-tab="registro"]').click()); await p.evaluate(() => window.setRegView('form'));
  const orden = [];
  for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); orden.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.id || e.tagName.toLowerCase() + (e.textContent || '').trim().slice(0, 14)) + (cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' ? '' : ' [SIN FOCO VISIBLE]'); })); }
  console.log('orden de tabulación:', orden.join(' → '));
  await b.close();
})();
