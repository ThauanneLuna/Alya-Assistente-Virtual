// ===== Projetos (usa o login e o cliente criados no store.js) =====
(()=>{
const C=window.AlyaCore,sec=document.getElementById('s-projetos');
if(!C||!sec)return;
const {sb,el,btn,emsg}=C;
let sess=null,projs=[],notes=[],hist=[],view={n:'list'},filt='ativos',q='',state='load',msg='',busy=false;
const ST={ativo:'Ativo',pausado:'Pausado',concluido:'Concluído',arquivado:'Arquivado'};
const KIND={decisao:'Decisões confirmadas',ideia:'Ideias provisórias',referencia:'Referências',pendencia:'Pendências'};
const ONE={decisao:'Decisão',ideia:'Ideia',referencia:'Referência',pendencia:'Pendência'};
const FILT=[['ativos','Ativos'],['concluidos','Concluídos'],['arquivados','Arquivados'],['todos','Todos']];
const uid=()=>crypto.randomUUID();
const short=(t,n=80)=>t.length>n?t.slice(0,n)+'…':t;

async function load(){
  sess=C.session();
  if(!sb||!sess){state='out';render();return}
  state='load';render();
  try{
    const [p,n]=await Promise.all([
      sb.from('projects').select('id,name,description,goal,status,updated_at').is('deleted_at',null).order('updated_at',{ascending:false}),
      sb.from('project_notes').select('id,project_id,kind,content,resolved,created_at').is('deleted_at',null).order('created_at',{ascending:true})]);
    if(p.error)throw p.error;if(n.error)throw n.error;
    projs=p.data||[];notes=n.data||[];state='ok';
    if(view.n==='detail'){if(projs.some(x=>x.id===view.id))await loadHist();else view={n:'list'}}
  }catch(e){state='err';msg=emsg(e)}
  render();
}
async function loadHist(){const r=await sb.from('project_history').select('summary,created_at').eq('project_id',view.id).order('created_at',{ascending:false}).limit(30);hist=r.data||[]}
async function run(f,ok){if(busy)return;busy=true;try{await f();msg=ok||''}catch(e){msg=(e&&e.code==='23505')?'Já estava salvo.':emsg(e)}busy=false;await load()}
const log=async(pid,t)=>{try{await sb.from('project_history').insert({project_id:pid,summary:String(t).slice(0,500)})}catch(e){}};
const touch=async p=>{try{await sb.from('projects').update({status:p.status}).eq('id',p.id)}catch(e){}};
const cur=()=>projs.find(x=>x.id===view.id);
const ok=r=>{if(r&&r.error)throw r.error;return r};

function render(){
  sec.textContent='';
  sec.appendChild(el('h2','','Projetos'));
  if(!sb||state==='out'||!sess){sec.appendChild(el('p','note','Entre na conta (tela Memória) para criar e consultar seus projetos.'));return}
  if(state==='load'){sec.appendChild(el('p','note','Carregando…'));return}
  if(state==='err'){sec.appendChild(el('p','note',msg));sec.appendChild(btn('Tentar de novo',load));return}
  if(msg)sec.appendChild(el('p','note',msg));
  if(view.n==='form')return form();
  if(view.n==='detail'&&cur())return detail(cur());
  list();
}

function list(){
  const top=el('div','row');
  const i=el('input','');i.type='search';i.placeholder='Buscar projetos';i.value=q;i.setAttribute('aria-label','Buscar projetos');
  top.append(i,btn('Novo projeto',()=>{view={n:'form',cid:uid()};msg='';render()}));sec.appendChild(top);
  const fr=el('div','row');
  FILT.forEach(([k,t])=>{const b=btn(t,()=>{filt=k;render()});b.setAttribute('aria-pressed',filt===k);fr.appendChild(b)});
  sec.appendChild(fr);
  const box=el('div','mems');sec.appendChild(box);
  const fill=()=>{
    box.textContent='';
    const s=q.trim().toLowerCase();
    const items=projs.filter(p=>(filt==='todos'||(filt==='ativos'?(p.status==='ativo'||p.status==='pausado'):filt==='concluidos'?p.status==='concluido':p.status==='arquivado'))
      &&(!s||[p.name,p.description,p.goal].some(x=>(x||'').toLowerCase().includes(s))||notes.some(n=>n.project_id===p.id&&n.content.toLowerCase().includes(s))));
    if(!items.length)box.appendChild(el('p','note',projs.length?'Nenhum projeto encontrado.':'Nenhum projeto ainda. Toque em "Novo projeto".'));
    items.forEach(p=>{
      const c=el('div','card');
      const h=el('div','row');h.append(el('h3','',p.name),el('span','badge',ST[p.status]));c.appendChild(h);
      if(p.description)c.appendChild(el('p','mt',short(p.description,140)));
      const nn=notes.filter(n=>n.project_id===p.id);
      c.appendChild(el('p','note',nn.filter(n=>n.kind==='decisao').length+' decisões · '+nn.filter(n=>n.kind==='pendencia'&&!n.resolved).length+' pendências abertas'));
      c.appendChild(btn('Abrir',async()=>{view={n:'detail',id:p.id};await loadHist();render()}));
      box.appendChild(c)});
  };
  i.oninput=()=>{q=i.value;fill()};fill();
}

function form(){
  const p=view.id?cur():null;
  sec.appendChild(el('h3','',p?'Editar projeto':'Novo projeto'));
  const f=el('form','');
  const fld=(lbl,node)=>{const l=el('label','fld',lbl);l.appendChild(node);f.appendChild(l);return node};
  const name=fld('Nome',el('input',''));name.maxLength=120;name.required=true;name.value=p?p.name:'';
  const goal=fld('Objetivo',el('textarea',''));goal.rows=2;goal.maxLength=1000;goal.value=p&&p.goal||'';
  const desc=fld('Descrição',el('textarea',''));desc.rows=4;desc.maxLength=2000;desc.value=p&&p.description||'';
  const st=fld('Status',el('select',''));Object.entries(ST).forEach(([k,t])=>{const o=el('option','',t);o.value=k;st.appendChild(o)});st.value=p?p.status:'ativo';
  const r=el('div','row');const s=el('button','','Salvar');s.type='submit';r.append(s,btn('Cancelar',()=>{view=p?{n:'detail',id:p.id}:{n:'list'};render()}));f.appendChild(r);
  f.onsubmit=ev=>{ev.preventDefault();const v={name:name.value.trim(),goal:goal.value.trim()||null,description:desc.value.trim()||null,status:st.value};if(!v.name)return;
    if(!p)run(async()=>{const d=ok(await sb.from('projects').insert({client_id:view.cid,...v}).select('id').single()).data;await log(d.id,'Projeto criado.');view={n:'detail',id:d.id}},'Projeto criado.');
    else run(async()=>{const ch=[];if(v.name!==p.name)ch.push('nome');if(v.goal!==(p.goal||null))ch.push('objetivo');if(v.description!==(p.description||null))ch.push('descrição');
      ok(await sb.from('projects').update(v).eq('id',p.id));
      if(v.status!==p.status)await log(p.id,'Status: '+ST[p.status]+' → '+ST[v.status]);
      if(ch.length)await log(p.id,'Atualizou '+ch.join(', ')+'.');view={n:'detail',id:p.id}},'Projeto atualizado.')};
  sec.appendChild(f);
}

function detail(p){
  const top=el('div','row');top.append(btn('← Projetos',()=>{view={n:'list'};msg='';render()}));sec.appendChild(top);
  const h=el('div','row');h.append(el('h3','',p.name),el('span','badge',ST[p.status]));sec.appendChild(h);
  if(p.goal)sec.appendChild(el('p','mt','Objetivo: '+p.goal));
  if(p.description)sec.appendChild(el('p','note',p.description));
  const ac=el('div','row');
  ac.append(btn('Editar',()=>{view={n:'form',id:p.id};msg='';render()}),
    btn(p.status==='arquivado'?'Reativar':'Arquivar',()=>run(async()=>{const ns=p.status==='arquivado'?'ativo':'arquivado';ok(await sb.from('projects').update({status:ns}).eq('id',p.id));await log(p.id,'Status: '+ST[p.status]+' → '+ST[ns])},p.status==='arquivado'?'Projeto reativado.':'Projeto arquivado.')));
  sec.appendChild(ac);
  Object.keys(KIND).forEach(k=>{
    const ns=notes.filter(n=>n.project_id===p.id&&n.kind===k);
    sec.appendChild(el('h3','',KIND[k]+' ('+ns.length+')'));
    const box=el('div','mems');
    if(!ns.length)box.appendChild(el('p','note','Nada registrado.'));
    ns.forEach(n=>{
      const c=el('div','card');
      const t=el('p','mt'+(n.resolved?' dim':''),'');
      if(k==='referencia'&&/^https?:\/\/\S+$/.test(n.content)){const a=el('a','',n.content);a.href=n.content;a.target='_blank';a.rel='noopener noreferrer';t.appendChild(a)}else t.textContent=(n.resolved?'✓ ':'')+n.content;
      c.appendChild(t);
      const r=el('div','row');
      if(k==='ideia')r.appendChild(btn('Confirmar como decisão',()=>run(async()=>{ok(await sb.from('project_notes').update({kind:'decisao'}).eq('id',n.id));await log(p.id,'Ideia confirmada como decisão: '+short(n.content));await touch(p)},'Virou decisão confirmada.')));
      if(k==='pendencia')r.appendChild(btn(n.resolved?'Reabrir':'Concluir',()=>run(async()=>{ok(await sb.from('project_notes').update({resolved:!n.resolved}).eq('id',n.id));await log(p.id,(n.resolved?'Pendência reaberta: ':'Pendência concluída: ')+short(n.content));await touch(p)})));
      r.append(btn('Editar',()=>{const v=prompt('Editar:',n.content);if(v===null)return;const x=v.trim();if(!x||x===n.content)return;
        run(async()=>{ok(await sb.from('project_notes').update({content:x.slice(0,2000)}).eq('id',n.id));await log(p.id,ONE[k]+' editada: '+short(x));await touch(p)},'Atualizado.')}),
        btn('Remover',()=>{if(!confirm('Remover este item? O texto será apagado.'))return;
        run(async()=>{ok(await sb.from('project_notes').update({content:'-',deleted_at:new Date().toISOString()}).eq('id',n.id));await log(p.id,ONE[k]+' removida.');await touch(p)},'Removido.')}));
      c.appendChild(r);box.appendChild(c)});
    sec.appendChild(box);
    const f=el('form','row');const i=el('input','');i.placeholder='Adicionar em '+KIND[k].toLowerCase();i.maxLength=2000;i.setAttribute('aria-label','Adicionar em '+KIND[k]);
    const a=el('button','','Adicionar');a.type='submit';f.append(i,a);
    f.onsubmit=ev=>{ev.preventDefault();const x=i.value.trim();if(!x)return;
      run(async()=>{ok(await sb.from('project_notes').insert({project_id:p.id,kind:k,content:x,client_id:uid()}));await log(p.id,ONE[k]+' adicionada: '+short(x));await touch(p)},'Adicionado.')};
    sec.appendChild(f);
  });
  sec.appendChild(el('h3','','Tarefas'));
  sec.appendChild(el('p','note','As tarefas ligadas a este projeto aparecem aqui quando a tela de Tarefas estiver pronta.'));
  const d=el('details','');d.appendChild(el('summary','','Histórico de alterações ('+hist.length+')'));
  hist.forEach(x=>d.appendChild(el('p','note',new Date(x.created_at).toLocaleString('pt-BR')+' · '+x.summary)));
  sec.appendChild(d);
}

C.onAuth(load);
})();
