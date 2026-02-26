/* Hybrid Loader — GitHub Connected Edition */
const DATA_URL = "https://raw.githubusercontent.com/boxofbrokentoys-oss/surrey-referrals-data/refs/heads/main/master_normalised.json";

let DATA=null, INDEX=[];
const by=(q)=>document.querySelector(q);
const el=(t,cls)=>{ const e=document.createElement(t); if(cls) e.className=cls; return e; };

async function loadData(){
  if(DATA) return DATA;
  const res = await fetch(DATA_URL);
  if(!res.ok){ console.error('Failed to fetch JSON', res.status, res.statusText); alert('Could not load referral data. Check internet or GitHub link.'); }
  DATA = await res.json();
  buildIndex(DATA);
  return DATA;
}

function buildIndex(data){ INDEX.length=0; for(const [spec, conds] of Object.entries(data)){ for(const [cond, svcs] of Object.entries(conds)){ for(const s of svcs){ INDEX.push({...s,_spec:spec,_cond:cond}); } } } }

function renderSpecialtyTiles(data){ const grid=by('#systems-grid'); if(!grid) return; grid.innerHTML=''; Object.keys(data).sort().forEach(spec=>{ const card=el('div','system-card'); card.innerHTML=`<div class=\"sys-icon\">🔹</div><div class=\"sys-title\">${spec}</div>`; card.onclick=()=>showSpecialty(spec); grid.appendChild(card); }); }

function showSpecialty(spec){ by('#home-view').style.display='none'; by('#results-panel').style.display='block'; by('#results-sys-name').textContent=spec; const bar=by('#specialty-filter-bar'); bar.style.display='flex'; bar.innerHTML=''; const conds=Object.keys(DATA[spec]).sort(); conds.forEach((cond,i)=>{ const b=el('button','area-chip'+(i===0?' active':'')); b.dataset.cond=cond; b.textContent=cond; b.onclick=()=>{ bar.querySelectorAll('.area-chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); drawServices(spec,cond); }; bar.appendChild(b); }); drawServices(spec,conds[0]); }

function badgeRow(s){ const row=[]; if(s.rasType) row.push(`<span class=\"area-chip\" style=\"pointer-events:none\">${s.rasType}</span>`); if(s.method && s.method.toLowerCase().includes('email')) row.push('<span class=\"area-chip\" style=\"pointer-events:none\">Email</span>'); return row.join(' '); }

function svcCard(s){ const d=el('div','service-card'); d.innerHTML=`<div class=\"svc-title\">${s.serviceName||''}</div><div class=\"svc-sub\">${s.provider||''}${s.region?' • '+s.region:''}</div><div class=\"svc-badges\">${badgeRow(s)}</div>${(s.sites&&s.sites.length)?`<div class=\"svc-sites\"><strong>Sites:</strong> ${s.sites.join(', ')}</div>`:''}<div class=\"svc-meta\"><strong>Age/Sex:</strong> ${(s.ageMin!=null?('≥'+s.ageMin):'All')+(s.ageMax!=null?(' and ≤'+s.ageMax):'')} • ${s.sex||'any'}</div><div class=\"svc-contact\"><strong>Email:</strong> ${s.email||'—'} • <strong>Phone:</strong> ${s.phone||'—'}</div>${s.notes?`<div class=\"svc-notes\">${s.notes}</div>`:''}`; return d; }

let currentRegion='', currentAgeMode='all', currentAgeValue=null;
function drawServices(spec,cond){ const wrap=by('#results-body'); wrap.innerHTML=''; let list=DATA[spec][cond]||[]; if(currentRegion) list=list.filter(s=>(s.region||'')===currentRegion); if(currentAgeMode==='adult') list=list.filter(s=>(s.ageMin??0)>=16); if(currentAgeMode==='paeds') list=list.filter(s=>(s.ageMax??999)<18); if(currentAgeValue!=null){ list=list.filter(s=>{ if(s.ageMin!=null && s.ageMin>currentAgeValue) return false; if(s.ageMax!=null && currentAgeValue>s.ageMax) return false; return true; }); }
  by('#results-count-pill').textContent=list.length+' services'; const byProv={}; list.forEach(s=>{ (byProv[s.provider||'Other']=byProv[s.provider||'Other']||[]).push(s); }); Object.keys(byProv).sort().forEach(p=>{ const box=el('div','provider-box'); const h=el('div','provider-title'); h.textContent=p; box.appendChild(h); byProv[p].forEach(s=>box.appendChild(svcCard(s))); wrap.appendChild(box); }); }

function wireFilters(){ document.querySelectorAll('#ur-area-filter .area-chip').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('#ur-area-filter .area-chip').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentRegion=btn.dataset.area||''; const spec=by('#results-sys-name').textContent; const activeCond=document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond; if(spec && activeCond) drawServices(spec,activeCond); }); }); document.querySelectorAll('.age-chip').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentAgeMode=btn.dataset.age; if(currentAgeMode!=='all') currentAgeValue=null; const spec=by('#results-sys-name').textContent; const activeCond=document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond; if(spec && activeCond) drawServices(spec,activeCond); }); }); const slider=by('#age-slider'), val=by('#age-slider-value'); if(slider){ slider.addEventListener('input',()=>{ currentAgeValue=parseInt(slider.value,10); val.textContent=slider.value+'+'; currentAgeMode='all'; document.querySelectorAll('.age-chip').forEach(b=>b.classList.remove('active')); const allBtn=document.querySelector('.age-chip[data-age="all"]'); if(allBtn) allBtn.classList.add('active'); const spec=by('#results-sys-name').textContent; const activeCond=document.querySelector('#specialty-filter-bar .area-chip.active')?.dataset.cond; if(spec && activeCond) drawServices(spec,activeCond); }); } }

function buildIndexSearch(){ const g=by('#global-search'); const out=by('#search-results'); if(!g||!out) return; g.addEventListener('input',()=>{ const q=(g.value||'').trim().toLowerCase(); out.innerHTML=''; if(!q) return; const hits=INDEX.filter(s=> (s.serviceName||'').toLowerCase().includes(q) || (s._spec||'').toLowerCase().includes(q) || (s._cond||'').toLowerCase().includes(q) || (s.provider||'').toLowerCase().includes(q) || (s.sites||[]).join(',').toLowerCase().includes(q) ); hits.slice(0,200).forEach(s=>{ const li=el('div','search-hit'); li.textContent=`${s._spec} → ${s._cond} — ${s.serviceName}`; li.onclick=()=>{ out.innerHTML=''; showSpecialty(s._spec); drawServices(s._spec,s._cond); }; out.appendChild(li); }); }); }

function wireBack(){ const back=document.querySelector('[data-role="back-to-home"]'); if(back){ back.addEventListener('click',()=>{ by('#results-panel').style.display='none'; by('#home-view').style.display='block'; }); } }

window.addEventListener('DOMContentLoaded', async ()=>{ await loadData(); renderSpecialtyTiles(DATA); wireFilters(); buildIndexSearch(); wireBack(); });
