// Leonida Legend — GTA VI trophy guide & tracker.
// Fully offline: it loads only its own data files (data/trophies.json, data/roadmap.json)
// and keeps progress in localStorage. Nothing is fetched from the network.
const STORE_KEY = 'leonida-legend-progress-v1';

const KIND_LABELS = {
  story: 'Story',
  strangers: 'Strangers & Strands',
  activities: 'Activities',
  collectibles: 'Collectibles',
  robberies: 'Robberies',
  world: 'World & Feats',
  money: 'Money & Property',
  completion: 'Completion',
};
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

const trophiesDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = trophiesDoc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const stageNames = new Map(roadmapDoc.stages.map((s) => [s.n, s.name]));

// ---------- persistent state ----------
function blankState() {
  return { earned: [], counts: {}, peeked: [], shield: true };
}
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return blankState();
    return sanitizeState(raw) ?? blankState();
  } catch {
    return blankState();
  }
}
// Returns a cleaned state, or null if the shape is unusable (used by import too).
function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const validId = (v) => Number.isInteger(v) && byId.has(v);
  const earned = Array.isArray(raw.earned) ? [...new Set(raw.earned.filter(validId))] : [];
  const peeked = Array.isArray(raw.peeked) ? [...new Set(raw.peeked.filter(validId))] : [];
  const counts = {};
  if (raw.counts && typeof raw.counts === 'object' && !Array.isArray(raw.counts)) {
    for (const [k, v] of Object.entries(raw.counts)) {
      const id = Number(k);
      if (!validId(id) || typeof v !== 'number' || !Number.isFinite(v)) continue;
      const target = byId.get(id).target?.count ?? 0;
      counts[id] = Math.max(0, Math.min(Math.floor(v), Math.max(target, 0)));
    }
  }
  return { earned, counts, peeked, shield: raw.shield !== false };
}
let state = loadState();
const earnedSet = () => new Set(state.earned);
const peekedSet = () => new Set(state.peeked);
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

// ---------- filters (in-memory) ----------
const filters = { search: '', grade: 'all', kind: 'all', status: 'all', missableOnly: false };
const openGuides = new Set();

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');

function isMasked(t) {
  return t.hidden && state.shield && !earnedSet().has(t.id) && !peekedSet().has(t.id);
}
function fmt(n) {
  return n.toLocaleString('en-US');
}

// ---------- dashboard ----------
function renderDashboard() {
  const earned = earnedSet();
  const total = trophies.length;
  $('earned-count').textContent = String(earned.size);
  const pct = Math.round((earned.size / total) * 100);
  $('earned-pct').textContent = `${pct}%`;
  $('progress-fill').style.width = `${(earned.size / total) * 100}%`;
  $('progress-track').setAttribute('aria-valuenow', String(earned.size));

  const chips = $('grade-chips');
  chips.replaceChildren();
  for (const g of GRADE_ORDER) {
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const chip = document.createElement('span');
    chip.className = `gchip ${g}`;
    chip.innerHTML = '';
    chip.textContent = `${g[0].toUpperCase() + g.slice(1)}: `;
    const b = document.createElement('b');
    b.textContent = `${got}/${GRADE_TOTALS[g]}`;
    chip.append(b);
    chips.append(chip);
  }
  const hiddenLeft = trophies.filter((t) => t.hidden && !earned.has(t.id)).length;
  const missableLeft = trophies.filter((t) => t.missable && !earned.has(t.id)).length;
  $('dash-note').textContent =
    `${hiddenLeft} hidden trophies still out there · ${missableLeft} missable trophy not yet earned · ` +
    `progress is saved in this browser and can be exported below.`;
}

// ---------- roadmap ----------
function renderRoadmap() {
  const el = $('roadmap');
  el.replaceChildren();
  const h2 = document.createElement('h2');
  h2.textContent = roadmapDoc.title;
  el.append(h2);
  const intro = document.createElement('p');
  intro.textContent = roadmapDoc.intro;
  el.append(intro);
  const total = document.createElement('p');
  total.className = 'total-estimate';
  total.textContent = roadmapDoc.totalEstimate;
  el.append(total);

  const gh = document.createElement('h3');
  gh.textContent = 'Ground rules';
  el.append(gh);
  const ul = document.createElement('ul');
  ul.className = 'rules';
  for (const r of roadmapDoc.groundRules) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = r.rule;
    li.append(b);
    const why = document.createElement('span');
    why.className = 'why';
    why.textContent = r.why;
    li.append(why);
    ul.append(li);
  }
  el.append(ul);

  for (const m of roadmapDoc.missables) {
    const panel = document.createElement('div');
    panel.className = 'missable-panel';
    const h = document.createElement('h3');
    h.textContent = `Missable: ${m.name} — ${m.status}`;
    panel.append(h);
    const p = document.createElement('p');
    p.textContent = m.detail;
    panel.append(p);
    const s = document.createElement('p');
    s.className = 'src-line';
    s.textContent = m.sources;
    panel.append(s);
    el.append(panel);
  }

  for (const s of roadmapDoc.stages) {
    const box = document.createElement('div');
    box.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${s.n}`;
    const name = document.createElement('span');
    name.className = 'stage-name';
    name.textContent = s.name;
    const est = document.createElement('span');
    est.className = 'stage-est';
    est.textContent = s.estimate;
    head.append(num, name, est);
    box.append(head);
    const sum = document.createElement('p');
    sum.textContent = s.summary;
    box.append(sum);
    if (s.tips?.length) {
      const tips = document.createElement('ul');
      tips.className = 'tips';
      for (const tip of s.tips) {
        const li = document.createElement('li');
        li.textContent = tip;
        tips.append(li);
      }
      box.append(tips);
    }
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    const earned = earnedSet();
    for (const t of trophies.filter((x) => x.stage === s.n)) {
      const a = document.createElement('a');
      a.href = `#trophy-${t.id}`;
      a.textContent = t.name;
      if (earned.has(t.id)) a.className = 'done';
      a.addEventListener('click', () => openGuides.add(t.id));
      chips.append(a);
    }
    box.append(chips);
    el.append(box);
  }

  for (const u of roadmapDoc.unconfirmed) {
    const panel = document.createElement('div');
    panel.className = 'unconfirmed-panel';
    const h = document.createElement('h3');
    h.textContent = u.name;
    panel.append(h);
    const p = document.createElement('p');
    p.textContent = u.detail;
    panel.append(p);
    const s = document.createElement('p');
    s.className = 'src-line';
    s.textContent = u.sources;
    panel.append(s);
    el.append(panel);
  }
}

// ---------- trophy cards ----------
function matchesFilters(t) {
  if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
  if (filters.missableOnly && !t.missable) return false;
  const has = earnedSet().has(t.id);
  if (filters.status === 'earned' && !has) return false;
  if (filters.status === 'unearned' && has) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABELS[t.kind]}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function badge(text, cls) {
  const b = document.createElement('span');
  b.className = `badge ${cls}`;
  b.textContent = text;
  return b;
}

function renderCard(t) {
  const earned = earnedSet().has(t.id);
  const masked = isMasked(t);
  const card = document.createElement('article');
  card.className = `card ${t.grade}${earned ? ' earned' : ''}${masked ? ' masked' : ''}`;
  card.id = `trophy-${t.id}`;

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'card-check';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    const set = earnedSet();
    if (box.checked) set.add(t.id);
    else set.delete(t.id);
    state.earned = [...set];
    save();
    renderAll();
  });
  head.append(box);

  const main = document.createElement('div');
  main.className = 'card-main';
  const title = document.createElement('div');
  title.className = 'card-title';
  const name = document.createElement('span');
  name.className = 'card-name';
  name.textContent = masked ? 'Hidden Trophy' : t.name;
  title.append(name, badge(t.grade, `grade-${t.grade}`), badge(KIND_LABELS[t.kind], 'kind'));
  if (t.hidden) title.append(badge('Hidden', 'hidden-b'));
  if (t.missable) title.append(badge('Missable', 'missable-b'));
  main.append(title);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = masked ? 'This trophy is hidden on PlayStation until it is earned.' : `“${t.description}”`;
  main.append(desc);

  const tools = document.createElement('div');
  tools.className = 'card-tools';
  if (masked) {
    const peek = document.createElement('button');
    peek.type = 'button';
    peek.className = 'peek-btn';
    peek.textContent = 'Peek anyway';
    peek.addEventListener('click', () => {
      state.peeked = [...peekedSet(), t.id];
      save();
      renderAll();
    });
    tools.append(peek);
    const note = document.createElement('span');
    note.className = 'stage-tag';
    note.textContent = 'Spoiler shield is on: name, description and guide are hidden until earned or peeked.';
    tools.append(note);
  } else {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.dataset.id = String(t.id);
    toggle.textContent = openGuides.has(t.id) ? 'Hide guide' : 'Show guide';
    toggle.addEventListener('click', () => {
      if (openGuides.has(t.id)) openGuides.delete(t.id);
      else openGuides.add(t.id);
      renderList();
    });
    tools.append(toggle);
    if (t.target) tools.append(renderCounter(t));
    const stage = document.createElement('span');
    stage.className = 'stage-tag';
    stage.textContent = `Roadmap stage ${t.stage} — ${stageNames.get(t.stage) ?? ''}`;
    tools.append(stage);
  }
  main.append(tools);

  if (!masked && openGuides.has(t.id)) main.append(renderGuide(t));
  head.append(main);
  card.append(head);
  return card;
}

function renderCounter(t) {
  const wrap = document.createElement('span');
  wrap.className = 'counter';
  const cur = state.counts[t.id] ?? 0;
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease ${t.name} count`);
  minus.addEventListener('click', () => {
    state.counts[t.id] = Math.max(0, (state.counts[t.id] ?? 0) - 1);
    save();
    renderList();
  });
  const label = document.createElement('b');
  label.textContent = `${fmt(cur)} / ${fmt(t.target.count)} ${t.target.unit}`;
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase ${t.name} count`);
  plus.addEventListener('click', () => {
    state.counts[t.id] = Math.min(t.target.count, (state.counts[t.id] ?? 0) + 1);
    save();
    renderList();
  });
  wrap.append(minus, label, plus);
  return wrap;
}

function renderGuide(t) {
  const body = document.createElement('div');
  body.className = 'guide-body';
  const g = document.createElement('p');
  g.textContent = t.guide;
  body.append(g);
  if (t.steps?.length) {
    const ol = document.createElement('ol');
    for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    body.append(ol);
  }
  if (t.missable && t.missableNote) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    const b = document.createElement('b');
    b.textContent = 'Missable warning: ';
    note.append(b, document.createTextNode(t.missableNote));
    body.append(note);
  }
  const src = document.createElement('p');
  src.className = 'src-line';
  src.textContent = t.sources;
  body.append(src);
  return body;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren(...shown.map(renderCard));
  $('empty-state').hidden = shown.length > 0;
}

function renderFooter() {
  $('data-note').textContent = trophiesDoc.about;
  const ul = $('source-list');
  ul.replaceChildren();
  for (const s of trophiesDoc.sources) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.rel = 'noreferrer';
      li.append(a);
    } else {
      const b = document.createElement('b');
      b.textContent = s.name;
      li.append(b);
    }
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = s.note;
    li.append(note);
    ul.append(li);
  }
}

function renderAll() {
  renderDashboard();
  renderRoadmap();
  renderList();
}

// ---------- controls ----------
const kindSelect = $('f-kind');
for (const [key, label] of Object.entries(KIND_LABELS)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = label;
  kindSelect.append(opt);
}
kindSelect.addEventListener('change', () => { filters.kind = kindSelect.value; renderList(); });
$('f-search').addEventListener('input', (e) => { filters.search = e.target.value.trim(); renderList(); });
$('f-status').addEventListener('change', (e) => { filters.status = e.target.value; renderList(); });
$('f-missable').addEventListener('change', (e) => { filters.missableOnly = e.target.checked; renderList(); });
const shieldToggle = $('f-shield');
shieldToggle.checked = state.shield;
shieldToggle.addEventListener('change', () => { state.shield = shieldToggle.checked; save(); renderList(); });
$('f-grades').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-grade]');
  if (!btn) return;
  filters.grade = btn.dataset.grade;
  for (const b of $('f-grades').querySelectorAll('button')) b.classList.toggle('active', b === btn);
  renderList();
});

// ---------- export / import / reset ----------
function flash(msg) {
  $('dash-msg').textContent = msg;
}
$('export').addEventListener('click', () => {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, ...state }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  flash('Progress exported as leonida-legend-progress.json.');
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const clean = sanitizeState(parsed);
    if (!clean) throw new Error('bad shape');
    state = clean;
    save();
    shieldToggle.checked = state.shield;
    renderAll();
    flash(`Progress imported: ${state.earned.length} trophies earned.`);
  } catch {
    flash('That file is not a valid Leonida Legend progress export — nothing was changed.');
  }
});
$('reset').addEventListener('click', () => {
  state = blankState();
  state.shield = shieldToggle.checked;
  save();
  renderAll();
  flash('Progress reset. A clean run at Leonida awaits.');
});

// ---------- go ----------
renderFooter();
renderAll();
// Deep link: #trophy-<id> opens that guide and scrolls to it.
const hashMatch = location.hash.match(/^#trophy-(\d+)$/);
if (hashMatch && byId.has(Number(hashMatch[1]))) {
  openGuides.add(Number(hashMatch[1]));
  renderList();
  document.getElementById(`trophy-${hashMatch[1]}`)?.scrollIntoView();
}
