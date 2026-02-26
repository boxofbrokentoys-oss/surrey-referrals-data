// Hybrid Loader (uses existing NHS UI containers)
let DATA=null, INDEX=[];
const by=(q)=>document.querySelector(q);
const el=(t,cls)=>{const e=document.createElement(t); if(cls) e.className=cls; return e;};

async function loadData(){
  if(DATA) return DATA;
  const res = await fetch('master_normalised.json');
  DATA = await res.json();
  buildIndex(DATA);
  return DATA;
}

function buildIndex(data){
  INDEX.length=0;
  for(const [spec, conds] of Object.entries(data)){
    for(const [cond, services] of Object.entries(conds)){
      for(const s of services){ INDEX.push({...s, _spec:spec, _cond:cond}); }
    }
  }
}

function renderSpecialtyTiles(data){
  const grid = by('#systems-grid'); if(!grid) return;
  grid.innerHTML='';
  Object.keys(data).sort().forEach(spec=>{
    const card = el('div','system-card');
    card.innerHTML = `<div class="sys-icon">🔹</div><div class="sys-title">${spec}</div>`;
    card.addEventListener('click',()=>showSpecialty(spec));
    grid.appendChild(card);
  });
}

function showSpecialty(spec){
  by('#home-view').style.display='none';
  by('#results-panel').style.display='block';
  by('#results-sys-name').textContent = spec;
  // Fill conditions as chips
  const bar = by('#specialty-filter-bar');
  bar.style.display='flex';
  bar.innerHTML='';
  const conds = Object.keys(DATA[spec]).sort();
  conds.forEach((cond,i)=>{
    const b=el('button','area-chip'+(i===0?' active':''));
    b.textContent=cond; b.dataset.cond=cond;
    b.onclick=()=>{ bar.querySelectorAll('.area-chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); drawServices(spec,cond); };
    bar.appendChild(b);
  });
  drawServices(spec, conds[0]);
}

function badgeRow(s){
  const row=[]; if(s.rasType) row.push(`<span class="area-chip" style="pointer-events:none">${s.rasType}</span>`);
  if(s.method && s.method.toLowerCase().includes('email')) row.push('<span class="area-chip" style="pointer-events:none">Email</span>');
  return row.join(' ');
}

function svcCard(s){
  const d=el('div','service-card');
  d.innerHTML = `
    <div class="svc-title">${s.serviceName||''}</div>
    <div class="svc-sub">${s.provider||''}${s.region? ' • '+s.region:''}</div>
    <div class="svc-badges">${badgeRow(s)}</div>
    ${s.sites && s.sites.length? `<div class="svc-sites"><strong>Sites:</strong> ${s.sites.join(', ')}</div>`:''}
    <div class="svc-meta"><strong>Age/Sex:</strong> ${s.ageMin!=null?('≥'+s.ageMin):'All'}${s.ageMax!=null?(' and ≤'+s.ageMax):''} • ${s.sex||'any'}</div>
    <div class="svc-contact"><strong>Email:</strong> ${s.email||'—'} • <strong>Phone:</strong> ${s.phone||'—'}</div>
    ${s.notes? `<div class="svc-notes">${s.notes}</div>`:''}
  `;
  return d;
}

function drawServices(spec,cond, opts={}){
  const wrap = by('#results-body');
  wrap.innerHTML='';
  let list = DATA[spec][cond]||[];
  // Region filter
  if(currentRegion) list = list.filter(s=>!currentRegion || (s.region||'')===currentRegion);
  // Age quick filter
  if(currentAgeMode==='adult') list = list.filter(s=> (s.ageMin??0) >= 16);
  if(currentAgeMode==='paeds') list = list.filter(s=> (s.ageMax??999) < 18);
  // Slider filter
  if(currentAgeValue!=null){ list = list.filter(s=> { if(s.ageMin!=null && s.ageMin>currentAgeValue) return false; if(s.ageMax!=null && currentAgeValue>s.ageMax) return false; return true; }); }

  by('#results-count-pill').textContent = list.length + ' services';
  // Group by provider and draw
  const byProv = {};
  list.forEach(s=>{ (byProv[s.provider||'Other'] = byProv[s.provider||'Other'] || []).push(s); });
  Object.keys(byProv).sort().forEach(p=>{
    const box=el('div','provider-box');
    const h=el('div','provider-title'); h.textContent=p; box.appendChild(h);
    byProv[p].forEach(s=> box.appendChild(svcCard(s)) );
    wrap.appendChild(box);
  });
}

// Global search over INDEX
function doSearch(q){
  q=q.trim().toLowerCase();
  const out = by('#search-results'); out.innerHTML='';
  if(!q){ out.innerHTML=''; return; }
  const hits = INDEX.filter(s=> (s.serviceName||'').toLowerCase().includes(q) || (s._spec||'').toLowerCase().includes(q) || (s._cond||'').toLowerCase().includes(q) || (s.provider||'').toLowerCase().includes(q) || (s.sites||[]).join(',').toLowerCase().includes(q) );
  const top = hits.slice(0,200);
  top.forEach(s=>{ const li=el('div','search-hit'); li.textContent=`${s._spec} → ${s._cond} — ${s.serviceName}`; li.onclick=()=>{ by('#search-results').innerHTML=''; showSpecialty(s._spec); drawServices(s._spec,s._cond); }; out.appendChild(li); });
}

// Filters state and wiring
let currentRegion='', currentAgeMode='all', currentAgeValue=null;

function wireFilters(){
  // region chips (UR panel)
  document.querySelectorAll('#ur-area-filter .area-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#ur-area-filter .area-chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentRegion = btn.dataset.area||'';
      // redraw if results shown
      if(by('#results-panel').style.display==='block'){
        const spec = by('#results-sys-name').textContent;
        const activeCond = document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond;
        if(spec && activeCond) drawServices(spec, activeCond);
      }
    });
  });
  // age quick chips
  document.querySelectorAll('.age-chip').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentAgeMode = btn.dataset.age; if(currentAgeMode!=='all') currentAgeValue=null;
      if(by('#results-panel').style.display==='block'){
        const spec = by('#results-sys-name').textContent;
        const activeCond = document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond;
        if(spec && activeCond) drawServices(spec, activeCond);
      }
    });
  });
  // slider
  const slider=by('#age-slider'); const val=by('#age-slider-value');
  if(slider){ slider.addEventListener('input',()=>{ currentAgeValue = parseInt(slider.value,10); val.textContent = slider.value+'+'; currentAgeMode='all'; document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active')); document.querySelector('.age-chip[data-age="all"]').classList.add('active'); const spec = by('#results-sys-name').textContent; const activeCond = document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond; if(spec && activeCond) drawServices(spec, activeCond); }); }
}

// Search wiring
function wireSearch(){
  const g = by('#global-search'); if(g){ g.addEventListener('input',()=> doSearch(g.value)); }
}

// Back button
function wireBack(){
  const back = document.querySelector('[data-role="back-to-home"]');
  if(back){ back.addEventListener('click',()=>{ by('#results-panel').style.display='none'; by('#home-view').style.display='block'; }); }
}

window.addEventListener('DOMContentLoaded', async ()=>{
  await loadData();
  renderSpecialtyTiles(DATA);
  wireFilters(); wireSearch(); wireBack();
});
