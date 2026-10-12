// ===== Tarefas (usa o login e o cliente criados no store.js) =====
(()=>{
const C=window.AlyaCore,sec=document.getElementById('s-tarefas');
if(!C||!sec)return;
const {sb,el,btn,emsg}=C;
let sess=null,tasks=[],projs=[],view={n:'list'},filt='pend',pf='',q='',state='load',msg='',busy=false;
const PR={alta:'Alta',media:'Média',baixa:'Baixa'};
const RANK={alta:0,media:1,baixa:2};
const STT={pendente:'Pendente',concluida:'Concluída',cancelada:'Cancelada'};
const FILT=[['pend','Pendentes'],['atras','Atrasadas'],['conc','Concluídas'],['canc','Canceladas'],['todas','Todas']];
const uid=()=>crypto.randomUUID();
const pad=n=>String(n).padStart(2,'0');
const toLocal=s=>{const d=new Date(s);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fmt=s=>new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const late=t=>t.status==='pendente'&&t.due_at&&new Date(t.due_at)<new Date();
const ok=r=>{if(r&&r.error)throw r.error;return r};
const pname=id=>{const p=projs.find(x=>x.id===id);return p?p.name:''};

async function load(){
  sess=C.session();
  if(!sb||!sess){state='out';render();return}
  state='load';render();
  try{
    const [t,p]=await Promise.all([
      sb.from('tasks').select('id,project_id,title,description,priority,due_at,status,completed_at,created_at').is('deleted_at',null),
      sb.from('projects').select('id,name,status').is('deleted_at',null).order('name',{ascending:true})]);
    if(t.error)throw t.error;if(p.error)throw p.error;
    tasks=t.data||[];projs=p.data||[];state='ok';
    if(view.n==='form'&&view.id&&!tasks.some(x=>x.id===view.id))view={n:'list'};
  }catch(e){state='err';msg=emsg(e)}
  render();
}
async function run(f,okmsg){if(busy)return;busy=true;try{await f();msg=okmsg||'';C.bus.emit('tasks','tarefas')}catch(e){msg=(e&&e.code==='23505')?'Já estava salva.':emsg(e)}busy=false;await load()}
const setStatus=(t,s,m)=>run(async()=>ok(await sb.from('tasks').update({status:s,completed_at:s==='concluida'?new Date().toISOString():null}).eq('id',t.id)),m);

function render(){
  sec.textContent='';
  sec.appendChild(el('h2','','Tarefas'));
  if(!sb||state==='out'||!sess){sec.appendChild(el('p','note','Entre na conta (tela Memória) para criar e acompanhar suas tarefas.'));return}
  if(state==='load'){sec.appendChild(el('p','note','Carregando…'));return}
  if(state==='err'){sec.appendChild(el('p','note',msg));sec.appendChild(btn('Tentar de novo',load));return}
  if(msg)sec.appendChild(el('p','note',msg));
  view.n==='form'?form():list();
}

function sortTasks(a,b){
  const la=late(a)?0:1,lb=late(b)?0:1;if(la!==lb)return la-lb;
  const da=a.due_at?new Date(a.due_at).getTime():Infinity,db=b.due_at?new Date(b.due_at).getTime():Infinity;
  if(la===0&&da!==db)return da-db;
  if(RANK[a.priority]!==RANK[b.priority])return RANK[a.priority]-RANK[b.priority];
  if(da!==db)return da-db;
  return new Date(a.created_at)-new Date(b.created_at);
}

function list(){
  const top=el('div','row');
  const i=el('input','');i.type='search';i.placeholder='Buscar tarefas';i.value=q;i.setAttribute('aria-label','Buscar tarefas');
  top.append(i,btn('Nova tarefa',()=>{view={n:'form',cid:uid()};msg='';render()}));sec.appendChild(top);
  const fr=el('div','row');
  FILT.forEach(([k,t])=>{const n=k==='atras'?tasks.filter(late).length:0;const b=btn(t+(k==='atras'&&n?' ('+n+')':''),()=>{filt=k;render()});b.setAttribute('aria-pressed',filt===k);fr.appendChild(b)});
  sec.appendChild(fr);
  const sel=el('select','');sel.setAttribute('aria-label','Filtrar por projeto');
  const o0=el('option','','Todos os projetos');o0.value='';sel.appendChild(o0);
  projs.forEach(p=>{const o=el('option','',p.name);o.value=p.id;sel.appendChild(o)});sel.value=pf;
  sel.onchange=()=>{pf=sel.value;fill()};sec.appendChild(sel);
  const box=el('div','mems');sec.appendChild(box);
  const fill=()=>{
    box.textContent='';
    const s=q.trim().toLowerCase();
    const items=tasks.filter(t=>(filt==='todas'||(filt==='pend'&&t.status==='pendente')||(filt==='atras'&&late(t))||(filt==='conc'&&t.status==='concluida')||(filt==='canc'&&t.status==='cancelada'))
      &&(!pf||t.project_id===pf)&&(!s||[t.title,t.description,pname(t.project_id)].some(x=>(x||'').toLowerCase().includes(s)))).sort(sortTasks);
    if(!items.length)box.appendChild(el('p','note',tasks.length?'Nenhuma tarefa encontrada.':'Nenhuma tarefa ainda. Toque em "Nova tarefa".'));
    items.forEach(t=>{
      const c=el('div','card');
      const h=el('div','row');
      h.append(el('h3',t.status!=='pendente'?'dim':'',t.title),el('span','badge',PR[t.priority]));
      if(late(t))h.appendChild(el('span','badge late','Atrasada'));
      if(t.status!=='pendente')h.appendChild(el('span','badge',STT[t.status]));
      c.appendChild(h);
      if(t.due_at)c.appendChild(el('p','note','Prazo: '+fmt(t.due_at)));
      if(t.project_id&&pname(t.project_id))c.appendChild(el('p','note','Projeto: '+pname(t.project_id)));
      if(t.description)c.appendChild(el('p','mt',t.description));
      const r=el('div','row');
      if(t.status==='pendente'){
        r.append(btn('Concluir',()=>setStatus(t,'concluida','Tarefa concluída.')),
          btn('Editar',()=>{view={n:'form',id:t.id};msg='';render()}),
          btn('Cancelar tarefa',()=>{if(confirm('Cancelar esta tarefa?'))setStatus(t,'cancelada','Tarefa cancelada.')}));
      }else r.append(btn('Reabrir',()=>setStatus(t,'pendente','Tarefa reaberta.')));
      c.appendChild(r);box.appendChild(c)});
  };
  i.oninput=()=>{q=i.value;fill()};fill();
}

function form(){
  const t=view.id?tasks.find(x=>x.id===view.id):null;
  sec.appendChild(el('h3','',t?'Editar tarefa':'Nova tarefa'));
  const f=el('form','');
  const fld=(lbl,node)=>{const l=el('label','fld',lbl);l.appendChild(node);f.appendChild(l);return node};
  const title=fld('Título',el('input',''));title.maxLength=200;title.required=true;title.value=t?t.title:'';
  const desc=fld('Descrição',el('textarea',''));desc.rows=3;desc.maxLength=2000;desc.value=t&&t.description||'';
  const pr=fld('Prioridade',el('select',''));Object.entries(PR).forEach(([k,n])=>{const o=el('option','',n);o.value=k;pr.appendChild(o)});pr.value=t?t.priority:'media';
  const due=fld('Prazo (opcional)',el('input',''));due.type='datetime-local';due.value=t&&t.due_at?toLocal(t.due_at):'';
  const pj=fld('Projeto (opcional)',el('select',''));const n0=el('option','','Sem projeto');n0.value='';pj.appendChild(n0);
  projs.filter(p=>p.status!=='arquivado'||(t&&t.project_id===p.id)).forEach(p=>{const o=el('option','',p.name);o.value=p.id;pj.appendChild(o)});pj.value=t&&t.project_id||'';
  const r=el('div','row');const s=el('button','','Salvar');s.type='submit';r.append(s,btn('Cancelar',()=>{view={n:'list'};render()}));f.appendChild(r);
  f.onsubmit=ev=>{ev.preventDefault();
    const v={title:title.value.trim(),description:desc.value.trim()||null,priority:pr.value,due_at:due.value?new Date(due.value).toISOString():null,project_id:pj.value||null};
    if(!v.title)return;
    if(!t)run(async()=>{ok(await sb.from('tasks').insert({client_id:view.cid,...v}));view={n:'list'}},'Tarefa criada.');
    else run(async()=>{ok(await sb.from('tasks').update(v).eq('id',t.id));view={n:'list'}},'Tarefa atualizada.')};
  sec.appendChild(f);
}

C.bus.on('tasks',src=>{if(src!=='tarefas')load()});
C.onAuth(load);
})();
