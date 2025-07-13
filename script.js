// ——— CONFIG SUPABASE ———
const supabaseUrl = 'https://fzbpucvscnfyimefrvzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YnB1Y3ZzY25meWltZWZydnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MjIwMDUsImV4cCI6MjA2Nzk5ODAwNX0.TmDOR-UnkeSkTnnEQuuYTHchmwfdNGO9rnrmXu9akuM';
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

// ——— ELEMENTI DOM ———
const btnStats = document.getElementById('btnStats');
const btnEmployees = document.getElementById('btnEmployees');
const secStats = document.getElementById('sectionStats');
const secEmp   = document.getElementById('sectionEmployees');
const tblBody  = document.querySelector('#tableEmployees tbody');
const formAdd  = document.getElementById('formAdd');

// ——— INIT ———
window.addEventListener('DOMContentLoaded', () => {
  // navigazione
  btnStats.addEventListener('click', () => showSection('stats'));
  btnEmployees.addEventListener('click', () => showSection('employees'));
  // form
  formAdd.addEventListener('submit', onAddEmployee);
  // apri di default Statistiche
  showSection('stats');
});

// mostra/nasconde sezioni
function showSection(name) {
  btnStats.classList.toggle('active', name==='stats');
  btnEmployees.classList.toggle('active', name==='employees');
  secStats.classList.toggle('active', name==='stats');
  secEmp.classList.toggle('active', name==='employees');
  if (name==='stats') loadStats();
  else loadEmployees();
}

// ——— DIPENDENTI ———
async function loadEmployees() {
  const { data, error } = await supabase
    .from('application_specialists')
    .select('*');
  if (error) return alert('Errore caricamento dipendenti.');
  tblBody.innerHTML = '';
  data.forEach(emp => {
    const tr = document.createElement('tr');
    ['nome','cognome','team','ruolo','sede','contratto','ambito','clienti','stato']
      .forEach(f => tr.innerHTML += `<td>${emp[f]||''}</td>`);
    const btn = document.createElement('button');
    btn.textContent = '❌';
    btn.classList.add('delete');
    btn.onclick = () => deleteEmployee(emp.id);
    tr.appendChild(btn);
    tblBody.appendChild(tr);
  });
}

async function onAddEmployee(evt) {
  evt.preventDefault();
  const vals = ['Nome','Cognome','Team','Ruolo','Sede','Contratto','Ambito','Clienti','Stato']
    .map((_,i)=>
      document.getElementById([
        'inpNome','inpCognome','inpTeam','inpRuolo',
        'inpSede','inpContratto','inpAmbito','inpClienti','inpStato'
      ][i]).value.trim()
    );
  const [nome,cognome,team,ruolo,sede,contratto,ambito,clienti,stato] = vals;
  const { error } = await supabase
    .from('application_specialists')
    .insert([{ nome,cognome,team,ruolo,sede,contratto,ambito,clienti,stato }]);
  if (error) return alert('Errore inserimento.');
  formAdd.reset();
  loadEmployees();
}

async function deleteEmployee(id) {
  await supabase.from('application_specialists').delete().eq('id', id);
  loadEmployees();
}

// ——— STATISTICHE ———
async function loadStats() {
  const { data, error } = await supabase
    .from('application_specialists')
    .select('sede,team,contratto,ambito,clienti');
  if (error) return alert('Errore statistiche.');
  // helper per raggruppare
  const group = (arr, prop) => {
    const m = {};
    arr.forEach(o => {
      let vals = o[prop] || '';
      if (prop==='ambito' || prop==='clienti') vals = vals.split(',').map(s=>s.trim());
      if (!Array.isArray(vals)) vals = [vals];
      vals.forEach(v => {
        if (!v) return;
        m[v] = (m[v]||0) + 1;
      });
    });
    return m;
  };
  // crea grafico
  function makeChart(id,title,map,colors) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(map),
        datasets: [{ data: Object.values(map), backgroundColor: colors }]
      },
      options: {
        plugins:{ title:{ display:true, text:`${title} (${Object.values(map).reduce((a,b)=>a+b,0)} AS)` } }
      }
    });
  }
  // mappe
  const mSede      = group(data,'sede');
  const mTeam      = group(data,'team');
  const mContratto = group(data,'contratto');
  const mAmbito    = group(data,'ambito');
  const mClienti   = group(data,'clienti');
  // palette base
  const palette = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#e67e22'];
  // disegna
  makeChart('chartSede','AS per Sede',mSede,palette);
  makeChart('chartTeam','AS per Team',mTeam,palette);
  makeChart('chartContratto','AS per Contratto',mContratto,palette);
  makeChart('chartAmbito','AS per Ambito',mAmbito,palette);
  makeChart('chartClienti','AS per Clienti',mClienti,palette);
}