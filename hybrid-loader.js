/* Hybrid Loader — Grouped Tiles + Icons + USC — GitHub JSON */
const DATA_URL = "https://raw.githubusercontent.com/boxofbrokentoys-oss/surrey-referrals-data/refs/heads/main/master_normalised.json"; // GitHub RAW JSON

let DATA=null; // master json
let INDEX=[];  // flat index of all services
let CURRENT={}; // current selection state

// --- Icons per category tile (emoji style) ---
const CAT_ICONS = {
  'Allergy & Immunology':'🧪',
  'Cardiology':'🫀',
  'Children & Young People':'👶',
  'Dermatology':'🧴',
  'Elderly Medicine':'🧓',
  'Endocrine & Diabetes':'🧬',
  'ENT & Audiology':'👂',
  'Gender & Sexual Health':'💟',
  'Genetics':'🧬',
  'GI & Liver':'🧫',
  'Gynaecology':'⚕️',
  'Haematology':'🩸',
  'Mental Health':'🧠✨',
  'MSK & Orthopaedics':'🦴',
  'Nephrology':'💧',
  'Neurology':'🧠',
  'Ophthalmology':'👁️',
  'Oral & Maxillofacial':'🦷',
  'Respiratory & Sleep':'🫁',
  'Surgery':'🏥',
  'Urology':'💧',
  'Vascular & Lymph':'🩹',
  'Diagnostics':'🔬',
  'General Medicine':'🩺',
  'Community & Direct':'🏠'
};

// --- Exact specialty → category mapping (clinical) ---
// NOTE: Podiatry under MSK; Haematology has its own tile.
const EXACT_MAP = {
  // Allergy/Immunology
  'Allergy / Immunology':'Allergy & Immunology', 'Allergy':'Allergy & Immunology', 'Immunology':'Allergy & Immunology',
  // Cardiology family
  'Cardiology':'Cardiology','Arrhythmia':'Cardiology','Cardiac Risk Management & Rehab':'Cardiology','Cardiac devices':'Cardiology','Holter':'Cardiology','Echocardiogram':'Diagnostics','Cardiac Surgery':'Surgery','Cardiology - RACPC':'Cardiology',
  // Children & Young People
  "Paediatrics":"Children & Young People","Children's & Adolescent Services":"Children & Young People",'Paediatric Audiology':'Children & Young People','Paediatric Surgery':'Children & Young People',
  // Dermatology
  'Dermatology':'Dermatology','Acne':'Dermatology','Skin lesions and Nail disorders':'Dermatology','Pregnancy Dermatoses':'Dermatology',
  // Endocrine & Diabetes
  'Endocrinology and Metabolic Medicine':'Endocrine & Diabetes','Endocrinology':'Endocrine & Diabetes','Diabetic Medicine':'Endocrine & Diabetes','Diabetic - Young Adult':'Endocrine & Diabetes','Insulin':'Endocrine & Diabetes','Thyroid & Parathyroid':'Endocrine & Diabetes',
  // ENT & Audiology
  'ENT':'ENT & Audiology','Dentistry and Orthodontics':'Oral & Maxillofacial','Emergency ENT':'ENT & Audiology','Eye Casualty (urgent)':'Ophthalmology','Ear de-wax clinic':'ENT & Audiology','Audiology':'ENT & Audiology',
  // Gender & Sexual Health
  'Paediatric Gender Identity Clinic':'Gender & Sexual Health','Psychosexual Health':'Gender & Sexual Health',
  // Genetics (if present)
  'Genetics':'Genetics',
  // GI & Liver
  'Gastroenterology / GI & Liver':'GI & Liver','Colorectal':'GI & Liver','Inflammatory Bowel Disease':'GI & Liver','Endoscopy':'GI & Liver','Diagnostic Endoscopy':'GI & Liver','Hepatology / Hepatobiliary':'GI & Liver','Upper GI Surgery':'Surgery','GI and Liver (Medicine and Surgery)':'GI & Liver',
  // Gynaecology
  'Gynaecology':'Gynaecology','Hysteroscopy':'Gynaecology','Urogynaecology':'Gynaecology','Colposcopy':'Gynaecology','Fertility':'Gynaecology',
  // Haematology
  'Haematology':'Haematology','Anticoagulant':'Vascular & Lymph','DVT/VTE':'Vascular & Lymph',
  // Mental Health
  'Mental Health':'Mental Health',
  // MSK & Orthopaedics
  'MSK':'MSK & Orthopaedics','Orthopaedics':'MSK & Orthopaedics','Physiotherapy':'MSK & Orthopaedics','Podiatry':'MSK & Orthopaedics','EMG/Nerve Conduction':'MSK & Orthopaedics','Pain Management':'MSK & Orthopaedics','Orthotics and Prosthetics':'MSK & Orthopaedics',
  // Nephrology
  'Nephrology':'Nephrology',
  // Neurology
  'Neurology':'Neurology','Epilepsy':'Neurology','Multiple Sclerosis (MS)':'Neurology','Stroke':'Neurology','EMG':'MSK & Orthopaedics',
  // Ophthalmology
  'Ophthalmology':'Ophthalmology','Low Vision':'Ophthalmology',
  // Oral & Maxillofacial
  'Oral and Maxillofacial Surgery':'Oral & Maxillofacial','Orthodontics':'Oral & Maxillofacial','Dentistry & Orthodontics':'Oral & Maxillofacial',
  // Respiratory & Sleep
  'Respiratory':'Respiratory & Sleep','Breathlessness':'Respiratory & Sleep','Sleep Medicine':'Respiratory & Sleep','Home Oxygen & Long Term Oxygen Therapy':'Respiratory & Sleep',
  // Surgery
  'Surgery - General':'Surgery','Surgery - Not Otherwise Specified':'Surgery','Hernias, lipomas, sebaceous cyst, cyst':'Surgery','Breast':'Surgery','Endocrine Surgery':'Surgery','Plastics':'Surgery',
  // Urology
  'Urology':'Urology',
  // Vascular & Lymph
  'Vascular':'Vascular & Lymph','Lymphoedema':'Vascular & Lymph','Vascular Surgery':'Vascular & Lymph',
  // Diagnostics
  'Diagnostics (Physiological Measurement)':'Diagnostics','Diagnostic Imaging':'Diagnostics','Spirometry and FeNO':'Diagnostics','Echocardiogram':'Diagnostics',
  // General Medicine
  'General Medicine':'General Medicine','Rapid Response (including Falls Clinic)':'Elderly Medicine','Rapid Response (including Falls Team)':'Elderly Medicine','Weight Management':'Endocrine & Diabetes',
  // Community & Direct
  'BCG':'Community & Direct','Dietetics':'Community & Direct','Eye Casualty (urgent)':'Ophthalmology'
};

// Keyword fallbacks: if a specialty name isn't exact-mapped, use these patterns
const FALLBACKS = [
  [/cardio|racpc|chest/i, 'Cardiology'],
  [/respir|breath|oxygen|cpap|sleep/i, 'Respiratory & Sleep'],
  [/dermat|skin|psoriasis|eczema|acne/i, 'Dermatology'],
  [/ent|audiolog|tinnit|ear|nose|throat|microsuction/i, 'ENT & Audiology'],
  [/gyn|colpos|urogyn|menopause|fertilit/i, 'Gynaecology'],
  [/paed|child|adolescent|mindworks/i, 'Children & Young People'],
  [/neuro|epilep|stroke|spastic/i, 'Neurology'],
  [/ophthal|eye|cataract|oculo|amd|cues/i, 'Ophthalmology'],
  [/nephro|renal/i, 'Nephrology'],
  [/urolog/i, 'Urology'],
  [/haemat|thrombo|anticoag|vte|dvt/i, 'Haematology'],
  [/vascular|varicose|aneurysm|lymph/i, 'Vascular & Lymph'],
  [/ortho|msk|podiat|physio|carpal|emg/i, 'MSK & Orthopaedics'],
  [/endocr|diabet|thyroid|parathy|lipid/i, 'Endocrine & Diabetes'],
  [/gastro|hepato|colorec|ibd|endosc|upper gi|lower gi|hpb/i, 'GI & Liver'],
  [/genetic/i, 'Genetics'],
  [/mental|psycho|neuropsych/i, 'Mental Health'],
  [/surg|hernia|lumps|bumps|breast/i, 'Surgery'],
  [/diagnos|imaging|spirom|echo/i, 'Diagnostics'],
  [/general medicine|polypharm|internal/i, 'General Medicine'],
  [/bcg|community|email|specsavers|fchc|greystone|mindworks/i, 'Community & Direct']
];

// Categories in the order to display
const CATEGORIES = [
  'Allergy & Immunology','Cardiology','Children & Young People','Dermatology','Elderly Medicine','Endocrine & Diabetes',
  'ENT & Audiology','Gender & Sexual Health','Genetics','GI & Liver','Gynaecology','Haematology','Mental Health',
  'MSK & Orthopaedics','Nephrology','Neurology','Ophthalmology','Oral & Maxillofacial','Respiratory & Sleep',
  'Surgery','Urology','Vascular & Lymph','Diagnostics','General Medicine','Community & Direct'
];

const by = (q)=>document.querySelector(q);
const el = (t, cls)=>{const e=document.createElement(t); if(cls) e.className=cls; return e;};

async function loadData(){
  if(DATA) return DATA;
  const res = await fetch(DATA_URL);
  if(!res.ok){ alert('Could not load data from GitHub.'); throw new Error('Fetch failed'); }
  DATA = await res.json();
  buildIndex(DATA);
  return DATA;
}

function buildIndex(data){
  INDEX.length=0;
  for(const [spec, conds] of Object.entries(data)){
    for(const [cond, svcs] of Object.entries(conds)){
      for(const s of svcs){ INDEX.push({...s, _spec:spec, _cond:cond}); }
    }
  }
}

function mapSpecialtyToCategory(spec){
  if(EXACT_MAP[spec]) return EXACT_MAP[spec];
  for(const [rx,cat] of FALLBACKS){ if(rx.test(spec)) return cat; }
  return 'General Medicine';
}

function buildCategoryToSpecialties(){
  const map={}; CATEGORIES.forEach(c=>map[c]=[]);
  for(const spec of Object.keys(DATA)){
    const cat = mapSpecialtyToCategory(spec);
    if(!map[cat]) map[cat]=[];
    if(!map[cat].includes(spec)) map[cat].push(spec);
  }
  // Ensure Podiatry under MSK even if separate
  if(!map['MSK & Orthopaedics'].includes('Podiatry')){
    if(Object.keys(DATA).some(k=>/podiat/i.test(k))) map['MSK & Orthopaedics'].push('Podiatry');
  }
  return map;
}

function renderCategoryTiles(){
  const grid=by('#category-grid'); grid.innerHTML='';
  const catMap = buildCategoryToSpecialties();
  CATEGORIES.forEach(cat=>{
    // hide category if no subspecialties present
    const subs=(catMap[cat]||[]).sort();
    if(!subs.length) return;
    const card=el('div','category-card');
    card.innerHTML = `<div class='cat-emoji'>${CAT_ICONS[cat]||'🔹'}</div><div><div class='cat-title'>${cat}</div><div class='cat-sub'>${subs.length} sub‑specialty${subs.length>1?'ies':'y'}</div></div>`;
    card.onclick=()=>showCategory(cat, subs);
    grid.appendChild(card);
  });
}

function showCategory(cat, subs){
  CURRENT={category:cat};
  by('#subspec-list').style.display='flex';
  by('#condition-list').style.display='none';
  by('#results-panel').style.display='none';
  const list=by('#subspec-list'); list.innerHTML='';
  subs.forEach(s=>{
    const b=el('button','chip'); b.textContent=s; b.onclick=()=>showSubspecialty(s); list.appendChild(b);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

function showSubspecialty(spec){
  CURRENT.subspecialty=spec;
  const conds = Object.keys(DATA[spec]||{}).sort();
  const list=by('#condition-list'); list.style.display='flex'; list.innerHTML='';
  conds.forEach((c,i)=>{
    const b=el('button','chip'+(i===0?' active':'')); b.textContent=c; b.dataset.cond=c; b.onclick=()=>{ list.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); drawServices(spec,c); };
    list.appendChild(b);
  });
  if(conds.length) drawServices(spec, conds[0]); else drawServices(spec, null);
}

let REGION='', AGE_MODE='all', AGE_VALUE=null;

function drawServices(spec,cond){
  by('#results-panel').style.display='block';
  by('#results-sys-name').textContent = `${spec}${cond? ' → '+cond:''}`;
  const wrap = by('#results-body'); wrap.innerHTML='';
  let list = [];
  if(cond){ list = DATA[spec][cond]||[]; }
  else { // if no conditions, aggregate all
    for(const arr of Object.values(DATA[spec]||{})) list=list.concat(arr);
  }
  // Apply filters
  if(REGION) list = list.filter(s=>(s.region||'')===REGION);
  if(AGE_MODE==='adult') list = list.filter(s=> (s.ageMin??0)>=16);
  if(AGE_MODE==='paeds') list = list.filter(s=> (s.ageMax??999)<18);
  if(AGE_VALUE!=null) list = list.filter(s=>{ if(s.ageMin!=null && s.ageMin>AGE_VALUE) return false; if(s.ageMax!=null && AGE_VALUE>s.ageMax) return false; return true; });

  by('#results-count-pill').textContent = (list.length||0)+' services';

  // group by provider
  const byProv={};
  list.forEach(s=>{ (byProv[s.provider||'Other']=byProv[s.provider||'Other']||[]).push(s); });
  Object.keys(byProv).sort().forEach(p=>{
    const box=el('div','provider-box');
    const h=el('div','provider-title'); h.textContent=p; box.appendChild(h);
    byProv[p].forEach(s=> box.appendChild(serviceCard(s)) );
    wrap.appendChild(box);
  });
}

function badgeRow(s){
  const row=[]; if(s.rasType) row.push(`<span class='chip' style='pointer-events:none'>${s.rasType}</span>`);
  if(s.method && /email/i.test(s.method)) row.push(`<span class='chip' style='pointer-events:none'>Email</span>`);
  if(s.usc) row.push(`<span class='chip' style='pointer-events:none;background:#ffe4e6;border-color:#ffb3be;color:#cc0033'>USC/2WW</span>`);
  return row.join(' ');
}

function serviceCard(s){
  const d=el('div','service-card');
  d.innerHTML = `
    <div class='svc-title'>${s.serviceName||''}</div>
    <div class='svc-sub'>${s.provider||''}${s.region? ' • '+s.region:''}</div>
    <div class='svc-badges'>${badgeRow(s)}</div>
    ${s.sites && s.sites.length? `<div class='svc-sites'><strong>Sites:</strong> ${s.sites.join(', ')}</div>`:''}
    <div class='svc-meta'><strong>Age/Sex:</strong> ${(s.ageMin!=null?('≥'+s.ageMin):'All')+(s.ageMax!=null?(' and ≤'+s.ageMax):'')} • ${s.sex||'any'}</div>
    <div class='svc-contact'><strong>Email:</strong> ${s.email||'—'} • <strong>Phone:</strong> ${s.phone||'—'}</div>
    ${s.notes? `<div class='svc-notes'>${s.notes}</div>`:''}
  `;
  return d;
}

// --- Region + age filters ---
function wireFilters(){
  document.querySelectorAll('#ur-region .chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#ur-region .chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); REGION = btn.dataset.area||'';
      // redraw current
      const spec = CURRENT.subspecialty; const active = document.querySelector('#condition-list .chip.active')?.dataset.cond||null;
      if(spec) drawServices(spec, active);
    });
  });
  document.querySelectorAll('.age-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); AGE_MODE=btn.dataset.age; if(AGE_MODE!=='all') AGE_VALUE=null;
      const spec = CURRENT.subspecialty; const active = document.querySelector('#condition-list .chip.active')?.dataset.cond||null;
      if(spec) drawServices(spec, active);
    });
  });
  const slider = by('#age-slider'), val=by('#age-slider-value');
  if(slider){ slider.addEventListener('input',()=>{ AGE_VALUE=parseInt(slider.value,10); val.textContent=slider.value+'+'; AGE_MODE='all'; document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active')); document.querySelector('.age-chip[data-age="all"]').classList.add('active'); const spec = CURRENT.subspecialty; const active = document.querySelector('#condition-list .chip.active')?.dataset.cond||null; if(spec) drawServices(spec, active); }); }
}

// --- Global search (UR) ---
function wireSearch(){
  const g=by('#global-search'); const out=by('#search-results'); if(!g||!out) return;
  g.addEventListener('input',()=>{
    const q=(g.value||'').trim().toLowerCase(); out.innerHTML=''; if(!q) return;
    const hits = INDEX.filter(s=> (s.serviceName||'').toLowerCase().includes(q) || (s._spec||'').toLowerCase().includes(q) || (s._cond||'').toLowerCase().includes(q) || (s.provider||'').toLowerCase().includes(q) || (s.sites||[]).join(',').toLowerCase().includes(q) );
    hits.slice(0,200).forEach(s=>{ const li=el('div','search-hit'); li.textContent = `${mapSpecialtyToCategory(s._spec)} → ${s._spec} → ${s._cond} — ${s.serviceName}`; li.onclick=()=>{ out.innerHTML=''; showCategory(mapSpecialtyToCategory(s._spec), buildCategoryToSpecialties()[mapSpecialtyToCategory(s._spec)]); showSubspecialty(s._spec); drawServices(s._spec, s._cond); window.scrollTo({top:0,behavior:'smooth'}); }; out.appendChild(li); });
  });
}

// --- USC integration ---
function renderUSC(){
  // Build USC index
  const uscServices = INDEX.filter(s=> !!s.usc);
  const grid=by('#usc-grid'); grid.innerHTML='';
  if(uscServices.length===0){ grid.innerHTML = '<div style="color:var(--ink-3)">No USC/2WW services flagged in data.</div>'; return; }
  // Group by inferred cancer type (from condition or serviceName keywords)
  const cancerCats={};
  uscServices.forEach(s=>{
    const key = inferCancerType(s);
    (cancerCats[key]=cancerCats[key]||[]).push(s);
  });
  Object.keys(cancerCats).sort().forEach(k=>{
    const card=el('div','category-card'); card.innerHTML = `<div class='cat-emoji'>🎗️</div><div><div class='cat-title'>${k}</div><div class='cat-sub'>${cancerCats[k].length} service(s)</div></div>`; card.onclick=()=>drawUSCResults(k, cancerCats[k]); grid.appendChild(card);
  });
}

function inferCancerType(s){
  const t = `${s._spec} ${s._cond} ${s.serviceName}`.toLowerCase();
  if(/breast/.test(t)) return 'Breast';
  if(/colorectal|bowel|lower gi/.test(t)) return 'Colorectal';
  if(/upper gi|og|oesoph|gastric/.test(t)) return 'Upper GI';
  if(/lung|respir/.test(t)) return 'Lung';
  if(/urol|prostat|bladder|kidney/.test(t)) return 'Urology';
  if(/gyn|ovarian|cervical|endometr/.test(t)) return 'Gynaecology';
  if(/dermat|skin/.test(t)) return 'Skin';
  if(/head|neck|ent/.test(t)) return 'Head & Neck';
  if(/haemat|lymph/.test(t)) return 'Haematology';
  return 'Other USC';
}

function drawUSCResults(title, list){
  const mount = by('#usc-results');
  // region filter on USC
  const area = document.querySelector('#usc-region .chip.active')?.dataset.area||'';
  let rows = list;
  if(area) rows = rows.filter(s=> (s.region||'')===area);
  mount.innerHTML = `<div class='results-header'><div id='usc-title' style='font-weight:800'>${title}</div><div id='usc-count' class='chip'>${rows.length} services</div></div>`;
  const wrap = el('div','');
  const byProv={}; rows.forEach(s=>{ (byProv[s.provider||'Other']=byProv[s.provider||'Other']||[]).push(s); });
  Object.keys(byProv).sort().forEach(p=>{
    const box=el('div','provider-box'); const h=el('div','provider-title'); h.textContent=p; box.appendChild(h);
    byProv[p].forEach(s=> box.appendChild(serviceCard(s)) );
    wrap.appendChild(box);
  });
  mount.appendChild(wrap);
}

function wireUSC(){
  document.querySelectorAll('#usc-region .chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#usc-region .chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const activeCard = by('#usc-title');
      if(activeCard){ // redraw current list under new area filter
        renderUSC();
      }
    });
  });
  const s=by('#usc-search'); const out=by('#usc-search-results'); if(s&&out){
    s.addEventListener('input',()=>{
      const q=(s.value||'').toLowerCase().trim(); out.innerHTML=''; if(!q) return;
      const hits = INDEX.filter(x=>x.usc && ((x.serviceName||'').toLowerCase().includes(q) || (x._spec||'').toLowerCase().includes(q) || (x._cond||'').toLowerCase().includes(q) || (x.provider||'').toLowerCase().includes(q)));
      hits.slice(0,200).forEach(h=>{ const li=el('div','search-hit'); li.textContent=`${h._spec} → ${h._cond} — ${h.serviceName}`; li.onclick=()=>{ out.innerHTML=''; drawUSCResults(inferCancerType(h), hits.filter(z=>inferCancerType(z)===inferCancerType(h))); }; out.appendChild(li); });
    });
  }
}

// --- Tabs ---
function wireTabs(){
  const ur=by('#tab-ur'), usc=by('#tab-usc');
  const pur=by('#panel-ur'), pusc=by('#panel-usc');
  function sel(which){ const isUR=which==='ur'; ur.setAttribute('aria-selected', isUR); usc.setAttribute('aria-selected', !isUR); pur.classList.toggle('active', isUR); pusc.classList.toggle('active', !isUR); }
  ur.addEventListener('click',()=>sel('ur')); usc.addEventListener('click',()=>sel('usc'));
}

window.addEventListener('DOMContentLoaded', async ()=>{
  await loadData();
  renderCategoryTiles();
  wireFilters();
  wireSearch();
  wireUSC();
  wireTabs();
  renderUSC();
  // Back button
  const back=document.querySelector('[data-role="back-to-home"]'); if(back){ back.addEventListener('click',()=>{ by('#results-panel').style.display='none'; window.scrollTo({top:0,behavior:'smooth'}); }); }
});
