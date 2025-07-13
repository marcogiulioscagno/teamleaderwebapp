// ——— CONFIG SUPABASE ———
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ——— ELEMENTI DOM ———
const secStat = document.getElementById('statistiche');
const secDip  = document.getElementById('dipendenti');
const btnStat = document.getElementById('btn-statistiche');
const btnDip  = document.getElementById('btn-dipendenti');
const tblBody = document.querySelector('#tbl-dipendenti tbody');
const formDip = document.getElementById('form-dip');

// ——— NAVIGAZIONE ———
btnStat.addEventListener('click', () => {
  secStat.classList.add('active');
  secDip.classList.remove('active');
  caricaStatistiche();
});
btnDip.addEventListener('click', () => {
  secDip.classList.add('active');
  secStat.classList.remove('active');
  caricaDipendenti();
});

// mostra di default STATISTICHE
btnStat.click();

// ——— CARICA/AGGIORNA DIPIENDENTI ———
async function caricaDipendenti() {
  const { data, error } = await supabase
    .from('application_specialists')
    .select('*');
  if (error) return alert('Errore fetch dipendenti');
  tblBody.innerHTML = '';
  data.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.nome}</td><td>${d.cognome}</td><td>${d.team}</td>
      <td>${d.ruolo}</td><td>${d.sede}</td><td>${d.contratto}</td>
      <td>${d.ambito}</td><td>${d.clienti}</td><td>${d.stato}</td>
      <td><button class="del-btn" data-id="${d.id}">✕</button></td>
    `;
    tblBody.appendChild(tr);
  });
}

// ——— AGGIUNGI NUOVO DIPENDENTE ———
formDip.addEventListener('submit', async e => {
  e.preventDefault();
  const nuovo = {
    nome:      document.getElementById('input-nome').value,
    cognome:   document.getElementById('input-cognome').value,
    team:      document.getElementById('input-team').value,
    ruolo:     document.getElementById('input-ruolo').value,
    sede:      document.getElementById('input-sede').value,
    contratto: document.getElementById('input-contratto').value,
    ambito:    document.getElementById('input-ambito').value,
    clienti:   document.getElementById('input-clienti').value,
    stato:     document.getElementById('input-stato').value
  };
  const { error } = await supabase
    .from('application_specialists')
    .insert(nuovo);
  if (error) return alert('Errore insert');
  formDip.reset();
  caricaDipendenti();
});

// ——— CANCELLA DIPENDENTE ———
tblBody.addEventListener('click', async e => {
  if (!e.target.matches('.del-btn')) return;
  const id = e.target.dataset.id;
  await supabase.from('application_specialists').delete().eq('id', id);
  caricaDipendenti();
});

// ——— CARICA STATISTICHE ———
async function caricaStatistiche() {
  const { data } = await supabase.from('application_specialists').select('*');
  if (!data) return;
  const valori = {
    sede:      {},
    team:      {},
    contratto: {},
    ambito:    {},
    clienti:   {}
  };

  data.forEach(d => {
    // helper per contare multi‐valore CSV
    const conta = (obj,key) => obj[key] = (obj[key]||0)+1;
    conta(valori.sede,      d.sede);
    conta(valori.team,      d.team);
    conta(valori.contratto, d.contratto);
    d.ambito.split(',').forEach(a=>conta(valori.ambito, a.trim()));
    d.clienti.split(',').forEach(a=>conta(valori.clienti,a.trim()));
  });

  // distruggi vecchi canvas se esistono
  if (window._charts) window._charts.forEach(c=>c.destroy());
  window._charts = [];

  // funzione di utilità per creare un grafico
  function creaGrafico(ctxId, title, datiObj) {
    const labels = Object.keys(datiObj);
    const values = Object.values(datiObj);
    const colors = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'];
    const ctx = document.getElementById(ctxId).getContext('2d');
    const chart = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets:[{ data: values, backgroundColor: colors }] },
      options: {
        plugins: {
          title:{ display:true, text:`AS per ${title} (${data.length} AS)` },
          legend:{ position:'bottom', labels:{ color:'#ccc' }}
        }
      }
    });
    window._charts.push(chart);
  }

  creaGrafico('chart-sede',      'Sede',      valori.sede);
  creaGrafico('chart-team',      'Team',      valori.team);
  creaGrafico('chart-contratto', 'Contratto', valori.contratto);
  creaGrafico('chart-ambito',    'Ambito',    valori.ambito);
  creaGrafico('chart-clienti',   'Clienti',   valori.clienti);
}