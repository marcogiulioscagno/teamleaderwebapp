// → Sostituisci con i tuoi valori esatti:
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const sb = supabase.createClient(supabaseUrl, supabaseKey);

// palette colori fissa
const COLORS = ['#3366cc','#dc3912','#ff9900','#109618','#990099','#0099c6','#dd4477','#66aa00','#b82e2e','#316395'];

// ——— NAVIGAZIONE ———
document.querySelectorAll('button[data-sec]').forEach(btn => {
  btn.addEventListener('click', () => {
    // nascondi tutte le sezioni
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
    // mostra quella cliccata
    const sec = document.getElementById('sezione-' + btn.dataset.sec);
    sec.classList.add('active');
    // se era Statistiche, ricalcola
    if (btn.dataset.sec === 'statistiche') renderStats();
  });
});

// ——— ELENCO AS ———
const form = document.getElementById('as-form');
const tbody = document.querySelector('#as-table tbody');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const rec = {
    nome:      f.nome.value,
    cognome:   f.cognome.value,
    team:      f.team.value,
    ruolo:     f.ruolo.value,
    sede:      f.sede.value,
    contratto: f.contratto.value,
    ambito:    f.ambito.value.split(',').map(s=>s.trim()).filter(Boolean),
    clienti:   f.clienti.value.split(',').map(s=>s.trim()).filter(Boolean),
    stato:     f.stato.value
  };
  const { error } = await sb.from('application_specialists').insert([ rec ]);
  if (error) return alert('Errore inserimento: ' + error.message);
  f.reset();
  loadTable();
});

async function loadTable() {
  const { data, error } = await sb
    .from('application_specialists')
    .select('*')
    .order('created_at',{ ascending: false });
  if (error) return console.error(error);
  tbody.innerHTML = data.map(r=>`
    <tr>
      <td>${r.nome}</td>
      <td>${r.cognome}</td>
      <td>${r.team||''}</td>
      <td>${r.ruolo||''}</td>
      <td>${r.sede||''}</td>
      <td>${r.contratto||''}</td>
      <td>${Array.isArray(r.ambito)?r.ambito.join(', '):''}</td>
      <td>${Array.isArray(r.clienti)?r.clienti.join(', '):''}</td>
      <td>${r.stato||''}</td>
      <td><button data-id="${r.id}" class="delete-btn">Elimina</button></td>
    </tr>`).join('');
  document.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.onclick = async ()=>{
      if (!confirm('Confermi eliminazione?')) return;
      const { error } = await sb.from('application_specialists')
        .delete().eq('id',btn.dataset.id);
      if (error) return alert('Errore cancellazione: '+error.message);
      loadTable();
    };
  });
}
window.addEventListener('DOMContentLoaded', loadTable);

// ——— STATISTICHE ———
async function renderStats() {
  const { data, error } = await sb
    .from('application_specialists')
    .select('*');
  if (error) return console.error(error);

  const countBy = (arr, fn) =>
    arr.reduce((acc,x)=>{
      const k = fn(x) || '—';
      acc[k] = (acc[k]||0)+1;
      return acc;
    },{});

  const stats = {
    contratto: countBy(data, r=>r.contratto),
    sede:       countBy(data, r=>r.sede),
    team:       countBy(data, r=>r.team),
    ambito:     countBy(data, r=>Array.isArray(r.ambito)?r.ambito.join(', '):r.ambito),
    clienti:    countBy(data, r=>Array.isArray(r.clienti)?r.clienti.join(', '):r.clienti)
  };

  createPie('chart-contratto','AS per Contratto', stats.contratto);
  createPie('chart-sede','AS per Sede', stats.sede);
  createPie('chart-team','AS per Team', stats.team);
  createPie('chart-ambito','AS per Ambito', stats.ambito);
  createPie('chart-clienti','AS per Clienti', stats.clienti);
}

function createPie(canvasId, title, counts) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const bg = labels.map((_,i)=>COLORS[i % COLORS.length]);
  if (ctx.chart) ctx.chart.destroy();
  ctx.chart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets:[{ data: values, backgroundColor: bg }] },
    options: {
      plugins:{
        legend:{ position:'bottom' },
        title:{ display:true, text:title }
      }
    }
  });
}