// ==== CONFIGURAZIONE SUPABASE ====
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

// ==== NAVIGAZIONE SEZIONI ====
const homeSec  = document.getElementById('homeSection');
const listSec  = document.getElementById('listSection');
const statsSec = document.getElementById('statsSection');
document.getElementById('btnHome').onclick  = () => showSection(homeSec);
document.getElementById('btnList').onclick  = () => { showSection(listSec); loadList(); };
document.getElementById('btnStats').onclick = () => { showSection(statsSec); loadStats(); };

function showSection(sec) {
  [homeSec,listSec,statsSec].forEach(s=>s.classList.add('hidden'));
  sec.classList.remove('hidden');
}
// mostra subito HOME
showSection(homeSec);

// ==== ELENCO AS CRUD ====
const inName     = document.getElementById('inName');
const inSurname  = document.getElementById('inSurname');
const inTeam     = document.getElementById('inTeam');
const inRole     = document.getElementById('inRole');
const inSede     = document.getElementById('inSede');
const inContract = document.getElementById('inContract');
const inAmbito   = document.getElementById('inAmbito');
const inClients  = document.getElementById('inClients');
const inState    = document.getElementById('inState');
const listBody   = document.getElementById('listBody');
document.getElementById('btnAdd').onclick = addAS;

async function loadList() {
  listBody.innerHTML = '';
  let { data, error } = await supabase
    .from('application_specialists')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return alert(error.message);
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.nome}</td>
      <td>${r.cognome}</td>
      <td>${r.team}</td>
      <td>${r.ruolo}</td>
      <td>${r.sede}</td>
      <td>${r.contratto}</td>
      <td>${r.ambito.join(', ')}</td>
      <td>${r.clienti.join(', ')}</td>
      <td>${r.stato}</td>
      <td><button data-id="${r.id}">X</button></td>
    `;
    tr.querySelector('button').onclick = () => delAS(r.id);
    listBody.appendChild(tr);
  });
}

async function addAS() {
  const nuovo = {
    nome:     inName.value.trim(),
    cognome:  inSurname.value.trim(),
    team:     inTeam.value.trim(),
    ruolo:    inRole.value.trim(),
    sede:     inSede.value.trim(),
    contratto:inContract.value.trim(),
    ambito:   inAmbito.value.trim().split(',').map(s=>s.trim()).filter(s=>s),
    clienti:  inClients.value.trim().split(',').map(s=>s.trim()).filter(s=>s),
    stato:    inState.value.trim()
  };
  let { error } = await supabase
    .from('application_specialists')
    .insert(nuovo);
  if (error) return alert(error.message);
  // pulisci form e ricarica
  [inName,inSurname,inTeam,inRole,inSede,inContract,inAmbito,inClients,inState]
    .forEach(i=>i.value='');
  loadList();
}

async function delAS(id) {
  if (!confirm('Eliminare questo AS?')) return;
  let { error } = await supabase
    .from('application_specialists')
    .delete().eq('id', id);
  if (error) return alert(error.message);
  loadList();
}

// ==== STATISTICHE ====
let charts = {};
async function loadStats() {
  // recupero tutti i record
  let { data, error } = await supabase
    .from('application_specialists')
    .select('team,sede,contratto,ambito,clienti');
  if (error) return alert(error.message);

  // helper: conta occorrenze
  function countField(arr, key) {
    const cnt = {};
    arr.forEach(r => {
      let vals = Array.isArray(r[key]) ? r[key] : [r[key]];
      vals.forEach(v => {
        if (!v) return;
        cnt[v] = (cnt[v]||0) + 1;
      });
    });
    return cnt;
  }

  const stats = {
    sede:      countField(data,'sede'),
    team:      countField(data,'team'),
    contract:  countField(data,'contratto'),
    ambito:    countField(data,'ambito'),
    clients:   countField(data,'clienti')
  };

  // per ogni chart: etichette + dati
  renderPie('chartSede',     stats.sede,     'AS per Sede');
  renderPie('chartTeam',     stats.team,     'AS per Team');
  renderPie('chartContract', stats.contract, 'AS per Contratto');
  renderPie('chartAmbito',   stats.ambito,   'AS per Ambito');
  renderPie('chartClients',  stats.clients,  'AS per Clienti');
}

function renderPie(canvasId, dataObj, title) {
  const ctx = document.getElementById(canvasId);
  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`)
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `${title} (${values.reduce((a,b)=>a+b,0)})` },
        legend: { position: 'bottom', labels: { color: '#eee' } }
      }
    }
  });
}