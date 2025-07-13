document.addEventListener('DOMContentLoaded', () => {
  // 1) Inizializza Supabase
  const SUPABASE_URL     = 'https://db.fzbpucvscnfiyimefrvzs.supabase.co';
  const SUPABASE_ANON_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
  const supabaseClient   = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 2) Navigation
  document.querySelectorAll('nav button').forEach(btn => {
    btn.onclick = () => showSection(btn.dataset.section);
  });
  function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => {
      sec.id === id ? sec.classList.remove('hidden') : sec.classList.add('hidden');
    });
    if (id === 'list')  loadList();
    if (id === 'stats') loadStats();
  }

  // 3) ELENCO AS
  const form = document.getElementById('as-form');
  form.onsubmit = addAs;

  async function loadList() {
    const { data, error } = await supabaseClient
      .from('application_specialists')
      .select('*')
      .order('nome');
    if (error) return alert(error.message);
    const tbody = document.querySelector('#as-table tbody');
    tbody.innerHTML = '';
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.nome}</td><td>${r.cognome}</td>
        <td>${r.team}</td><td>${r.ruolo}</td>
        <td>${r.sede}</td><td>${r.contratto}</td>
        <td>${r.ambito}</td><td>${r.clienti}</td><td>${r.stato}</td>
        <td><button data-id="${r.id}">❌</button></td>
      `;
      tr.querySelector('button').onclick = async e => {
        await supabaseClient
          .from('application_specialists')
          .delete()
          .eq('id', e.target.dataset.id);
        loadList();
      };
      tbody.appendChild(tr);
    });
  }

  async function addAs(evt) {
    evt.preventDefault();
    const row = {
      nome:      form.nome.value.trim(),
      cognome:   form.cognome.value.trim(),
      team:      form.team.value.trim(),
      ruolo:     form.ruolo.value.trim(),
      sede:      form.sede.value.trim(),
      contratto: form.contratto.value.trim(),
      ambito:    form.ambito.value.trim(),
      clienti:   form.clienti.value.trim(),
      stato:     form.stato.value.trim()
    };
    const { error } = await supabaseClient
      .from('application_specialists')
      .insert(row);
    if (error) return alert(error.message);
    form.reset();
    loadList();
  }

  // 4) STATISTICHE
  async function loadStats() {
    const { data, error } = await supabaseClient
      .from('application_specialists')
      .select('sede,team,contratto,ambito,clienti');
    if (error) return alert(error.message);

    const groupCount = (arr, key) => {
      const m = {};
      arr.forEach(r => {
        const items = (r[key]||'').split(',').map(s=>s.trim()).filter(Boolean);
        (items.length ? items : ['‹nessuno›']).forEach(v => m[v] = (m[v]||0)+1);
      });
      return m;
    };

    const counts = {
      sede:      groupCount(data,'sede'),
      team:      groupCount(data,'team'),
      contratto: groupCount(data,'contratto'),
      ambito:    groupCount(data,'ambito'),
      clienti:   groupCount(data,'clienti')
    };

    drawPie('chart-sede',      'AS per Sede',      counts.sede);
    drawPie('chart-team',      'AS per Team',      counts.team);
    drawPie('chart-contratto', 'AS per Contratto', counts.contratto);
    drawPie('chart-ambito',    'AS per Ambito',    counts.ambito);
    drawPie('chart-clienti',   'AS per Clienti',   counts.clienti);
  }

  function drawPie(id,title,dataObj) {
    const ctx    = document.getElementById(id).getContext('2d');
    const labels = Object.keys(dataObj);
    const data   = Object.values(dataObj);
    const colors = labels.map(_=>`hsl(${Math.random()*360},60%,60%)`);
    new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets:[{ data, backgroundColor: colors }] },
      options: { plugins:{ legend:{ position:'bottom' }, title:{ display:true, text:title } } }
    });
  }

  // all’avvio
  showSection('home');
});