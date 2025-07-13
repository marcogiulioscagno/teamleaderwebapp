// --- Supabase setup ---
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const sb = supabase.createClient(supabaseUrl, supabaseKey);

// --- elementi DOM ---
const btnDip   = document.getElementById('btn-dipendenti');
const btnStat  = document.getElementById('btn-statistiche');
const sezDip   = document.getElementById('sez-dipendenti');
const sezStat  = document.getElementById('sez-statistiche');
const tblBody  = document.getElementById('tbl-body');
const fields   = ['nome','cognome','team','ruolo','sede','contratto','ambito','clienti','stato'];

// --- navigazione ---
btnDip.addEventListener('click', ()=> showSection('dip'));
btnStat.addEventListener('click',()=> showSection('stat'));

// al caricamento default statistiche
showSection('stat');
loadStatistiche();

function showSection(sec){
  btnDip.classList.remove('active');
  btnStat.classList.remove('active');
  sezDip.classList.add('hidden');
  sezStat.classList.add('hidden');
  if(sec==='dip'){
    btnDip.classList.add('active');
    sezDip.classList.remove('hidden');
    loadDipendenti();
  } else {
    btnStat.classList.add('active');
    sezStat.classList.remove('hidden');
    loadStatistiche();
  }
}

// --- Dipendenti CRUD ---
document.getElementById('btn-add').onclick = async ()=>{
  let record = {};
  fields.forEach(f=> record[f] = document.getElementById(f).value.trim());
  await sb.from('application_specialists').insert(record);
  fields.forEach(f=> document.getElementById(f).value='');
  loadDipendenti();
};

async function loadDipendenti(){
  const { data, error } = await sb.from('application_specialists').select('*');
  if(error) return alert(error.message);
  tblBody.innerHTML = '';
  data.forEach(r=>{
    let tr = document.createElement('tr');
    fields.forEach(f=>{
      let td = document.createElement('td');
      td.textContent = r[f];
      tr.appendChild(td);
    });
    let tdDel = document.createElement('td');
    tdDel.innerHTML = `<button data-id="${r.id}">✖</button>`;
    tr.appendChild(tdDel);
    tblBody.appendChild(tr);
  });
  // elimina
  tblBody.querySelectorAll('button').forEach(btn=>{
    btn.onclick = async ()=>{
      await sb.from('application_specialists').delete().eq('id', btn.dataset.id);
      loadDipendenti();
    };
  });
}

// --- Statistiche e grafici ---
async function loadStatistiche(){
  const { data, error } = await sb.from('application_specialists').select('*');
  if(error) return alert(error.message);

  // helper per contare categorie
  function conta(key){
    const map = {};
    data.forEach(r=>{
      let vals = (r[key]||'').split(',').map(v=>v.trim()).filter(v=>v);
      vals.forEach(v=> map[v] = (map[v]||0) + 1);
    });
    return map;
  }

  // disegna un chart
  function renderChart(ctxId, key, title){
    const mapping = conta(key);
    new Chart(document.getElementById(ctxId).getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(mapping),
        datasets: [{
          data: Object.values(mapping),
          backgroundColor: Object.keys(mapping).map((_,i)=>`hsl(${i*60},70%,50%)`)
        }]
      },
      options: {
        plugins:{ title:{ display:true, text: title + ' (' + data.length + ' AS)' } }
      }
    });
  }

  renderChart('chart-sede',      'sede',      'AS per Sede');
  renderChart('chart-team',      'team',      'AS per Team');
  renderChart('chart-contratto', 'contratto', 'AS per Contratto');
  renderChart('chart-ambito',    'ambito',    'AS per Ambito');
  renderChart('chart-clienti',   'clienti',   'AS per Clienti');
}