// 1) Inizializzo Supabase
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2) Elementi di navigazione
const btnStat = document.getElementById('btn-statistiche');
const btnDip  = document.getElementById('btn-dipendenti');
const secStat = document.getElementById('statistiche');
const secDip  = document.getElementById('dipendenti');

btnStat.addEventListener('click', ()=> {
  secStat.classList.remove('hidden');
  secDip.classList.add('hidden');
  caricaStatistiche();
});
btnDip.addEventListener('click', ()=> {
  secDip .classList.remove('hidden');
  secStat.classList.add('hidden');
  caricaAS();
});

// 3) Gestione elenco AS
let elencoAS = [];
document.getElementById('btn-aggiungi').onclick = async () => {
  const d = {
    nome:      document.getElementById('input-nome').value,
    cognome:   document.getElementById('input-cognome').value,
    team:      document.getElementById('input-team').value,
    ruolo:     document.getElementById('input-ruolo').value,
    sede:      document.getElementById('input-sede').value,
    contratto: document.getElementById('input-contratto').value,
    ambito:    document.getElementById('input-ambito').value.split(','),
    clienti:   document.getElementById('input-clienti').value.split(','),
    stato:     document.getElementById('input-stato').value,
  };
  const { error } = await supabase.from('application_specialists').insert([d]);
  if (error) return alert('Errore: ' + error.message);
  caricaAS();
  document.querySelectorAll('.form-grid input').forEach(i=>i.value='');
};

async function caricaAS() {
  const { data, error } = await supabase.from('application_specialists').select();
  if (error) return alert('Errore: ' + error.message);
  elencoAS = data;
  renderTabella();
}

function renderTabella() {
  const tbody = document.querySelector('#tabella-as tbody');
  tbody.innerHTML = '';
  elencoAS.forEach(as => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${as.nome}</td>
      <td>${as.cognome}</td>
      <td>${as.team}</td>
      <td>${as.ruolo}</td>
      <td>${as.sede}</td>
      <td>${as.contratto}</td>
      <td>${as.ambito.join(', ')}</td>
      <td>${as.clienti.join(', ')}</td>
      <td>${as.stato}</td>
      <td><button class="del" data-id="${as.id}">Elimina</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.del').forEach(b=>{
    b.onclick = async () => {
      await supabase.from('application_specialists').delete().eq('id', b.dataset.id);
      caricaAS();
    };
  });
}

// 4) Statistiche
async function caricaStatistiche() {
  await caricaAS();
  creaGrafico('chart-sede',      'AS per Sede',      raggruppa(elencoAS,'sede'));
  creaGrafico('chart-team',      'AS per Team',      raggruppa(elencoAS,'team'));
  creaGrafico('chart-contratto', 'AS per Contratto', raggruppa(elencoAS,'contratto'));
  creaGrafico('chart-ambito',    'AS per Ambito',    raggruppaMulti(elencoAS,'ambito'));
  creaGrafico('chart-clienti',   'AS per Clienti',   raggruppaMulti(elencoAS,'clienti'));
}

function raggruppa(arr, campo) {
  return arr.reduce((acc,x)=>{ acc[x[campo]]=(acc[x[campo]]||0)+1; return acc; }, {});
}
function raggruppaMulti(arr, campo) {
  return arr.flatMap(x=>x[campo]).reduce((acc,v)=>{ acc[v]=(acc[v]||0)+1; return acc; }, {});
}

function creaGrafico(id,title,dataObj) {
  const ctx = document.getElementById(id).getContext('2d');
  if (ctx.chart) ctx.chart.destroy();
  const labels = Object.keys(dataObj),
        data   = Object.values(dataObj);
  ctx.chart = new Chart(ctx, {
    type:'pie',
    data:{ labels, datasets:[{ data, backgroundColor:['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'] }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        title:{ display:true, text:`${title} (${data.reduce((a,b)=>a+b,0)} AS)` },
        legend:{ position:'top' }
      }
    }
  });
}

// 5) Avvio su STATISTICHE
btnStat.click();