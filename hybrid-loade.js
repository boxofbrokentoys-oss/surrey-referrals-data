/* Surrey Referral Pathways — hybrid-loader.js */
const DATA_URL = "https://raw.githubusercontent.com/boxofbrokentoys-oss/surrey-referrals-data/refs/heads/main/master_normalised.json";

let DATA = null;
let INDEX = [];
let CURRENT = {};
let REGION = '';
let AGE_MODE = 'all';
let AGE_VALUE = null;

// ── Icons per category ──────────────────────────────────────────────────────
const CAT_ICONS = {
  'Allergy & Immunology':'🧪','Cardiology':'🫀','Children & Young People':'👶',
  'Dermatology':'🧴','Elderly Medicine':'🧓','Endocrine & Diabetes':'🧬',
  'ENT & Audiology':'👂','Gender & Sexual Health':'💟','Genetics':'🧬',
  'GI & Liver':'🧫','Gynaecology':'⚕️','Haematology':'🩸',
  'Mental Health':'🧠','MSK & Orthopaedics':'🦴','Nephrology':'💧',
  'Neurology':'🧠','Ophthalmology':'👁️','Oral & Maxillofacial':'🦷',
  'Respiratory & Sleep':'🫁','Surgery':'🏥','Urology':'💧',
  'Vascular & Lymph':'🩹','Diagnostics':'🔬','General Medicine':'🩺',
  'Community & Direct':'🏠'
};

// Accent colour per category (for card top-border)
const CAT_COLORS = {
  'Cardiology':'#e63950','Neurology':'#7c3aed','Mental Health':'#7c3aed',
  'Children & Young People':'#f59e0b','Dermatology':'#ec4899',
  'Respiratory & Sleep':'#06b6d4','MSK & Orthopaedics':'#f97316',
  'GI & Liver':'#10b981','Gynaecology':'#ec4899','Ophthalmology':'#3b82f6',
  'ENT & Audiology':'#8b5cf6','Haematology':'#ef4444',
  'Surgery':'#6366f1','Endocrine & Diabetes':'#14b8a6',
  'Urology':'#0ea5e9','Vascular & Lymph':'#f43f5e','Diagnostics':'#64748b',
};

// ── Specialty → Category mapping ────────────────────────────────────────────
const EXACT_MAP = {
  'Allergy / Immunology':'Allergy & Immunology','Allergy':'Allergy & Immunology','Immunology':'Allergy & Immunology',
  'Cardiology':'Cardiology','Arrhythmia':'Cardiology','Cardiac Risk Management & Rehab':'Cardiology','Cardiac devices':'Cardiology','Holter':'Cardiology','Cardiology - RACPC':'Cardiology','Cardiac Surgery':'Surgery',
  'Paediatrics':'Children & Young People',"Children's & Adolescent Services":'Children & Young People','Paediatric Audiology':'Children & Young People','Paediatric Surgery':'Children & Young People',
  'Dermatology':'Dermatology','Acne':'Dermatology','Skin lesions and Nail disorders':'Dermatology','Pregnancy Dermatoses':'Dermatology',
  'Endocrinology and Metabolic Medicine':'Endocrine & Diabetes','Endocrinology':'Endocrine & Diabetes','Diabetic Medicine':'Endocrine & Diabetes','Diabetic - Young Adult':'Endocrine & Diabetes','Insulin':'Endocrine & Diabetes','Thyroid & Parathyroid':'Endocrine & Diabetes','Weight Management':'Endocrine & Diabetes',
  'ENT':'ENT & Audiology','Emergency ENT':'ENT & Audiology','Ear de-wax clinic':'ENT & Audiology','Audiology':'ENT & Audiology',
  'Paediatric Gender Identity Clinic':'Gender & Sexual Health','Psychosexual Health':'Gender & Sexual Health',
  'Genetics':'Genetics',
  'Gastroenterology / GI & Liver':'GI & Liver','Colorectal':'GI & Liver','Inflammatory Bowel Disease':'GI & Liver','Endoscopy':'GI & Liver','Diagnostic Endoscopy':'GI & Liver','Hepatology / Hepatobiliary':'GI & Liver','GI and Liver (Medicine and Surgery)':'GI & Liver',
  'Gynaecology':'Gynaecology','Hysteroscopy':'Gynaecology','Urogynaecology':'Gynaecology','Colposcopy':'Gynaecology','Fertility':'Gynaecology',
  'Haematology':'Haematology','Anticoagulant':'Vascular & Lymph','DVT/VTE':'Vascular & Lymph',
  'Mental Health':'Mental Health',
  'MSK':'MSK & Orthopaedics','Orthopaedics':'MSK & Orthopaedics','Physiotherapy':'MSK & Orthopaedics','Podiatry':'MSK & Orthopaedics','EMG/Nerve Conduction':'MSK & Orthopaedics','Pain Management':'MSK & Orthopaedics','Orthotics and Prosthetics':'MSK & Orthopaedics','EMG':'MSK & Orthopaedics',
  'Nephrology':'Nephrology',
  'Neurology':'Neurology','Epilepsy':'Neurology','Multiple Sclerosis (MS)':'Neurology','Stroke':'Neurology',
  'Ophthalmology':'Ophthalmology','Low Vision':'Ophthalmology','Eye Casualty (urgent)':'Ophthalmology',
  'Oral and Maxillofacial Surgery':'Oral & Maxillofacial','Orthodontics':'Oral & Maxillofacial','Dentistry & Orthodontics':'Oral & Maxillofacial','Dentistry and Orthodontics':'Oral & Maxillofacial',
  'Respiratory':'Respiratory & Sleep','Breathlessness':'Respiratory & Sleep','Sleep Medicine':'Respiratory & Sleep','Home Oxygen & Long Term Oxygen Therapy':'Respiratory & Sleep',
  'Surgery - General':'Surgery','Surgery - Not Otherwise Specified':'Surgery','Hernias, lipomas, sebaceous cyst, cyst':'Surgery','Breast':'Surgery','Endocrine Surgery':'Surgery','Plastics':'Surgery','Upper GI Surgery':'Surgery',
  'Urology':'Urology',
  'Vascular':'Vascular & Lymph','Lymphoedema':'Vascular & Lymph','Vascular Surgery':'Vascular & Lymph',
  'Diagnostics (Physiological Measurement)':'Diagnostics','Diagnostic Imaging':'Diagnostics','Spirometry and FeNO':'Diagnostics','Echocardiogram':'Diagnostics',
  'General Medicine':'General Medicine','Rapid Response (including Falls Clinic)':'Elderly Medicine','Rapid Response (including Falls Team)':'Elderly Medicine',
  'BCG':'Community & Direct','Dietetics':'Community & Direct',
};

const FALLBACKS = [
  [/cardio|racpc/i,'Cardiology'],[/respir|breath|oxygen|cpap|sleep/i,'Respiratory & Sleep'],
  [/dermat|skin|psoriasis|eczema|acne/i,'Dermatology'],[/ent|audiolog|tinnit|ear|nose|throat|microsuction/i,'ENT & Audiology'],
  [/gyn|colpos|urogyn|menopause|fertilit/i,'Gynaecology'],[/paed|child|adolescent/i,'Children & Young People'],
  [/neuro|epilep|stroke|spastic/i,'Neurology'],[/ophthal|eye|cataract|oculo|amd/i,'Ophthalmology'],
  [/nephro|renal/i,'Nephrology'],[/urolog/i,'Urology'],[/haemat|thrombo|anticoag|vte|dvt/i,'Haematology'],
  [/vascular|varicose|aneurysm|lymph/i,'Vascular & Lymph'],[/ortho|msk|podiat|physio|carpal|emg/i,'MSK & Orthopaedics'],
  [/endocr|diabet|thyroid|parathy|lipid/i,'Endocrine & Diabetes'],[/gastro|hepato|colorec|ibd|endosc|upper gi|lower gi/i,'GI & Liver'],
  [/genetic/i,'Genetics'],[/mental|psycho|neuropsych/i,'Mental Health'],[/surg|hernia|lumps|bumps|breast/i,'Surgery'],
  [/diagnos|imaging|spirom|echo/i,'Diagnostics'],[/general medicine|polypharm|internal/i,'General Medicine'],
  [/elderly|falls|geriat/i,'Elderly Medicine'],[/community|email|specsavers/i,'Community & Direct'],
];

const CATEGORIES = [
  'Allergy & Immunology','Cardiology','Children & Young People','Dermatology','Elderly Medicine','Endocrine & Diabetes',
  'ENT & Audiology','Gender & Sexual Health','Genetics','GI & Liver','Gynaecology','Haematology','Mental Health',
  'MSK & Orthopaedics','Nephrology','Neurology','Ophthalmology','Oral & Maxillofacial','Respiratory & Sleep',
  'Surgery','Urology','Vascular & Lymph','Diagnostics','General Medicine','Community & Direct'
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const by = q => document.querySelector(q);

function mapSpecialtyToCategory(spec) {
  if (EXACT_MAP[spec]) return EXACT_MAP[spec];
  for (const [rx, cat] of FALLBACKS) if (rx.test(spec)) return cat;
  return 'General Medicine';
}

function buildCategoryToSpecialties() {
  const map = {}; CATEGORIES.forEach(c => map[c] = []);
  for (const spec of Object.keys(DATA)) {
    const cat = mapSpecialtyToCategory(spec);
    if (!map[cat]) map[cat] = [];
    if (!map[cat].includes(spec)) map[cat].push(spec);
  }
  return map;
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  if (DATA) return DATA;
  const res = await fetch(DATA_URL);
  if (!res.ok) { alert('Could not load data from GitHub.'); throw new Error('Fetch failed'); }
  DATA = await res.json();
  buildIndex(DATA);
  return DATA;
}

function buildIndex(data) {
  INDEX.length = 0;
  for (const [spec, conds] of Object.entries(data))
    for (const [cond, svcs] of Object.entries(conds))
      for (const s of svcs) INDEX.push({ ...s, _spec: spec, _cond: cond });
}

// ── View router ──────────────────────────────────────────────────────────────
// Within #panel-ur there are 3 child views: home-view, category-view, results-view
function showView(id) {
  ['home-view','category-view','results-view'].forEach(v => {
    const el = by('#' + v);
    if (el) { el.classList.toggle('active', v === id); el.style.display = (v === id) ? 'block' : 'none'; }
  });
}

// ── Home / Category grid ─────────────────────────────────────────────────────
function renderCategoryTiles() {
  const grid = by('#category-grid'); grid.innerHTML = '';
  const catMap = buildCategoryToSpecialties();
  CATEGORIES.forEach(cat => {
    const subs = (catMap[cat] || []).sort();
    if (!subs.length) return;
    const card = document.createElement('div');
    card.className = 'category-card';
    const color = CAT_COLORS[cat] || 'var(--blue)';
    card.style.setProperty('--cat-color', color);
    // Correct pluralisation: sub-specialties / sub-specialty
    const subLabel = subs.length === 1
      ? '1 sub-specialty'
      : `${subs.length} sub-specialties`;
    card.innerHTML = `<span class='cat-emoji'>${CAT_ICONS[cat] || '🔹'}</span><div class='cat-body'><div class='cat-title'>${cat}</div><div class='cat-sub'>${subLabel}</div></div>`;
    card.onclick = () => openCategory(cat, subs);
    grid.appendChild(card);
  });
}

function openCategory(cat, subs) {
  CURRENT = { category: cat, subs };
  // If only 1 subspecialty, skip straight to results
  if (subs.length === 1) {
    openSubspecialty(subs[0]);
    return;
  }
  by('#cat-view-title').innerHTML = `<span class='title-emoji'>${CAT_ICONS[cat] || ''}</span>${cat}`;
  const grid = by('#subspec-grid'); grid.innerHTML = '';
  subs.forEach(spec => {
    const card = document.createElement('div');
    card.className = 'subspec-card';
    card.innerHTML = `<span>${spec}</span><span class='subspec-arrow'>›</span>`;
    card.onclick = () => openSubspecialty(spec);
    grid.appendChild(card);
  });
  showView('category-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Results view ─────────────────────────────────────────────────────────────
function openSubspecialty(spec) {
  CURRENT.subspecialty = spec;
  const conds = Object.keys(DATA[spec] || {}).sort();
  CURRENT.conds = conds;

  // Render condition pills
  const condList = by('#condition-list'); condList.innerHTML = '';
  conds.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (i === 0 ? ' active' : '');
    btn.textContent = c;
    btn.onclick = () => {
      condList.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      drawServices(spec, c);
    };
    condList.appendChild(btn);
  });

  by('#results-title').textContent = spec;
  drawServices(spec, conds[0] || null);
  showView('results-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters(list) {
  if (REGION) list = list.filter(s => (s.region || '') === REGION);
  if (AGE_MODE === 'adult') list = list.filter(s => (s.ageMin ?? 0) >= 16);
  if (AGE_MODE === 'paeds') list = list.filter(s => (s.ageMax ?? 999) < 18);
  if (AGE_VALUE != null) list = list.filter(s => {
    if (s.ageMin != null && s.ageMin > AGE_VALUE) return false;
    if (s.ageMax != null && AGE_VALUE > s.ageMax) return false;
    return true;
  });
  return list;
}

function drawServices(spec, cond) {
  let list = cond
    ? (DATA[spec][cond] || [])
    : Object.values(DATA[spec] || {}).flat();

  list = applyFilters(list);

  by('#results-count').textContent = `${list.length} service${list.length !== 1 ? 's' : ''}`;

  const body = by('#results-body'); body.innerHTML = '';

  if (!list.length) {
    body.innerHTML = `<div class='empty-state'><div class='big'>🔍</div><p>No services match the current filters.</p></div>`;
    return;
  }

  const byProv = {};
  list.forEach(s => { const k = s.provider || 'Other'; (byProv[k] = byProv[k] || []).push(s); });

  Object.keys(byProv).sort().forEach(p => {
    const section = document.createElement('div');
    section.className = 'provider-section';
    section.innerHTML = `
      <div class='provider-header'>
        <span class='provider-icon'>🏥</span>
        <span class='provider-name'>${p}</span>
        <span class='provider-count'>${byProv[p].length} service${byProv[p].length !== 1 ? 's' : ''}</span>
      </div>`;
    byProv[p].forEach(s => section.appendChild(buildServiceCard(s)));
    body.appendChild(section);
  });
}

function buildServiceCard(s) {
  const div = document.createElement('div');
  div.className = 'service-card';

  const badges = [];
  if (s.rasType) badges.push(`<span class='badge badge-blue'>${s.rasType}</span>`);
  if (s.method && /email/i.test(s.method)) badges.push(`<span class='badge badge-blue'>Email</span>`);
  if (s.usc) badges.push(`<span class='badge badge-red'>USC / 2WW</span>`);
  if (s.bookable) badges.push(`<span class='badge badge-green'>Bookable</span>`);

  const ageStr = (s.ageMin != null ? `≥${s.ageMin}` : '') + (s.ageMax != null ? `–${s.ageMax}` : (s.ageMin != null ? '+' : 'All ages'));
  const ageSex = [ageStr, s.sex].filter(Boolean).join(' • ');

  const details = [];
  if (s.sites && s.sites.length) details.push(`<div class='svc-detail-row'><span class='svc-detail-label'>Sites</span><span>${s.sites.join(', ')}</span></div>`);
  if (s.email) details.push(`<div class='svc-detail-row'><span class='svc-detail-label'>Email</span><span>${s.email}</span></div>`);
  if (s.phone) details.push(`<div class='svc-detail-row'><span class='svc-detail-label'>Phone</span><span>${s.phone}</span></div>`);

  div.innerHTML = `
    <div class='svc-main'>
      <div class='svc-title'>${s.serviceName || '—'}</div>
      <div class='svc-sub'>${[s.provider, s.region].filter(Boolean).join(' • ')}</div>
      ${badges.length ? `<div class='badge-row'>${badges.join('')}</div>` : ''}
      <div class='svc-details'>${details.join('')}</div>
      ${s.notes ? `<div class='svc-notes'>📋 ${s.notes}</div>` : ''}
    </div>
    <div class='svc-meta-col'>
      <span class='age-badge'>${ageSex || 'All'}</span>
    </div>`;
  return div;
}

// ── Filters ──────────────────────────────────────────────────────────────────
function wireFilters() {
  document.querySelectorAll('#ur-region .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ur-region .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      REGION = btn.dataset.area || '';
      redrawIfResults();
    });
  });
  document.querySelectorAll('.age-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.age-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AGE_MODE = btn.dataset.age;
      if (AGE_MODE !== 'all') AGE_VALUE = null;
      redrawIfResults();
    });
  });
  const slider = by('#age-slider'), val = by('#age-slider-value');
  if (slider) {
    slider.addEventListener('input', () => {
      AGE_VALUE = parseInt(slider.value, 10);
      val.textContent = slider.value + '+';
      AGE_MODE = 'all';
      document.querySelectorAll('.age-chip').forEach(b => b.classList.remove('active'));
      document.querySelector('.age-chip[data-age="all"]').classList.add('active');
      redrawIfResults();
    });
  }
}

function redrawIfResults() {
  const spec = CURRENT.subspecialty;
  if (!spec) return;
  const activeCond = by('#condition-list .chip.active')?.textContent || null;
  drawServices(spec, activeCond);
}

// ── Search ───────────────────────────────────────────────────────────────────
function wireSearch() {
  const input = by('#global-search');
  const out = by('#search-results');
  if (!input || !out) return;

  input.addEventListener('input', () => {
    const q = (input.value || '').trim().toLowerCase();
    out.innerHTML = '';
    if (!q) return;
    const hits = INDEX.filter(s =>
      (s.serviceName || '').toLowerCase().includes(q) ||
      (s._spec || '').toLowerCase().includes(q) ||
      (s._cond || '').toLowerCase().includes(q) ||
      (s.provider || '').toLowerCase().includes(q) ||
      (s.sites || []).join(',').toLowerCase().includes(q)
    );
    hits.slice(0, 150).forEach(s => {
      const li = document.createElement('div');
      li.className = 'search-hit';
      li.innerHTML = `<div class='search-hit-title'>${s.serviceName}</div><div class='search-hit-path'>${mapSpecialtyToCategory(s._spec)} › ${s._spec} › ${s._cond}</div>`;
      li.onclick = () => {
        out.innerHTML = '';
        input.value = '';
        const cat = mapSpecialtyToCategory(s._spec);
        const subs = buildCategoryToSpecialties()[cat] || [];
        openCategory(cat, subs);
        openSubspecialty(s._spec);
        drawServices(s._spec, s._cond);
        // Highlight the right condition pill
        by('#condition-list')?.querySelectorAll('.chip').forEach(c => {
          c.classList.toggle('active', c.textContent === s._cond);
        });
      };
      out.appendChild(li);
    });
  });
}

// ── USC ──────────────────────────────────────────────────────────────────────
function inferCancerType(s) {
  const t = `${s._spec} ${s._cond} ${s.serviceName}`.toLowerCase();
  if (/breast/.test(t)) return 'Breast';
  if (/colorectal|bowel|lower gi/.test(t)) return 'Colorectal';
  if (/upper gi|og|oesoph|gastric/.test(t)) return 'Upper GI';
  if (/lung|respir/.test(t)) return 'Lung';
  if (/urol|prostat|bladder|kidney/.test(t)) return 'Urology';
  if (/gyn|ovarian|cervical|endometr/.test(t)) return 'Gynaecology';
  if (/dermat|skin/.test(t)) return 'Skin';
  if (/head|neck|ent/.test(t)) return 'Head & Neck';
  if (/haemat|lymph/.test(t)) return 'Haematology';
  return 'Other USC';
}

function renderUSC() {
  const grid = by('#usc-grid'); grid.innerHTML = '';
  const uscServices = INDEX.filter(s => !!s.usc);
  if (!uscServices.length) {
    grid.innerHTML = `<div class='empty-state'><div class='big'>🎗️</div><p>No USC / 2WW services flagged in data.</p></div>`;
    return;
  }
  const cancerCats = {};
  uscServices.forEach(s => {
    const key = inferCancerType(s);
    (cancerCats[key] = cancerCats[key] || []).push(s);
  });
  Object.keys(cancerCats).sort().forEach(k => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.setProperty('--cat-color', '#e63950');
    const n = cancerCats[k].length;
    card.innerHTML = `<span class='cat-emoji'>🎗️</span><div class='cat-body'><div class='cat-title'>${k}</div><div class='cat-sub'>${n} service${n !== 1 ? 's' : ''}</div></div>`;
    card.onclick = () => drawUSCResults(k, cancerCats[k]);
    grid.appendChild(card);
  });
}

function drawUSCResults(title, list) {
  const area = document.querySelector('#usc-region .chip.active')?.dataset.area || '';
  let rows = area ? list.filter(s => (s.region || '') === area) : list;
  const mount = by('#usc-results');
  mount.innerHTML = `<div class='view-header' style='margin-bottom:16px'><div class='view-title'>${title}</div><div class='count-pill'>${rows.length} service${rows.length !== 1 ? 's' : ''}</div></div>`;
  const wrap = document.createElement('div');
  const byProv = {};
  rows.forEach(s => { const k = s.provider || 'Other'; (byProv[k] = byProv[k] || []).push(s); });
  Object.keys(byProv).sort().forEach(p => {
    const section = document.createElement('div');
    section.className = 'provider-section';
    section.innerHTML = `<div class='provider-header'><span class='provider-icon'>🏥</span><span class='provider-name'>${p}</span><span class='provider-count'>${byProv[p].length}</span></div>`;
    byProv[p].forEach(s => section.appendChild(buildServiceCard(s)));
    wrap.appendChild(section);
  });
  mount.appendChild(wrap);
}

function wireUSC() {
  document.querySelectorAll('#usc-region .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#usc-region .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderUSC();
    });
  });
  const s = by('#usc-search'), out = by('#usc-search-results');
  if (s && out) {
    s.addEventListener('input', () => {
      const q = (s.value || '').toLowerCase().trim();
      out.innerHTML = '';
      if (!q) return;
      const hits = INDEX.filter(x => x.usc && (
        (x.serviceName || '').toLowerCase().includes(q) ||
        (x._spec || '').toLowerCase().includes(q) ||
        (x._cond || '').toLowerCase().includes(q) ||
        (x.provider || '').toLowerCase().includes(q)
      ));
      hits.slice(0, 150).forEach(h => {
        const li = document.createElement('div');
        li.className = 'search-hit';
        li.innerHTML = `<div class='search-hit-title'>${h.serviceName}</div><div class='search-hit-path'>${h._spec} › ${h._cond}</div>`;
        li.onclick = () => {
          out.innerHTML = '';
          s.value = '';
          drawUSCResults(inferCancerType(h), hits.filter(z => inferCancerType(z) === inferCancerType(h)));
        };
        out.appendChild(li);
      });
    });
  }
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
function wireTabs() {
  const tabs = [
    { btn: by('#tab-ur'),  panel: by('#panel-ur') },
    { btn: by('#tab-usc'), panel: by('#panel-usc') },
  ];
  tabs.forEach(({ btn, panel }, i) => {
    btn.addEventListener('click', () => {
      tabs.forEach(({ btn: b, panel: p }, j) => {
        const active = j === i;
        b.setAttribute('aria-selected', active);
        p.classList.toggle('active', active);
        p.style.display = active ? 'block' : 'none';
      });
    });
  });
  // init display
  by('#panel-ur').style.display = 'block';
  by('#panel-usc').style.display = 'none';
}

// ── Back buttons ──────────────────────────────────────────────────────────────
function wireBackButtons() {
  by('#back-to-home')?.addEventListener('click', () => {
    CURRENT = {};
    showView('home-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  by('#back-to-cat')?.addEventListener('click', () => {
    const { category, subs } = CURRENT;
    if (subs && subs.length === 1) {
      // went directly from home → results; back goes home
      CURRENT = {};
      showView('home-view');
    } else {
      openCategory(category, subs || []);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  wireTabs();
  wireBackButtons();

  // show home-view initially
  showView('home-view');

  await loadData();
  renderCategoryTiles();
  wireFilters();
  wireSearch();
  wireUSC();
  renderUSC();
});
