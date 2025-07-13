// script.js

// ——— CONFIG SUPABASE ———
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ——— QUANDO IL DOM È PRONTO ———
document.addEventListener('DOMContentLoaded', () => {
  // Elementi
  const secStat = document.getElementById('statistiche');
  const secDip  = document.getElementById('dipendenti');
  const btnStat = document.getElementById('btn-statistiche');
  const btnDip  = document.getElementById('btn-dipendenti');
  const tblBody = document.querySelector('#tbl-dipendenti tbody');
  const formDip = document.getElementById('form-dip');

  // FUNZIONE: carica e mostra STATISTICHE
  async function caricaStatistiche() {
    const { data, error } = await supabase.from('application_specialists').select('*');
    if (error) {
      console.error('Fetch stats error', error);
      return;
    }
    // prepara i conteggi
    const conteggi = { sede:{},team:{},contratto:{},ambito:{},clienti:{} };
    data.forEach(d => {
      const conta = (oggetto, chiave) => oggetto[chiave] = (oggetto[chiave]||0)+1;
      conta(conteggi.sede,      d.sede);
      conta(conteggi.team,      d.team);
      conta(conteggi.contratto, d.contratto);
      d.ambito.split(',').map(a=>a.trim()).forEach(a=>conta(conteggi.ambito,a));
      d.clienti.split(',').map(a=>a.trim()).forEach(a=>conta(conteggi.clienti,a));
    });
    // distruggi vecchi grafici
    if (window._charts) window._charts.forEach(c=>c.destroy());
    window._charts = [];
    // helper per crearli
    const crea = (id,title,obj) => {
      const ctx = document.getElementById(id).getContext('2d');
      const labels = Object.keys(obj),
            vals   = Object.values(obj),
            cols   = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6'];
      const chart = new Chart(ctx,{
        type:'pie', data:{ labels, datasets:[{ data:vals, backgroundColor:cols }]},
        options:{
          plugins:{
            title:{ display:true, text:`AS per ${title} (${data.length})` },
            legend:{ position:'bottom', labels:{ color:'#ccc' } }
          }
        }
      });
      window._charts.push(chart);
    };
    crea('chart-sede','Sede',conteggi.sede);
    crea('chart-team','Team',conteggi.team);
    crea('chart-contratto','Contratto',conteggi.contratto);
    crea('chart-ambito','Ambito',conteggi.ambito);
    crea('chart-clienti','Clienti',conteggi.clienti);
  }

  // FUNZIONE: carica e mostra DIPENDENTI
  async function caricaDipendenti() {
    const { data, error } = await supabase.from('application_specialists').select('*').order('id');
    if (error) {
      console.error('Fetch dip error', error);
      return;
    }
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

  // SUBMIT FORM AGGIUNTA
  formDip.addEventListener('submit', async e => {
    e.preventDefault();
    const nuovo = {
      nome:      formDip['input-nome'].value,
      cognome:   formDip['input-cognome'].value,
      team:      formDip['input-team'].value,
      ruolo:     formDip['input-ruolo'].value,
      sede:      formDip['input-sede'].value,
      contratto: formDip['input-contratto'].value,
      ambito:    formDip['input-ambito'].value,
      clienti:   formDip['input-clienti'].value,
      stato:     formDip['input-stato'].value
    };
    const { error } = await supabase.from('application_specialists').insert(nuovo);
    if (error) console.error('Insert error', error);
    formDip.reset();
    caricaDipendenti();
  });

  // DELETE CLICK
  tblBody.addEventListener('click', async e => {
    if (!e.target.matches('.del-btn')) return;
    const id = e.target.dataset.id;
    await supabase.from('application_specialists').delete().eq('id', id);
    caricaDipendenti();
  });

  // NAV
  btnStat.addEventListener('click',()=>{
    secStat.classList.add('active');
    secDip.classList.remove('active');
    caricaStatistiche();
  });
  btnDip.addEventListener('click',()=>{
    secDip.classList.add('active');
    secStat.classList.remove('active');
    caricaDipendenti();
  });

  // Carica subito Statistiche
  btnStat.click();
});