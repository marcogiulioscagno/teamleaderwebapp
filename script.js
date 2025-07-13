// ——— CONFIG SUPABASE ———
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  // sezioni
  const statsSec = document.getElementById('statsSection');
  const listSec  = document.getElementById('listSection');
  // bottoni
  const btnStat  = document.getElementById('btnStats');
  const btnList  = document.getElementById('btnList');
  // tabella/form
  const tblBody  = document.querySelector('#tbl-dipendenti tbody');
  const form     = document.getElementById('form-dip');

  // helper per mostrare/nascondere
  function show(sec) {
    [statsSec, listSec].forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }

  // NAV
  btnStat.addEventListener('click', () => {
    show(statsSec);
    loadStats();
  });
  btnList.addEventListener('click', () => {
    show(listSec);
    loadList();
  });

  // — Carica subito le STATISTICHE al primo accesso
  show(statsSec);
  loadStats();

  // — DIPENDENTI ——
  async function loadList() {
    const { data, error } = await supabase
      .from('application_specialists')
      .select('*')
      .order('id', { ascending: false });
    if (error) return console.error(error);
    tblBody.innerHTML = '';
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.nome}</td>
        <td>${r.cognome}</td>
        <td>${r.team}</td>
        <td>${r.ruolo}</td>
        <td>${r.sede}</td>
        <td>${r.contratto}</td>
        <td>${Array.isArray(r.ambito)? r.ambito.join(', '): r.ambito}</td>
        <td>${Array.isArray(r.clienti)? r.clienti.join(', '): r.clienti}</td>
        <td>${r.stato}</td>
        <td><button class="del-btn" data-id="${r.id}">✕</button></td>
      `;
      tr.querySelector('button').onclick = () => deleteAS(r.id);
      tblBody.appendChild(tr);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nuovo = {
      nome:      form['input-nome'].value.trim(),
      cognome:   form['input-cognome'].value.trim(),
      team:      form['input-team'].value.trim(),
      ruolo:     form['input-ruolo'].value.trim(),
      sede:      form['input-sede'].value.trim(),
      contratto: form['input-contratto'].value.trim(),
      ambito:    form['input-ambito'].value.split(',').map(s=>s.trim()),
      clienti:   form['input-clienti'].value.split(',').map(s=>s.trim()),
      stato:     form['input-stato'].value.trim()
    };
    const { error } = await supabase.from('application_specialists').insert(nuovo);
    if (error) return console.error(error);
    form.reset();
    loadList();
  });

  async function deleteAS(id) {
    await supabase.from('application_specialists').delete().eq('id', id);
    loadList();
  }

  // — STATISTICHE ——
  const charts = {};
  async function loadStats() {
    const { data, error } = await supabase
      .from('application_specialists')
      .select('sede,team,contratto,ambito,clienti');
    if (error) return console.error(error);

    const count = key => {
      const m = {};
      data.forEach(r => {
        const vals = Array.isArray(r[key]) ? r[key] : [r[key]];
        vals.forEach(v => { if (v) m[v] = (m[v]||0) + 1; });
      });
      return m;
    };

    // distruggi grafici precedenti
    Object.values(charts).forEach(c=>c.destroy());

    // helper per disegnare
    function draw(id, title, obj) {
      const ctx = document.getElementById(id).getContext('2d');
      const labels = Object.keys(obj);
      const vals   = Object.values(obj);
      const cols   = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`);
      charts[id] = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data: vals, backgroundColor: cols }] },
        options: {
          plugins: {
            title:  { display:true, text: title },
            legend: { position:'bottom', labels:{ color:'#eee' } }
          }
        }
      });
    }

    draw('chartSede',     `AS per Sede (${data.length})`,      count('sede'));
    draw('chartTeam',     `AS per Team (${data.length})`,      count('team'));
    draw('chartContratto',`AS per Contratto (${data.length})`, count('contratto'));
    draw('chartAmbito',   `AS per Ambito (${data.length})`,    count('ambito'));
    draw('chartClienti',  `AS per Clienti (${data.length})`,   count('clienti'));
  }
});