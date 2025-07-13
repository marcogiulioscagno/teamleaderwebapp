document.addEventListener('DOMContentLoaded', () => {
  // === CONFIGURAZIONE SUPABASE ===
  const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
  const sb = supabase.createClient(supabaseUrl, supabaseKey);

  // === SELEZIONE SEZIONI ===
  const homeSec  = document.getElementById('homeSection');
  const listSec  = document.getElementById('listSection');
  const statsSec = document.getElementById('statsSection');

  // === NAV ===
  document.getElementById('btnHome').onclick  = () => show(homeSec);
  document.getElementById('btnList').onclick  = () => { show(listSec); loadList(); };
  document.getElementById('btnStats').onclick = () => { show(statsSec); loadStats(); };

  function show(sec) {
    [homeSec, listSec, statsSec].forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }
  show(homeSec);

  // === ELENCO AS ===
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
    const { data, error } = await sb
      .from('application_specialists')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return alert(error.message);
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.nome}</td><td>${r.cognome}</td><td>${r.team}</td><td>${r.ruolo}</td>
        <td>${r.sede}</td><td>${r.contratto}</td>
        <td>${Array.isArray(r.ambito)? r.ambito.join(', '): r.ambito}</td>
        <td>${Array.isArray(r.clienti)? r.clienti.join(', '): r.clienti}</td>
        <td>${r.stato}</td>
        <td><button data-id="${r.id}">X</button></td>
      `;
      tr.querySelector('button').onclick = () => deleteAS(r.id);
      listBody.appendChild(tr);
    });
  }

  async function addAS() {
    const nuovo = {
      nome:       inName.value.trim(),
      cognome:    inSurname.value.trim(),
      team:       inTeam.value.trim(),
      ruolo:      inRole.value.trim(),
      sede:       inSede.value.trim(),
      contratto:  inContract.value.trim(),
      ambito:     inAmbito.value.trim().split(',').map(s=>s.trim()).filter(s=>s),
      clienti:    inClients.value.trim().split(',').map(s=>s.trim()).filter(s=>s),
      stato:      inState.value.trim()
    };
    const { error } = await sb.from('application_specialists').insert(nuovo);
    if (error) return alert(error.message);
    [inName,inSurname,inTeam,inRole,inSede,inContract,inAmbito,inClients,inState]
      .forEach(i=>i.value='');
    loadList();
  }

  async function deleteAS(id) {
    if (!confirm('Eliminare questo AS?')) return;
    const { error } = await sb.from('application_specialists').delete().eq('id', id);
    if (error) return alert(error.message);
    loadList();
  }

  // === STATISTICHE ===
  const chartMap = {};
  async function loadStats() {
    const { data, error } = await sb
      .from('application_specialists')
      .select('sede,team,contratto,ambito,clienti');
    if (error) return alert(error.message);

    const count = (key) => {
      const m = {};
      data.forEach(r => {
        const vals = Array.isArray(r[key]) ? r[key] : [r[key]];
        vals.forEach(v => { if (v) m[v] = (m[v]||0)+1; });
      });
      return m;
    };

    renderPie('chartSede',     'AS per Sede',      count('sede'));
    renderPie('chartTeam',     'AS per Team',      count('team'));
    renderPie('chartContract', 'AS per Contratto', count('contratto'));
    renderPie('chartAmbito',   'AS per Ambito',    count('ambito'));
    renderPie('chartClients',  'AS per Clienti',   count('clienti'));
  }

  function renderPie(id, title, dataObj) {
    const ctx = document.getElementById(id).getContext('2d');
    if (chartMap[id]) chartMap[id].destroy();
    const labels = Object.keys(dataObj);
    const data   = Object.values(dataObj);
    const colors = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`);
    chartMap[id] = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { plugins:{ title:{ display:true,text:title }, legend:{ position:'bottom' } } }
    });
  }
});