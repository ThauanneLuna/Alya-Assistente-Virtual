// ===== Conta e memória (Supabase) =====
// A chave abaixo é a chave pública (publishable). Ela é feita para ficar no navegador; a proteção dos dados vem das regras RLS do banco.
(()=>{
const SB_URL='https://oqneikeqhgmyagjhvldq.supabase.co';
const SB_KEY='sb_publishable_g1-cnLvyylgv6i2TjPIMDQ_gMcdHp42';
const sec=document.getElementById('s-memoria');
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let sess=null,mem=[],enabled=true,state='load',msg='',busy=false;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const btn=(t,f,o={})=>{const b=el('button','',t);b.type='button';b.onclick=f;if(o.label)b.setAttribute('aria-label',o.label);return b};
const emsg=e=>{const m=String((e&&e.message)||e||'');return /duplicate|unique|23505/i.test(m)?'Essa informação já está salva.':/JWT|expired|401/i.test(m)?'Sua sessão expirou. Entre de novo.':/fetch|network|Failed/i.test(m)?'Sem conexão com o servidor. Tente de novo.':'Não consegui concluir. Tente de novo.'};

async function load(){
  if(!sb||!sess){mem=[];state='out';render();return}
  state='load';render();
  try{
    let {data:s,error:e1}=await sb.from('settings').select('memory_enabled').maybeSingle();
    if(e1)throw e1;
    if(!s){const r=await sb.from('settings').insert({}).select('memory_enabled').single();if(r.error)throw r.error;s=r.data}
    enabled=s.memory_enabled;
    const {data,error}=await sb.from('memories').select('id,content,version,updated_at').eq('status','ativa').is('deleted_at',null).order('updated_at',{ascending:false});
    if(error)throw error;
    mem=data||[];state='ok';msg='';
  }catch(e){state='err';msg=emsg(e)}
  render();
}
async function run(f,ok){if(busy)return;busy=true;try{await f();msg=ok||''}catch(e){msg=emsg(e)}busy=false;await load()}

function render(){
  if(!sec)return;
  sec.textContent='';
  const note=t=>sec.appendChild(el('p','note',t));
  if(!sb){sec.append(el('p','badge','Indisponível'));note('Não consegui carregar o serviço de contas. Verifique a conexão e recarregue a página.');return}
  if(state==='out'||!sess){
    sec.appendChild(el('h2','','Entrar'));
    note('Você conversa com a Alya sem conta. A conta serve só para guardar a memória (e, depois, projetos, tarefas e agenda) com segurança.');
    const f=el('form','row');const i=el('input','','');i.type='email';i.placeholder='seu e-mail';i.required=true;i.autocomplete='email';i.setAttribute('aria-label','Seu e-mail');
    const go=el('button','','Enviar link de entrada');go.type='submit';f.append(i,go);
    f.onsubmit=async ev=>{ev.preventDefault();go.disabled=true;
      const {error}=await sb.auth.signInWithOtp({email:i.value.trim(),options:{emailRedirectTo:location.origin+location.pathname}});
      msg=error?'Não consegui enviar o e-mail ('+(error.status===429?'muitos pedidos, espere um pouco':'tente de novo')+').':'Enviamos um link para '+i.value.trim()+'. Abra no mesmo aparelho e navegador.';render()};
    sec.appendChild(f);if(msg)sec.appendChild(el('p','note',msg));return}
  const top=el('div','row');top.append(el('span','badge','Conta: '+(sess.user.email||'conectada')),btn('Sair',async()=>{await sb.auth.signOut()}));sec.appendChild(top);
  if(state==='load'){note('Carregando…');return}
  if(state==='err'){note(msg);sec.appendChild(btn('Tentar de novo',load));return}
  sec.appendChild(el('h2','','Memória de longo prazo'));
  const tg=el('button','',enabled?'Memória ligada':'Memória desligada');tg.type='button';tg.setAttribute('aria-pressed',enabled);
  tg.onclick=()=>run(async()=>{const {error}=await sb.from('settings').update({memory_enabled:!enabled}).eq('user_id',sess.user.id);if(error)throw error},!enabled?'Memória ligada.':'Memória desligada. A Alya não usa nem sugere memórias.');
  sec.appendChild(el('div','row')).appendChild(tg);
  note('A Alya só guarda algo depois que você confirmar. As conversas continuam sem ser salvas.');
  if(msg)sec.appendChild(el('p','note',msg));
  if(enabled){
    const f=el('form','row');const i=el('input','','');i.placeholder='Adicionar uma informação';i.maxLength=1000;i.setAttribute('aria-label','Nova memória');
    const a=el('button','','Salvar');a.type='submit';f.append(i,a);
    f.onsubmit=ev=>{ev.preventDefault();const v=i.value.trim();if(!v)return;run(async()=>{const {error}=await sb.from('memories').insert({content:v});if(error)throw error},'Salvo.')};
    sec.appendChild(f)}
  sec.appendChild(el('h2','','Salvo ('+mem.length+')'));
  if(!mem.length)note('Nada salvo ainda.');
  const box=el('div','mems');
  mem.forEach(m=>{const c=el('div','card');c.appendChild(el('p','mt',m.content));
    const r=el('div','row');
    r.append(btn('Corrigir',()=>{const n=prompt('Corrigir informação:',m.content);if(n===null)return;const v=n.trim();if(!v||v===m.content)return;
      run(async()=>{const {error}=await sb.rpc('replace_memory',{p_old:m.id,p_content:v});if(error)throw error},'Corrigido.')}),
      btn('Excluir',()=>{if(!confirm('Excluir esta memória? O texto será apagado.'))return;
      run(async()=>{const {error}=await sb.from('memories').update({content:'-',deleted_at:new Date().toISOString()}).eq('id',m.id);if(error)throw error},'Excluído.')}));
    c.appendChild(r);box.appendChild(c)});
  sec.appendChild(box);
}

// ===== Sugestões da Alya na conversa (sempre pedem confirmação) =====
function proposal(m){
  if(!sb||!sess||!enabled||!m||typeof m!=='object')return;
  const acao=m.acao,txt=String(m.texto||'').trim().slice(0,1000),idp=String(m.id||'').slice(0,8);
  const old=idp?mem.find(x=>x.id.startsWith(idp)):null;
  if(!['salvar','substituir','esquecer'].includes(acao))return;
  if(acao==='salvar'&&!txt)return;
  if(acao!=='salvar'&&!old)return;
  if(acao==='substituir'&&!txt)return;
  const card=el('div','msg a mcard');card.appendChild(el('span','who','Alya · memória'));
  const q={salvar:'Salvar na memória: “'+txt+'”?',substituir:'Trocar “'+(old&&old.content)+'” por “'+txt+'”?',esquecer:'Esquecer: “'+(old&&old.content)+'”?'}[acao];
  card.appendChild(document.createTextNode(q));
  const r=el('div','row');
  const done=t=>{r.remove();card.appendChild(document.createTextNode(' '+t))};
  r.append(btn('Confirmar',async()=>{r.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
      if(acao==='salvar'){const {error}=await sb.from('memories').insert({content:txt});if(error)throw error}
      else if(acao==='substituir'){const {error}=await sb.rpc('replace_memory',{p_old:old.id,p_content:txt});if(error)throw error}
      else{const {error}=await sb.from('memories').update({content:'-',deleted_at:new Date().toISOString()}).eq('id',old.id);if(error)throw error}
      done('Feito.');load()}catch(e){done(emsg(e))}}),
    btn('Agora não',()=>done('Ok, não salvei.')));
  card.appendChild(r);const log=document.getElementById('log');log.appendChild(card);log.scrollTop=log.scrollHeight;
}

window.AlyaAuth={hdr:()=>sess?{Authorization:'Bearer '+sess.access_token}:{},proposal};
if(sb){
  sb.auth.onAuthStateChange((ev,s)=>{sess=s;if(ev==='TOKEN_REFRESHED')return;setTimeout(load,0)});
}else render();
})();
