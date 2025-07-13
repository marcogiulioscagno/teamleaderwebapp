//1) inizializza Supabase
const SUPABASE_URL     = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2) NAVIGAZIONE tra le sezioni
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    // attiva il button
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // mostra la sezione corretta
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.sec).classList.add('active');
    // carica dati se serve
    if (btn.dataset.sec === 'elenco') caricaElenco();
    if (btn.dataset.sec === 'statistiche') caricaStatistiche();
  });
});

// di default apri HOME
document.querySelector('nav button[data-sec="home"]').click();


// 3) gestione ELENCO AS
const tblBody = document.getElementById('tblBody');
document.getElementById('btnAdd').addEventListener('click', async () => {
  const nuovo = {
    nome:      document.getElementById('fNome').value.trim(),
    cognome:   document.getElementById('fCognome').value.trim(),
    team:      document.getElementById('fTeam').value.trim(),
    ruolo:     document.getElementById('fRuolo').value.trim(),
    sede:      document.getElementById('fSede').value.trim(),
    contratto: document.getElementById('fContratto').value.trim(),
    ambito:    document.getElementById('fAmbito').value.trim(),
    clienti:   document.getElementById('fClienti').value.trim(),
    stato:     document.getElementById('fStato').value.trim(),
  };
  // inserisci nel DB
  const { error } = await sb
    .from('application_specialists')
    .insert([nuovo]);
  if (error) return alert('Errore inserimento: '+ error.message);
  // ripulisci form e ricarica
  document.querySelectorAll('.form-row input').forEach(i=>i.value='');
  caricaElenco();
});

async function caricaElenco() {
  tblBody.innerHTML = '<tr><td colspan="10">Caricamento…</td></tr>';
  const { data, error } = await sb
    .from('application_specialists')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    tblBody.innerHTML = `<tr><td colspan="10">Errore: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tblBody.innerHTML = '<tr><td colspan="10">Nessun record</td></tr>';
    return;
  }
  tblBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.nome}</td>
      <td>${row.cognome}</td>
      <td>${row.team}</td>
      <td>${row.ruolo}</td>
      <td>${row.sede}</td>
      <td>${row.contratto}</td>
      <td>${row.ambito}</td>
      <td>${row.clienti}</td>
      <td>${row.stato}</td>
      <td><button data-id="${row.id}" class="del">❌</button></td>
    `;
    tblBody.appendChild(tr);
    tr.querySelector('.del').addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      await sb.from('application_specialists').delete().eq('id', id);
      caricaElenco();
    });
  });
}


// 4) gestione STATISTICHE
async function caricaStatistiche() {
  // scarica tutti i record
  const { data, error } = await sb.from('application_specialists').select('*');
  if (error) return alert('Errore statistiche: '+ error.message);

  // helper: conta per campo
  const conta = (arr, campo) => {
    return arr.reduce((acc, r) => {
      const val = r[campo] || '—';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  };

  // prepara i dataset
  const dsSede      = conta(data, 'sede');
  const dsTeam      = conta(data, 'team');
  const dsContratto = conta(data, 'contratto');
  const dsAmbito    = conta(data, 'ambito');
  const dsClienti   = conta(data, 'clienti');

  // disegna i 5 grafici (Chart.js)
  if (typeof Chart === 'undefined') {
    // carica Chart.js on-the-fly
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(s);
    s.onload = () => creaChart('chartSede',      dsSede,      'AS per Sede');
    s.onload = () => creaChart('chartTeam',      dsTeam,      'AS per Team');
    s.onload = () => creaChart('chartContratto', dsContratto, 'AS per Contratto');
    s.onload = () => creaChart('chartAmbito',    dsAmbito,    'AS per Ambito');
    s.onload = () => creaChart('chartClienti',   dsClienti,   'AS per Clienti');
  } else {
    creaChart('chartSede',      dsSede,      'AS per Sede');
    creaChart('chartTeam',      dsTeam,      'AS per Team');
    creaChart('chartContratto', dsContratto, 'AS per Contratto');
    creaChart('chartAmbito',    dsAmbito,    'AS per Ambito');
    creaChart('chartClienti',   dsClienti,   'AS per Clienti');
  }
}

function creaChart(canvasId, dataObj, label) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  const colors = labels.map(_=>`hsl(${Math.random()*360},70%,60%)`);
  new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#fff' } },
        title: { display: true, text: `${label} (totale: ${values.reduce((a,b)=>a+b,0)})`, color: '#fff' }
      }
    }
  });
}