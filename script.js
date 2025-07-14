document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG SUPABASE ===
  const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
  const sb = supabase.createClient(supabaseUrl, supabaseKey);

  // === SEZIONI & BOTTONI NAV ===
  const homeSec  = document.getElementById('homeSection');
  const listSec  = document.getElementById('listSection');
  const statsSec = document.getElementById('statsSection');
  const btnStats = document.getElementById('btnStats');
  const btnList  = document.getElementById('btnList');
  const btnReport= document.getElementById('btnReport');
  const listBody = document.getElementById('listBody');
  const chartMap = {};

  function show(sec) {
    [homeSec, listSec, statsSec].forEach(s => s.classList.add('hidden'));
    sec.classList.remove('hidden');
  }

  // NAVIGAZIONE
  btnStats.onclick  = () => { show(statsSec);  loadStats();  };
  btnList.onclick   = () => { show(listSec);   loadList();   };
  btnReport.onclick = () => { show(statsSec);  generateReport(); };

  // default: STATISTICHE
  btnStats.click();

  // === DIPENDENTI (CRUD) ===
  document.getElementById('btnAdd').onclick = async () => {
    const nuovo = {
      nome:      document.getElementById('inName').value.trim(),
      cognome:   document.getElementById('inSurname').value.trim(),
      team:      document.getElementById('inTeam').value.trim(),
      ruolo:     document.getElementById('inRole').value.trim(),
      sede:      document.getElementById('inSede').value.trim(),
      contratto: document.getElementById('inContract').value.trim(),
      ambito:    document.getElementById('inAmbito').value.split(',').map(s=>s.trim()).filter(s=>s),
      clienti:   document.getElementById('inClients').value.split(',').map(s=>s.trim()).filter(s=>s),
      stato:     document.getElementById('inState').value.trim()
    };
    const { error } = await sb.from('application_specialists').insert(nuovo);
    if (error) return alert(error.message);
    document.querySelectorAll('.form-row input').forEach(i=>i.value='');
    loadList();
  };

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
        <td>${r.nome}</td><td>${r.cognome}</td><td>${r.team}</td>
        <td>${r.ruolo}</td><td>${r.sede}</td><td>${r.contratto}</td>
        <td>${Array.isArray(r.ambito)? r.ambito.join(', '): r.ambito}</td>
        <td>${Array.isArray(r.clienti)? r.clienti.join(', '): r.clienti}</td>
        <td>${r.stato}</td>
        <td><button data-id="${r.id}">X</button></td>`;
      tr.querySelector('button').onclick = () => deleteAS(r.id);
      listBody.appendChild(tr);
    });
  }

  async function deleteAS(id) {
    if (!confirm('Eliminare questo AS?')) return;
    const { error } = await sb.from('application_specialists').delete().eq('id', id);
    if (error) return alert(error.message);
    loadList();
  }

  // === STATISTICHE (Chart) ===
  async function loadStats() {
    const { data, error } = await sb
      .from('application_specialists')
      .select('sede,team,contratto,ambito,clienti');
    if (error) return alert(error.message);

    const count = key => {
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
    const labels = Object.keys(dataObj),
          vals   = Object.values(dataObj),
          cols   = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`);
    chartMap[id] = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: vals, backgroundColor: cols }] },
      options: {
        plugins: {
          title:  { display:true, text:title },
          legend: { position:'bottom' }
        }
      }
    });
  }

  // === GENERAZIONE REPORT PDF ===
  async function generateReport() {
    // ricarica statistiche
    await loadStats();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    const canvases = ['chartSede','chartTeam','chartContract','chartAmbito','chartClients'];
    const m = 20;
    const w = pdf.internal.pageSize.getWidth() - m*2;
    let y = m;

    canvases.forEach((id, i) => {
      const chart = chartMap[id];
      if (!chart) return;
      const img = chart.toBase64Image();
      const h = chart.canvas.height * (w / chart.canvas.width);
      if (i>0) { pdf.addPage(); y = m; }
      pdf.addImage(img, 'PNG', m, y, w, h);
      y += h + m;
    });

    pdf.save('report_statistiche.pdf');
  }
});