// chiavi Supabase
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' ;
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

// elementi
const btnStat = document.querySelector('#btn-statistiche');
const btnDip = document.querySelector('#btn-dipendenti');
const secStat = document.querySelector('#statistiche');
const secDip  = document.querySelector('#dipendenti');

btnStat.addEventListener('click', () => {
  secStat.classList.remove('hidden');
  secDip.classList.add('hidden');
  caricaStatistiche();
});
btnDip.addEventListener('click', () => {
  secDip .classList.remove('hidden');
  secStat.classList.add('hidden');
  caricaAS();
});

// Dati AS in memoria
let elencoAS = [];

// FUNZIONE: aggiungi AS
document.querySelector('#btn-aggiungi').addEventListener('click', async () => {
  // leggi campi
  const dati = {
    nome:      document.querySelector('#input-nome').value,
    cognome:   document.querySelector('#input-cognome').value,
    team:      document.querySelector('#input-team').value,
    ruolo:     document.querySelector('#input-ruolo').value,
    sede:      document.querySelector('#input-sede').value,
    contratto: document.querySelector('#input-contratto').value,
    ambito:    document.querySelector('#input-ambito').value.split(','),
    clienti:   document.querySelector('#input-clienti').value.split(','),
    stato:     document.querySelector('#input-stato').value,
  };
  // salva via API
  const { error } = await supabase
    .from('application_specialists')
    .insert([dati]);
  if (error) return alert('Errore salvataggio');
  // ricarica elenco
  caricaAS();
  // pulisci form
  document.querySelectorAll('.form-grid input').forEach(i=>i.value='');
});

// FUNZIONE: carica elenco AS
async function caricaAS() {
  const { data, error } = await supabase
    .from('application_specialists')
    .select();
  if (error) return alert('Errore caricamento');
  elencoAS = data;
  renderTabella();
}

// FUNZIONE: render tabella
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
  document.querySelectorAll('.del').forEach(btn=>{
    btn.onclick = async ()=> {
      const id = btn.dataset.id;
      await supabase.from('application_specialists').delete().eq('id', id);
      caricaAS();
    };
  });
}

// FUNZIONE: statistiche
async function caricaStatistiche() {
  // prendi dati
  await caricaAS();
  // genera ciascun grafico
  creaGrafico('chart-sede',      'AS per Sede',      raggruppa(elencoAS, 'sede'));
  creaGrafico('chart-team',      'AS per Team',      raggruppa(elencoAS, 'team'));
  creaGrafico('chart-contratto', 'AS per Contratto', raggruppa(elencoAS, 'contratto'));
  creaGrafico('chart-ambito',    'AS per Ambito',    raggruppaMulti(elencoAS, 'ambito'));
  creaGrafico('chart-clienti',   'AS per Clienti',   raggruppaMulti(elencoAS, 'clienti'));
}

// raggruppa campo singolo
function raggruppa(arr, campo) {
  return arr.reduce((acc, x) => {
    const k = x[campo]||'';
    acc[k] = (acc[k]||0)+1;
    return acc;
  }, {});
}
// raggruppa array di valori
function raggruppaMulti(arr, campo) {
  return arr.flatMap(x=>x[campo]).reduce((acc, v) => {
    acc[v] = (acc[v]||0)+1;
    return acc;
  }, {});
}

// crea grafico a torta
function creaGrafico(id, title, dataObj) {
  const ctx = document.getElementById(id).getContext('2d');
  const labels = Object.keys(dataObj);
  const data   = Object.values(dataObj);
  // distruggi se già esiste
  if (ctx.chart) ctx.chart.destroy();
  ctx.chart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'] }] },
    options: {
      plugins: { legend:{ position:'top' }, title:{ display:true, text:`${title} (${data.reduce((a,b)=>a+b,0)} AS)` }},
      responsive:true, maintainAspectRatio:false
    }
  });
}

// avvio iniziale
btnStat.click();