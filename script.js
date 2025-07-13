// 1) Inizializza Supabase
  const SUPABASE_URL     = 'https://db.fzbpucvscnfiyimefrvzs.supabase.co';
  const SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// — navigation
const sections = document.querySelectorAll('main > section');
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.id.replace('btn-','');
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === target);
    });
    if (target === 'elenco')      loadElenco();
    else if (target === 'statistiche') loadStatistiche();
  });
});

// — ELENCO AS
async function loadElenco() {
  const tbody = document.querySelector('#table-as tbody');
  tbody.innerHTML = '';
  const { data, error } = await supabase
    .from('application_specialists')
    .select('*');
  if (error) return alert(error.message);
  data.forEach(as => {
    const tr = document.createElement('tr');
    ['nome','cognome','team','ruolo','sede','contratto','ambito','clienti','stato']
      .forEach(f => {
        const td = document.createElement('td');
        td.textContent = as[f] || '';
        tr.appendChild(td);
      });
    // pulsante elimina
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Elimina';
    btn.onclick = () => deleteAS(as.id);
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

// aggiungi nuovo AS
document.getElementById('btn-add').addEventListener('click', async () => {
  const record = {};
  ['nome','cognome','team','ruolo','sede','contratto','ambito','clienti','stato']
    .forEach(id => record[id] = document.getElementById(id).value);
  const { error } = await supabase
    .from('application_specialists')
    .insert(record);
  if (error) return alert(error.message);
  loadElenco();
  document.querySelectorAll('.form input').forEach(i => i.value = '');
});

// elimina AS
async function deleteAS(id) {
  if (!confirm('Eliminare questo record?')) return;
  const { error } = await supabase
    .from('application_specialists')
    .delete()
    .eq('id', id);
  if (error) return alert(error.message);
  loadElenco();
}

// — STATISTICHE
async function loadStatistiche() {
  const { data, error } = await supabase
    .from('application_specialists')
    .select('*');
  if (error) return alert(error.message);

  // helper: conta occorrenze, espande CSV per ambito/clienti
  const conta = field => {
    const cnt = {};
    data.forEach(r => {
      let vals = [r[field]];
      if (field === 'ambito' || field === 'clienti') {
        vals = (r[field]||'').split(',').map(x=>x.trim());
      }
      vals.forEach(v => {
        if (!v) return;
        cnt[v] = (cnt[v]||0) + 1;
      });
    });
    return cnt;
  };

  // crea grafico a torta
  function creaGrafico(id, title, counts) {
    const ctx = document.getElementById(id).getContext('2d');
    const labels = Object.keys(counts);
    const dataSet = labels.map(l=>counts[l]);
    const bg = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,50%)`);
    new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ label: title, data: dataSet, backgroundColor: bg }] },
      options:{ plugins:{ legend:{ position:'bottom' }}, responsive:true }
    });
  }

  creaGrafico('chart-sede',       'AS per Sede',      conta('sede'));
  creaGrafico('chart-team',       'AS per Team',      conta('team'));
  creaGrafico('chart-contratto',  'AS per Contratto', conta('contratto'));
  creaGrafico('chart-ambito',     'AS per Ambito',    conta('ambito'));
  creaGrafico('chart-clienti',    'AS per Clienti',   conta('clienti'));
}

// — al primo caricamento mostriamo Home
sections.forEach(sec => {
  if (sec.id === 'home') sec.classList.add('active');
});