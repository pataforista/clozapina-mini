/**
 * Prueba de humo de punta a punta de CLZ Mini PWA.
 * Cada comprobación imprime OK o FALLA; el proceso termina con código 1 si alguna falla.
 *
 * Uso (desde la raíz del repositorio):
 *   bash tests/run.sh
 * o, con un servidor ya levantado en otro puerto:
 *   BASE_URL=http://127.0.0.1:8123 NODE_PATH=$(npm root -g) node tests/e2e/smoke.js
 *
 * Requiere Playwright (require('playwright')). Salidas auxiliares en $OUT (por defecto, carpeta temporal).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123';
const OUT = process.env.OUT || path.join(os.tmpdir(), 'clz-e2e');
fs.mkdirSync(OUT, { recursive: true });

let total = 0, fails = 0;
const check = (name, cond, extra = '') => { total++; if (!cond) fails++; console.log((cond ? 'OK    ' : 'FALLA ') + name + (extra ? ' | ' + extra : '')); };

const open = async (browser, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, acceptDownloads: true, ...opts });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  page.errs = []; page.hosts = new Set();
  page.on('pageerror', e => page.errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) page.errs.push(m.text().slice(0, 120)); });
  page.on('request', r => { const h = new URL(r.url()).hostname; if (h !== '127.0.0.1' && h !== 'localhost') page.hosts.add(h); });
  await page.goto(BASE + '/index.html'); await page.waitForTimeout(700);
  const t = {
    closeModal: () => page.evaluate(() => { const m = document.getElementById('btnModalClose'); m && m.click(); }),
    tab: (n) => page.evaluate(n => document.querySelector(`[data-tab="${n}"]`).click(), n),
    openAcc: (id) => page.evaluate(id => { document.getElementById(id).closest('details').open = true; }, id),
    setup: async (label = 'Prueba', start = '2026-06-01') => { await page.fill('#s_label', label); await page.fill('#s_start', start); await page.click('#btnSaveSettings'); await page.waitForTimeout(300); },
    add: async (date, fields = {}, checks = [], sel = {}) => {
      await page.evaluate(() => window.setRegView('form')); await page.click('#btnClear');
      await page.fill('#f_date', date);
      await page.evaluate(() => { document.getElementById('myoDetails').open = true; });
      for (const [k, v] of Object.entries(fields)) await page.fill('#' + k, String(v));
      for (const [k, v] of Object.entries(sel)) await page.selectOption('#' + k, v);
      for (const c of checks) await page.check('#' + c);
      await page.click('#btnSave'); await page.waitForTimeout(300); await t.closeModal();
    },
    alerts: () => page.$eval('#alerts', e => e.textContent),
    titles: () => page.$$eval('.alert-card .alert-title', els => els.map(e => e.textContent)),
  };
  return { ctx, page, t };
};

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Primera apertura, alertas clínicas, unidades y calculadora ----------
  {
    const { ctx, page: p, t } = await open(browser);
    check('primera apertura lleva a Ajustes con bienvenida', (await p.$eval('#appHeaderTitle', e => e.textContent)).startsWith('Ajustes') && await p.isVisible('#firstRunHint'));
    await t.setup();
    check('al guardar el paciente pasa a Registro', (await p.$eval('#appHeaderTitle', e => e.textContent)) === 'Registro');

    // ANC crítico: modal que no se cierra tocando el fondo y botón alcanzable
    await p.fill('#f_date', '2026-11-10'); await p.fill('#f_anc', '0.4'); await p.click('#btnSave'); await p.waitForTimeout(400);
    const crit = await p.evaluate(() => ({ role: document.getElementById('modalBackdrop').getAttribute('role'), critical: document.querySelector('.modal').classList.contains('critical') }));
    check('ANC 0.4 abre una alerta crítica (alertdialog)', crit.critical && crit.role === 'alertdialog');
    await p.mouse.click(5, 5); await p.waitForTimeout(150);
    check('tocar el fondo no cierra la alerta crítica', await p.evaluate(() => getComputedStyle(document.getElementById('modalBackdrop')).display !== 'none'));
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    check('el foco queda atrapado dentro del modal', await p.evaluate(() => !!document.activeElement.closest('#modalBackdrop')));
    await t.closeModal(); await p.waitForTimeout(150);
    check('el modal se cierra con el botón', await p.evaluate(() => getComputedStyle(document.getElementById('modalBackdrop')).display === 'none'));
    check('alerta de ANC crítico en el historial', (await t.titles()).some(x => /^ANC crítico/.test(x)));

    // Taquicardia sola: sin aviso de PCR/troponina; palpitaciones: con aviso
    await p.evaluate(() => window.setRegView('form')); await p.click('#btnClear'); await p.check('#f_tachy');
    check('taquicardia sola no activa el aviso de miocarditis', await p.$eval('#myoHint', e => e.classList.contains('hidden')));
    await p.fill('#f_date', '2026-11-11'); await p.fill('#f_anc', '2.5'); await p.click('#btnSave'); await p.waitForTimeout(300); await t.closeModal();
    let txt = await t.alerts();
    check('taquicardia sola genera "Taquicardia a vigilar"', /Taquicardia a vigilar/.test(txt) && !/Datos sugestivos/.test(txt));
    await p.evaluate(() => window.setRegView('form')); await p.click('#btnClear'); await p.check('#f_palp');
    check('palpitaciones activan el aviso de miocarditis', !(await p.$eval('#myoHint', e => e.classList.contains('hidden'))));
    await t.add('2026-11-12', { f_anc: 2.5 }, ['f_palp']);
    txt = await t.alerts();
    check('palpitaciones: alerta con ficha FDA y PCR/troponina', /Datos sugestivos de miocarditis/.test(txt) && /ficha FDA/.test(txt) && /PCR y troponina/.test(txt));

    // Fiebre + signos: una sola alerta y una sola mención de PCR/troponina
    await t.add('2026-11-13', { f_anc: 2.5, f_week: 3 }, ['f_chest'], { f_fever: '1' });
    check('fiebre con signos cardiovasculares es una sola alerta', (await t.titles()).filter(x => /Fiebre|miocarditis/i.test(x)).length === 1);
    check('PCR/troponina se sugiere una vez', ((await t.alerts()).match(/PCR y troponina/g) || []).length === 1);

    // Eosinófilos, plaquetas, leucocitos
    await t.add('2026-11-14', { f_anc: 2.5, f_eos: 1.0 });
    check('eosinófilos 1.0 -> a vigilar', /Eosinofilia a vigilar/.test(await t.alerts()));
    await t.add('2026-11-15', { f_anc: 2.5, f_eos: 3.5, f_plt: 40, f_wbc: 2.4 });
    txt = await t.alerts();
    check('eosinófilos 3.5 -> marcada con fuente canadiense', /Eosinofilia marcada/.test(txt) && /monografía canadiense/i.test(txt));
    check('plaquetas 40 -> bajas con fuente', /Plaquetas bajas/.test(txt) && /Gen-Clozapine/.test(txt));
    check('leucocitos bajos solo informativos', /Leucocitos bajos \(informativo\)/.test(txt) && !/Leucopenia leve/.test(txt));
    const order = await p.$$eval('.alert-card', els => els.map(e => e.classList.contains('bad') ? 0 : e.classList.contains('warn') ? 1 : e.classList.contains('info') ? 2 : 3));
    check('las alertas se ordenan de crítica a informativa', order.every((v, i) => i === 0 || v >= order[i - 1]), JSON.stringify(order));

    // Unidades y calculadora de ANC
    await p.evaluate(() => window.setRegView('form')); await p.click('#btnClear');
    await p.fill('#f_anc', '2500');
    check('ANC en células/µL muestra aviso de conversión', !(await p.$eval('#uh_f_anc', e => e.classList.contains('hidden'))));
    await p.click('#uh_f_anc .link-btn');
    check('convertir deja 2.5', (await p.inputValue('#f_anc')) === '2.5');
    await p.fill('#f_anc', ''); await p.fill('#f_wbc', '6.5'); await p.evaluate(() => { document.getElementById('ancCalc').open = true; });
    await p.fill('#f_neut_pct', '58'); await p.click('#btnUseAnc');
    check('calculadora de ANC: 6.5 x 58 % = 3.77', (await p.inputValue('#f_anc')) === '3.77');

    // Divulgación progresiva: hábitos plegados con contador; lista limitada a 5
    await p.click('#btnClear');
    check('hábitos e interacciones vienen plegados', await p.$eval('#habitsDetails', e => !e.open));
    await p.evaluate(() => { document.getElementById('habitsDetails').open = true; }); await p.check('#f_habit_smoke');
    check('contador de hábitos', /1 marcado/.test(await p.$eval('#habitsCount', e => e.textContent)));
    await p.evaluate(() => window.setRegView('list'));
    const shown = await p.$$eval('#entryList .item', e => e.length);
    check('el historial muestra como máximo 5 entradas y ofrece ver todas', shown === 5 && (await p.isVisible('.list-more')), 'visibles: ' + shown);

    // ---------- Ciclo de datos: exportar, importar, importación maliciosa, borrar ----------
    await t.tab('ajustes'); await t.openAcc('btnExportJson');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnExportJson')]); await dl.saveAs(path.join(OUT, 'export.json'));
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#btnExportCsv')]); await dl2.saveAs(path.join(OUT, 'export.csv'));
    check('el CSV incluye PCR y troponina', /crp_mgl,trop,trop_unit/.test(fs.readFileSync(path.join(OUT, 'export.csv'), 'utf8').split('\n')[0]));
    const nBefore = await p.evaluate(() => JSON.parse(localStorage.getItem('clz_mini_pwa_v1')).entries.length);
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);
    await t.tab('ajustes'); await t.openAcc('importFile');
    await p.setInputFiles('#importFile', path.join(OUT, 'export.json')); await p.waitForTimeout(600); await t.closeModal();
    const nAfter = await p.evaluate(() => JSON.parse(localStorage.getItem('clz_mini_pwa_v1')).entries.length);
    check('importar restaura todas las entradas', nAfter === nBefore && nAfter > 0, `${nBefore} -> ${nAfter}`);
    const evil = JSON.parse(fs.readFileSync(path.join(OUT, 'export.json'), 'utf8'));
    evil.entries[0].date = '<img src=x onerror="window.__xss=1">'; evil.entries[0].week = '<b>9</b>';
    fs.writeFileSync(path.join(OUT, 'evil.json'), JSON.stringify(evil));
    await p.setInputFiles('#importFile', path.join(OUT, 'evil.json')); await p.waitForTimeout(600); await t.closeModal();
    await t.tab('registro'); await p.evaluate(() => window.setRegView('list')); await p.waitForTimeout(300);
    check('HTML en la fecha importada no se ejecuta', await p.evaluate(() => !window.__xss && !document.querySelector('#entryList img')));
    await p.click('#entryList .item >> nth=0'); await p.waitForTimeout(200); await p.click('#btnDelete'); await p.waitForTimeout(300);
    check('borrar una entrada reduce el total', (await p.evaluate(() => JSON.parse(localStorage.getItem('clz_mini_pwa_v1')).entries.length)) === nAfter - 1);

    // Tema persistente, teclado y sin conexión
    await p.evaluate(() => { const s = document.getElementById('themeSelect'); s.value = 'light'; s.dispatchEvent(new Event('change')); });
    await p.reload(); await p.waitForTimeout(600);
    await t.closeModal(); // al recargar reaparece la alerta crítica de la última entrada (diseño intencional)
    check('el tema claro persiste', (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');
    await p.focus('.nav-item.active'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
    check('flecha derecha cambia de pestaña', (await p.$eval('#appHeaderTitle', e => e.textContent)) !== 'Registro');
    await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(1200);
    const controlled = await p.evaluate(() => !!navigator.serviceWorker.controller);
    await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(900);
    check('carga sin conexión con el service worker', controlled && (await p.$$eval('.nav-item', e => e.length)) === 4);
    await ctx.setOffline(false);
    check('solo hay peticiones a Google Fonts fuera del origen', [...p.hosts].every(h => /fonts\.(googleapis|gstatic)\.com/.test(h)), [...p.hosts].join(', ') || 'ninguna');
    check('sin errores de página ni de consola', p.errs.length === 0, p.errs.slice(0, 2).join(' / '));
    await ctx.close();
  }

  // ---------- 2. Esquemas de monitoreo de ANC ----------
  {
    const { ctx, page: p, t } = await open(browser);
    await t.setup('Prueba', '2024-01-01');
    await t.add('2026-11-01', { f_anc: 3.0 });
    const next = async (sch) => { await t.tab('ajustes'); await t.openAcc('s_schedule'); await p.selectOption('#s_schedule', sch); await p.click('#btnSaveSettings'); await p.waitForTimeout(300); await t.closeModal(); await t.tab('registro'); await p.evaluate(() => window.setRegView('list')); return p.$eval('#k_next', e => e.textContent.trim()); };
    check('esquema FDA por defecto: +28 días', (await next('fda')) === '29 nov 2026');
    check('esquema EMA: anual tras 2 años sin neutropenia', (await next('ema')) === '01 nov 2027');
    check('esquema Delphi: sin ANC de rutina tras 2 años', (await next('delphi')) === 'Sin ANC de rutina');
    check('esquema sin errores', p.errs.length === 0, p.errs.join(' / '));
    await ctx.close();
  }

  // ---------- 3. Modal en pantallas pequeñas (320 px y móvil horizontal) ----------
  for (const [name, w, h] of [['320x568', 320, 568], ['740x360 horizontal', 740, 360]]) {
    const { ctx, page: p, t } = await open(browser, { viewport: { width: w, height: h } });
    await t.tab('ajustes'); await t.openAcc('btnLoadDemoManual'); await p.click('#btnLoadDemoManual'); await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const bd = document.getElementById('modalBackdrop'); if (getComputedStyle(bd).display === 'none') return { open: false };
      const b = document.getElementById('btnModalClose').getBoundingClientRect(); const nav = document.getElementById('floatingNav').getBoundingClientRect();
      const top = document.elementFromPoint(nav.left + nav.width / 2, nav.top + nav.height / 2);
      return { open: true, btnVisible: b.bottom <= innerHeight && b.top >= 0, navCovered: bd.contains(top), labelled: !!bd.getAttribute('aria-labelledby') };
    });
    check(`modal ${name}: botón visible, cubre el menú y está etiquetado`, m.open && m.btnVisible && m.navCovered && m.labelled, JSON.stringify(m));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${total - fails}/${total} comprobaciones correctas`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('Error en la prueba:', e.message); process.exit(2); });
