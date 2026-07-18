// Visual-debug helper: drives headless Chrome via raw CDP (Node 18+ global WebSocket,
// no deps) to screenshot the Telegram Mini-App with a mocked Telegram SDK + mocked
// backend. Lets us verify UI states that don't exist in static data yet (ranks,
// crowns/frames, live/finished cards, scored predictions, etc.).
//
// Usage (build first so `vite preview` has something to serve):
//   npm run build
//   node scripts/screenshot-miniapp.mjs home 1       # home header, leaderboard rank 1
//   node scripts/screenshot-miniapp.mjs home 2
//   node scripts/screenshot-miniapp.mjs leaderboard  # leaderboard tab, top-3 decorated
//
// Chrome path: auto-detected, or set CHROME_PATH env. Output: ./screenshots/*.png
//
// Why a network-layer mock (not just window injection): index.html loads
// telegram.org/js/telegram-web-app.js which *overwrites* window.Telegram after load,
// so we intercept that request via CDP Fetch and fulfill it with a fake SDK that also
// overrides window.fetch. The fake SDK MUST define BackButton/MainButton.offClick
// (App.jsx cleanup calls it) or the React tree throws and renders blank.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawn, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const OUT = join(REPO, 'screenshots')
const UDD = join(tmpdir(), 'wc-shoot-profile')
const PORT = 4173
const PREVIEW = `http://localhost:${PORT}/`
const CDP = 'http://localhost:9222'
const IS_WIN = process.platform === 'win32'
const NPM = IS_WIN ? 'npm.cmd' : 'npm'

const tab = (process.argv[2] || 'home').toLowerCase()       // home | leaderboard | play | kotut
const rank = parseInt(process.argv[3] || '1', 10)            // self rank for home view
// Нокаут-режим (этап 2): `play ko` — страница прогнозов с включённым плей-офф и
// замоканными нокаут-прогнозами/результатами; `kotut` — туториал-попап плей-офф.
const ko = process.argv.includes('ko') || tab === 'kotut'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
  ]
  for (const c of cands) if (existsSync(c)) return c
  throw new Error('Chrome not found — set CHROME_PATH env var')
}

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok || r.status === 200) return true } catch {}
    await sleep(500)
  }
  throw new Error('timeout waiting for ' + url)
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let id = 0; const pending = new Map(); const listeners = []
    const client = {
      send(method, params = {}) {
        return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })) })
      },
      on(fn) { listeners.push(fn) }, ws,
    }
    ws.addEventListener('open', () => resolve(client))
    ws.addEventListener('error', reject)
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result) }
      else if (m.method) for (const l of listeners) l(m)
    })
  })
}

// fake b/w-ish profile photo as data-URI so the avatar shows a real <img> without network
const PHOTO = 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f86f7"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="38" r="18" fill="#fff"/><ellipse cx="48" cy="84" rx="30" ry="22" fill="#fff"/></svg>`
).toString('base64')

function fakeSdk() {
  const pts = rank === 1 ? 42 : rank === 2 ? 38 : rank === 3 ? 35 : 4
  return `(function(){
  try{ localStorage.setItem('wc2026_predictionSeen','1'); }catch(e){}
  // Гасим разовые попапы, чтобы не перекрывали экран. Попап схемы очков
  // показываем только в состоянии 'scoring'.
  try{
    localStorage.setItem('wc2026_announce_m83_score_fix','1'); // ключ = ANNOUNCE_KEY в App.jsx (менять при новой коррекции)
    if(${JSON.stringify(tab === 'scoring')}) localStorage.removeItem('wc2026_scoring_scheme_v1');
    else localStorage.setItem('wc2026_scoring_scheme_v1','1');
  }catch(e){}
  var noop=function(){}, RANK=${rank}, PTS=${pts}, STATE=${JSON.stringify(tab)}, KO=${ko};
  // Сцены показа мест: снимаем окно «свежести» (иначе съёмка зависела бы от даты).
  try{ if(STATE==='bronze'||STATE==='champion') window.__REVEAL_FORCE__=true; }catch(e){}
  // Плей-офф: включаем тест-флаг фичи. Туториал показываем только в режиме kotut,
  // иначе помечаем как закрытый, чтобы попап не перекрывал страницу прогнозов.
  try{ if(KO) localStorage.setItem('wc2026_knockoutTest','1'); else localStorage.removeItem('wc2026_knockoutTest'); }catch(e){}
  // Профиль Chrome переиспользуется между прогонами — флаг dismissed надо явно
  // выставлять/снимать, иначе он «протекает» из прошлого запуска.
  try{ if(STATE==='kotut') localStorage.removeItem('wc2026_knockoutTutorialDismissed');
       else localStorage.setItem('wc2026_knockoutTutorialDismissed','1'); }catch(e){}
  // Состояние 'visit': засеваем старый снимок прошлого визита, чтобы появилась дельта
  if(STATE==='visit'){ try{
    localStorage.setItem('wc2026_lastVisit', JSON.stringify({rank:5, pts:30, settledIds:['m1']}));
    localStorage.removeItem('wc2026_celebrated');
  }catch(e){} }
  else { try{ localStorage.removeItem('wc2026_lastVisit'); }catch(e){} } // иначе stale-снимок из прошлого прогона вызывает попап «итоги визита»
  window.Telegram={ WebApp:{
    initData:'mock_init_data', platform:'web', version:'7.2', colorScheme:'light', themeParams:{},
    initDataUnsafe:{ user:{ id:777, first_name:'Алексей', last_name:'', username:'alex', language_code:'ru', photo_url:'${PHOTO}' } },
    isExpanded:true, viewportHeight:800, viewportStableHeight:800,
    ready:noop, expand:noop, close:noop, onEvent:noop, offEvent:noop, sendData:noop, openTelegramLink:noop,
    setHeaderColor:noop, setBackgroundColor:noop, enableClosingConfirmation:noop, disableClosingConfirmation:noop,
    HapticFeedback:{impactOccurred:noop,notificationOccurred:noop,selectionChanged:noop},
    BackButton:{show:noop,hide:noop,onClick:noop,offClick:noop},
    MainButton:{show:noop,hide:noop,onClick:noop,offClick:noop,setText:noop,setParams:noop,enable:noop,disable:noop},
    CloudStorage:{getItem:noop,setItem:noop}
  }};
  var LB=[
    {userId:'777', firstName:'Алексей', username:'alex', pts:42, rank:1},
    {userId:'201', firstName:'Мария', username:'maria_k', pts:39, rank:2},
    {userId:'202', firstName:'Дмитрий', username:'dima', pts:35, rank:3},
    {userId:'203', firstName:'Олег', username:'oleg7', pts:28, rank:4},
    {userId:'204', firstName:'Ирина', username:null, pts:22, rank:5},
    {userId:'205', firstName:'Сергей', username:'serge', pts:17, rank:6}
  ];
  var orig = window.fetch ? window.fetch.bind(window) : null;
  function J(o){ return Promise.resolve(new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}})); }
  function D(o,ms){ return new Promise(function(res){ setTimeout(function(){ res(new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}})); }, ms); }); }
  // /api/me и засчитанные прогнозы — зависят от состояния
  var ME = STATE==='visit'
    ? {userId:'777', pts:42, rank:2, rankDelta:3, predictions:12, exact:3, outcome:2}
    : {userId:'777', pts:PTS, rank:RANK, predictions:12};
  // Богатый набор засчитанных прогнозов для проверки карточек лидерборда
  // (раскрытие): группа (точный/исход/мимо) + плей-офф с каскадом и разбивкой.
  var RICH_SETTLED = [
    {matchId:'m01', pred:{home:2,away:1}, result:{home:2,away:1}, pts:3},
    {matchId:'m02', pred:{home:1,away:2}, result:{home:0,away:2}, pts:1},
    {matchId:'m03', pred:{home:0,away:0}, result:{home:1,away:0}, pts:0},
    {matchId:'m73', pred:{home:2,away:0}, result:{home:2,away:0,knockout:true,reg:{home:2,away:0},winner:'HOME_TEAM'}, pts:4},
    {matchId:'m75', pred:{home:1,away:1,et:{home:2,away:2},penWinner:'HOME'}, result:{home:2,away:2,knockout:true,reg:{home:1,away:1},et:{home:2,away:2},penHome:4,penAway:3,winner:'HOME_TEAM'}, pts:7}
  ];
  var SETTLED = STATE==='visit'
    ? [{matchId:'m1',pts:3},{matchId:'m2',pts:3},{matchId:'m3',pts:1},{matchId:'m4',pts:0}]
    : (STATE==='leaderboard' ? RICH_SETTLED : []);
  // Нокаут-моки: m75 — завершённый матч по пенальти (показывает разбивку и очки),
  // m73 — открытый матч с прогнозом на чистую победу 90′.
  var KO_PREDS = {m75:{home:1,away:1,et:{home:2,away:2},penWinner:'HOME'}, m73:{home:2,away:0}, m74:{home:1,away:1,et:{home:1,away:1},penWinner:'AWAY'}};
  var KO_RESULTS = {m75:{home:2,away:2,knockout:true,reg:{home:1,away:1},et:{home:2,away:2},penHome:4,penAway:3,winner:'HOME_TEAM'}};
  // Сцены показа мест: замоканный /api/live с завершёнными m103/m104.
  // m103 — Франция 0:4 Англия (Англия 3-е, Франция 4-е); m104 (champion) —
  // Испания 2:1 Аргентина (Испания чемпион, Аргентина 2-е).
  var LIVE = {matchResults:{}};
  if(STATE==='bronze'||STATE==='champion'){
    LIVE.matchResults.m103 = {status:'finished', scoreHome:0, scoreAway:4, winner:'AWAY_TEAM'};
    if(STATE==='champion') LIVE.matchResults.m104 = {status:'finished', scoreHome:2, scoreAway:1, winner:'HOME_TEAM'};
  }
  window.fetch=function(url,opts){ var u=String(url);
    if(u.indexOf('/api/leaderboard')!==-1) return J(LB);
    // 'splash': задерживаем /api/me, чтобы экран загрузки не исчезал до съёмки
    if(u.indexOf('/api/me')!==-1) return STATE==='splash' ? D(ME, 6000) : J(ME);
    if(u.indexOf('/api/results')!==-1) return J(KO ? KO_RESULTS : {});
    if(u.indexOf('/api/predictions/')!==-1) return J(SETTLED);
    if(u.indexOf('/api/my-predictions')!==-1) return J(KO ? KO_PREDS : {});
    if(u.indexOf('/api/scorers')!==-1) return J([]);
    if(u.indexOf('/api/goalkeepers')!==-1) return J([]);
    if(u.indexOf('/api/live')!==-1) return J(LIVE);
    if(u.indexOf('live-data.json')!==-1) return J({matchResults:{},scorers:[],goalkeepers:[],news:[],ticker:[]});
    if(orig) return orig(url,opts); return J({});
  };
})();`
}

let preview, chrome
function cleanup() {
  for (const p of [chrome, preview]) {
    try {
      if (!p?.pid) continue
      if (IS_WIN) execSync('taskkill /pid ' + p.pid + ' /T /F', { stdio: 'ignore' })
      else process.kill(-p.pid, 'SIGKILL')
    } catch {}
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  preview = spawn(NPM, ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], { cwd: REPO, shell: IS_WIN, detached: !IS_WIN })
  await waitFor(PREVIEW); console.log('preview ready')

  chrome = spawn(findChrome(), ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--remote-debugging-port=9222', '--user-data-dir=' + UDD, 'about:blank'], { detached: !IS_WIN })
  await waitFor(CDP + '/json/version'); await sleep(500); console.log('chrome ready')

  const targets = await (await fetch(CDP + '/json')).json()
  const page = targets.find((t) => t.type === 'page')
  const cli = await connect(page.webSocketDebuggerUrl)
  await cli.send('Page.enable'); await cli.send('Runtime.enable')
  await cli.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 2, mobile: true })
  await cli.send('Fetch.enable', { patterns: [{ urlPattern: '*telegram-web-app.js*', requestStage: 'Response' }] })
  cli.on(async (msg) => {
    if (msg.method !== 'Fetch.requestPaused') return
    try {
      await cli.send('Fetch.fulfillRequest', {
        requestId: msg.params.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }],
        body: Buffer.from(fakeSdk()).toString('base64'),
      })
    } catch {}
  })

  await cli.send('Page.navigate', { url: PREVIEW + '?t=' + Date.now() })
  await sleep(2500)

  let file = `${tab}-rank${rank}.png`
  // splash/visit/kotut/bronze/champion стартуют на home; имена файлов фиксированные
  if (tab === 'splash' || tab === 'visit' || tab === 'kotut' || tab === 'bronze' || tab === 'champion') {
    file = `${tab}.png`
  }
  // Сцена показа мест проявляет строки поэтапно (~0.45s + N×0.95s) — ждём финала.
  if (tab === 'bronze' || tab === 'champion') {
    await sleep(tab === 'champion' ? 5200 : 3200)
  }
  // Навигация по нижним вкладкам: home остаётся стартовым, для остальных
  // кликаем кнопку в nav по тексту (cm → ЧМ).
  const NAV_LABEL = { leaderboard: 'Лидерборд', cm: 'ЧМ', play: 'Играть', history: 'История', playoff: 'ЧМ' }
  if (NAV_LABEL[tab]) {
    file = `${tab}.png`
    const label = NAV_LABEL[tab]
    const r = await cli.send('Runtime.evaluate', {
      expression: `(function(){ var b=[].slice.call(document.querySelectorAll('nav button')).find(function(x){return new RegExp(${JSON.stringify(label)}).test(x.textContent);}); if(b){b.click(); return 'ok';} return 'nav-not-found'; })()`,
      returnByValue: true,
    })
    console.log('nav:', r.result?.value)
    await sleep(1800)
  }

  // Лидерборд: раскрываем первую карточку, чтобы показать прогнозы игрока.
  if (tab === 'leaderboard') {
    const r = await cli.send('Runtime.evaluate', {
      expression: `(function(){ var b=document.querySelector('.select-none.cursor-pointer'); if(b){b.click(); return 'ok';} return 'card-not-found'; })()`,
      returnByValue: true,
    })
    console.log('expand:', r.result?.value)
    await sleep(900)
  }

  // ЧМ → подвкладка «Плей-офф»: раздел стадий на вылет.
  if (tab === 'playoff') {
    const r = await cli.send('Runtime.evaluate', {
      expression: `(function(){ var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return /Плей-офф/.test(x.textContent);}); if(b){b.click(); return 'ok';} return 'subtab-not-found'; })()`,
      returnByValue: true,
    })
    console.log('playoff-subtab:', r.result?.value)
    await sleep(1200)
  }

  // Нокаут-режим на странице прогнозов: жмём фильтр «Плей-офф», чтобы показать
  // только матчи плей-офф (каскад + разбивка).
  if (ko && tab === 'play') {
    const r = await cli.send('Runtime.evaluate', {
      expression: `(function(){ var b=[].slice.call(document.querySelectorAll('button')).find(function(x){return /^1\\/16$/.test(x.textContent.trim());}); if(b){b.click(); return 'ok';} return 'ko-filter-not-found'; })()`,
      returnByValue: true,
    })
    console.log('ko-filter:', r.result?.value)
    await sleep(1200)
  }

  const { data } = await cli.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(OUT, file), Buffer.from(data, 'base64'))
  console.log('saved', join('screenshots', file))
  cli.ws.close()
}

main().then(() => { cleanup(); process.exit(0) }).catch((e) => { console.error('ERR', e); cleanup(); process.exit(1) })
