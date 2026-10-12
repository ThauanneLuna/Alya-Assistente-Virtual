const pill=(h,w=12,dx=0,dy=0)=>{const l=(h-w)/2;return{dx,dy,t:w,p:[0,-l,0,-l/3,0,l/3,0,l]}};
const ln=(a,b,c,d,t)=>({dx:0,dy:0,t,p:[a,b,a+(c-a)/3,b+(d-b)/3,a+2*(c-a)/3,b+2*(d-b)/3,c,d]});
const arc=(w,b,t,dy)=>({dx:0,dy,t,p:[-w/2,0,-w/6,4*b/3,w/6,4*b/3,w/2,0]});
const q=(a,b,x,y,c,d)=>[a,b,a+2*(x-a)/3,b+2*(y-b)/3,c+2*(x-c)/3,d+2*(y-d)/3,c,d];
const M=p=>({p,po:1,ex:0,ey:4,rx:6,ry:4,eo:0,fo:0,ew:4});
const E=(ex,ey,rx,ry,fo,ew)=>({p:q(-9,0,0,7,9,0),po:0,ex,ey,rx,ry,eo:1,fo,ew});
const X={
repouso:{eL:pill(30),eR:pill(30),m:M(q(-9,0,0,7,9,0)),dr:1},
ouvindo:{eL:pill(36,14,0,-1),eR:pill(36,14,0,-1),m:M(q(-8,4,0,8,8,4)),eq:1},
pensando:{eL:pill(26,12,6,-8),eR:pill(26,12,6,-8),m:M(q(-5,4,4,8,13,4)),lk:1},
falando:{eL:pill(30),eR:pill(30),m:E(0,4,8,5,1,0),sp:1},
feliz:{eL:arc(12,-6,5,6),eR:arc(12,-6,5,6),m:M(q(-11,0,0,12,11,0)),bl:0},
surpresa:{eL:pill(34,14,0,2),eR:pill(34,14,0,2),m:E(0,6,6,8,0,4)},
confusao:{eL:pill(18,12,0,6),eR:pill(32,12,0,3),m:M([-12,4,-4,-4,4,12,12,4])},
concentracao:{eL:pill(30),eR:pill(30),m:M(q(-9,2,0,10,9,2))},
irritacao:{eL:ln(-9,-7,9,3,11),eR:ln(9,-7,-9,3,11),m:M(q(-11,8,0,-2,11,8)),bl:0},
curiosidade:{eL:pill(30,12,0,4),eR:pill(38,12,0,2),m:E(6,6,5,4,0,4)},
tristeza:{eL:pill(22,12,0,10),eR:pill(22,12,0,10),m:M(q(-9,10,0,3,9,10))},
sono:{eL:arc(16,5,5,1),eR:arc(16,5,5,1),m:M(q(-6,4,0,4,6,4)),bl:0}};
const full=x=>({eL:x.eL,eR:x.eR,m:x.m,eq:x.eq||0,sp:x.sp||0,lk:x.lk||0,dr:x.dr||0,bl:x.bl===0?0:1});
const L=(a,b,t)=>typeof a==='number'?a+(b-a)*t:Array.isArray(a)?a.map((v,i)=>L(v,b[i],t)):Object.fromEntries(Object.keys(a).map(k=>[k,L(a[k],b[k],t)]));
const clone=o=>JSON.parse(JSON.stringify(o));
const $=id=>document.getElementById(id);
let reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const base=[7,14,22,12,20,10,5];
const bars=base.map((_,i)=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('width',4);r.setAttribute('rx',2);r.setAttribute('x',100+(i-3)*10-2);$('eq').appendChild(r);return r});
const closed=M(q(-9,2,0,9,9,2)),small=E(0,4,6,3.5,1,0),open=E(0,4,8,6,1,0);
let cur=full(X.repouso),from=cur,to=cur,t0=0,dur=320;
let nb=2500,dbl=false,dX=0,dY=0,tX=0,tY=0,nd=4000,aT=0,aC=0,na=0;
const lbl={};
function set(n){from=clone(cur);to=full(X[n]);t0=performance.now();dur=n==='pensando'?400:320;
document.querySelectorAll('button[data-k]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===n))}
function blink(now){if(now<nb)return 0;const e=now-nb;if(e<60)return e/60;if(e<150)return 1-(e-60)/90;
dbl=!dbl&&Math.random()<.12;nb=now+(dbl?170:3000+Math.random()*3000);return 0}
const d=p=>`M${p[0]} ${p[1]}C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}`;
function frame(now){
let k=Math.min(1,(now-t0)/dur);k=k*k*(3-2*k);cur=L(from,to,k);
const bw=blink(now)*cur.bl;
if(now>nd){tX=(Math.random()-.5)*3;tY=(Math.random()-.5)*2;nd=now+5000+Math.random()*3000}
dX+=(tX-dX)*.05;dY+=(tY-dY)*.05;
const lk=reduce?0:cur.lk*5*Math.sin(now/1000*2*Math.PI/2.6);
const dr=reduce?0:cur.dr;
[['eL',78,cur.eL],['eR',122,cur.eR]].forEach(([id,cx,e])=>{
const el=$(id);el.setAttribute('d',d(e.p));el.setAttribute('stroke-width',e.t);
el.setAttribute('transform',`translate(${cx+e.dx+lk+dX*dr} ${75+e.dy+dY*dr}) scale(1 ${1-.85*bw})`)});
if(now>na){const p=Math.random();aT=p<.15?0:[1,2,1,2,0][Math.floor(Math.random()*5)];na=now+(p<.15?300:120+Math.random()*100)}
aC+=(aT-aC)*.25;
const sm=aC<=1?L(closed,small,aC):L(small,open,aC-1);
const m=L(cur.m,sm,cur.sp);
$('mp').setAttribute('d',d(m.p));$('mp').setAttribute('opacity',m.po);
const me=$('me');me.setAttribute('cx',m.ex);me.setAttribute('cy',m.ey);me.setAttribute('rx',Math.max(.1,m.rx));me.setAttribute('ry',Math.max(.1,m.ry));
me.setAttribute('opacity',m.eo);me.setAttribute('fill-opacity',m.fo);me.setAttribute('stroke-width',Math.max(0,m.ew));
const s=reduce?1:1+.01*Math.sin(now/1000*2*Math.PI/4);
$('face').setAttribute('transform',`translate(100 90) scale(${s}) translate(-100 -90)`);
const lv=micBands();bars.forEach((r,i)=>{const dist=Math.abs(i-3);const eff=Math.min(1,Math.max(0,cur.eq*1.6-dist*.2));
const amp=lv?4+lv[i]*30:base[i]*(.65+.35*Math.sin(now/1000*(3+i*.9)+i*1.7));const h=3+eff*(amp-3);
r.setAttribute('height',h);r.setAttribute('y',146-h/2);r.setAttribute('opacity',Math.min(1,eff*4))});
requestAnimationFrame(frame)}
set('repouso');requestAnimationFrame(frame);
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
// ===== Configuração =====
// proxy = função que fala com a IA; tts = função que gera a voz (ElevenLabs). Ambas ficam no Supabase.
// Nunca coloque chaves de API neste arquivo. Vazio = a Alya ainda não está conectada.
const CFG={proxy:'https://oqneikeqhgmyagjhvldq.supabase.co/functions/v1/alya',tts:'https://oqneikeqhgmyagjhvldq.supabase.co/functions/v1/tts'};
const SYSTEM='Você é a Alya, assistente pessoal com personalidade própria: inteligente, simpática, confiante e um pouco travessa. Responda em português do Brasil, em no máximo 2 frases curtas, em tom de fala. Responda SOMENTE em JSON: {"fala":"...","expressao":"feliz, surpresa, confusao, concentracao, irritacao, curiosidade, tristeza, sono ou repouso"}.';
const NAV=[['inicio','Início'],['conversas','Conversas'],['memoria','Memória'],['projetos','Projetos'],['tarefas','Tarefas'],['agenda','Agenda'],['config','Configurações']];
const PEND={
memoria:['Aqui ficarão as informações que a Alya lembrar. Requer memória persistente no servidor.',['Lembranças','Preferências','Pessoas e lugares']],
projetos:['Projetos, decisões, referências e pendências. Requer armazenamento no servidor.',['Projetos','Decisões','Referências','Pendências']],
tarefas:['Acompanhamento de tarefas. Requer armazenamento e lógica no servidor.',['Pendentes','Concluídas','Atrasadas']],
agenda:['Compromissos e lembretes. Requer integração com agenda e notificações.',['Compromissos','Prazos','Lembretes']]};
const ST={idle:'Microfone desligado',perm:'Aguardando permissão',ouvindo:'Ouvindo',pensando:'Processando',falando:'Falando',falha:'Falha no microfone'};
let au=null,ac,an,fd,stream,rec,tok=0,mode='idle',busy=false,lastUser='',speakOn=true,fsz=15,endT=0,player=null;
const convs=[];let cc=null;

// ===== Navegação =====
const dr=$('drawer');
const IC={
inicio:'<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
conversas:'<path d="M5 5.5h10.5A1.5 1.5 0 0 1 17 7v6a1.5 1.5 0 0 1-1.5 1.5H10l-3.5 3v-3H5A1.5 1.5 0 0 1 3.5 13V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M17 9.5h2.5A1.5 1.5 0 0 1 21 11v6a1.5 1.5 0 0 1-1.5 1.5H19v3l-3.5-3H12"/>',
memoria:'<path d="M12 5v14"/><path d="M12 5a3 3 0 0 0-5.6-1.4A3 3 0 0 0 4 8a3 3 0 0 0 .6 4A3.2 3.2 0 0 0 5 16.5 3 3 0 0 0 9 19a3 3 0 0 0 3 0"/><path d="M12 5a3 3 0 0 1 5.6-1.4A3 3 0 0 1 20 8a3 3 0 0 1-.6 4 3.2 3.2 0 0 1-.4 4.5A3 3 0 0 1 15 19a3 3 0 0 1-3 0"/>',
projetos:'<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5v7.8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
tarefas:'<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6V6H9z"/><path d="m8.8 13.2 2.2 2.2 4.2-4.4"/>',
agenda:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
config:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'};
NAV.forEach(([id,n])=>{const b=document.createElement('button');b.type='button';b.dataset.go=id;b.onclick=()=>go(id);
b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[id]+'</svg><span class="lb"></span><span class="ct" hidden></span>';
b.querySelector('.lb').textContent=n;$('dl').appendChild(b)});
Object.entries(PEND).forEach(([id,[d,cards]])=>{const s=document.createElement('section');s.className='scr pn';s.id='s-'+id;s.hidden=true;
const p=document.createElement('p');p.className='badge';p.textContent='Pendente · sem integração';const q=document.createElement('p');q.className='note';q.textContent=d;
const g=document.createElement('div');g.className='cards';
cards.forEach(c=>{const k=document.createElement('div');k.className='card';const h=document.createElement('h3');h.textContent=c;const t=document.createElement('p');t.textContent='Nenhum item. Esta área ainda não está conectada a dados reais.';k.append(h,t);g.appendChild(k)});
s.append(p,q,g);$('app').appendChild(s)});
NAV.forEach(([id,n])=>{const s=$('s-'+id);if(s&&id!=='inicio')s.dataset.t=n});
function drawer(o){dr.classList.toggle('open',o);$('scrim').hidden=!o;$('menu').setAttribute('aria-expanded',o);if(o)dr.querySelector('button').focus();else $('menu').focus()}
const DESK=matchMedia('(min-width:900px)');let curId='inicio';
// No computador o rosto fica sempre visível ao lado do painel, então a voz não é interrompida ao trocar de seção.
// No celular a seção cobre o rosto e o comportamento anterior (parar a voz ao sair do início) é mantido.
function go(id){curId=id;const dk=DESK.matches;if(id!=='inicio'&&mode!=='idle'&&!dk)stop();
document.querySelectorAll('.scr').forEach(s=>s.hidden=s.id==='s-inicio'?false:s.id!=='s-'+id);
$('s-inicio').inert=!dk&&id!=='inicio';document.body.dataset.s=id;
$('ttl').textContent=NAV.find(n=>n[0]===id)[1];
dr.querySelectorAll('.dl button').forEach(b=>b.dataset.go===id?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
if(id==='conversas')renderConvs();if(dr.classList.contains('open'))drawer(false)}
DESK.addEventListener('change',()=>go(curId));
$('back').onclick=()=>go('inicio');
$('menu').onclick=()=>drawer(!dr.classList.contains('open'));$('scrim').onclick=()=>drawer(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dr.classList.contains('open'))drawer(false)});
go('inicio');
if(window.visualViewport){const f=()=>document.documentElement.style.setProperty('--vh',visualViewport.height+'px');visualViewport.addEventListener('resize',f);f()}

// ===== Conversa =====
function addMsg(r,t,rt,store=true){const el=document.createElement('div');el.className='msg '+r;
if(r==='ld'){el.setAttribute('role','status');el.innerHTML='<span class="who">Alya</span><span class="dots" aria-label="Alya está preparando uma resposta"><i></i><i></i><i></i></span>'}
else{const w=document.createElement('span');w.className='who';w.textContent=r==='u'?'Você':r==='a'?'Alya':'Alya · erro';el.append(w,t)}
if(rt){const b=document.createElement('button');b.textContent='Tentar de novo';b.onclick=()=>{el.remove();if(cc&&cc.msgs.at(-1)&&cc.msgs.at(-1).r==='e')cc.msgs.pop();ask(lastUser,true)};el.appendChild(b)}
const log=$('log');const near=log.scrollHeight-log.scrollTop-log.clientHeight<80;
log.appendChild(el);if(near||r==='u')log.scrollTop=log.scrollHeight;
if(r!=='ld'&&store){if(!cc){cc={msgs:[]};convs.unshift(cc)}cc.msgs.push({r,t})}
return el}
const histMsgs=()=>[{role:'system',content:SYSTEM},...(cc?cc.msgs:[]).filter(m=>m.r!=='e').slice(-10).map(m=>({role:m.r==='u'?'user':'assistant',content:m.t}))];
function newConv(){stop();cc=null;$('log').textContent='';go('inicio')}
function renderConvs(){const box=$('cl');box.textContent='';
if(!convs.length){const p=document.createElement('p');p.className='note';p.textContent='Nenhuma conversa nesta sessão.';box.appendChild(p);return}
convs.forEach(c=>{const u=c.msgs.find(m=>m.r==='u');const b=document.createElement('button');
b.textContent=(u?u.t.slice(0,48):'Conversa vazia')+' · '+c.msgs.length+' msg';if(c===cc)b.setAttribute('aria-pressed',true);
b.onclick=()=>{stop();cc=c;$('log').textContent='';c.msgs.forEach(m=>addMsg(m.r,m.t,null,false));go('inicio')};box.appendChild(b)})}
$('nova').onclick=newConv;

async function chat(msgs){
if(!CFG.proxy)throw{m:'A Alya ainda não está conectada a uma IA. Falta configurar o servidor (CFG.proxy no app.js).',retry:false};
const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),25000);let r;
try{r=await fetch(CFG.proxy,{method:'POST',headers:(window.AlyaAuth&&window.AlyaAuth.hdr().Authorization)?{'Content-Type':'application/json',...window.AlyaAuth.hdr()}:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({messages:msgs}),signal:ctl.signal})}
catch(e){throw{m:e.name==='AbortError'?'A resposta demorou demais. Tente de novo.':'Sem conexão com o servidor. Verifique a internet e tente de novo.'}}
finally{clearTimeout(to)}
if(!r.ok){let d='';try{const j=await r.json();d=String((j.error&&j.error.message)||j.message||'').slice(0,90)}catch(e){}throw{m:'O servidor não conseguiu responder agora (código '+r.status+(d?' · '+d:'')+'). Tente de novo em instantes.'}}
try{const j=await r.json();return JSON.parse(j.choices[0].message.content)}catch(e){throw{m:'A resposta do servidor veio em um formato inesperado.'}}}
async function ask(t,retry){if(busy)return;busy=true;$('send').disabled=true;lastUser=t;
if(!retry)addMsg('u',t);
const ld=addMsg('ld','');const my=++tok;md('pensando');set('pensando');sub('');
try{const r=await chat(histMsgs());ld.remove();if(my!==tok)return;
const f=String(r.fala||'').trim();if(!f)throw{m:'A Alya respondeu vazio. Tente de novo.'};
say(f,r.expressao);window.AlyaAuth&&window.AlyaAuth.proposal(r.mem)}
catch(e){ld.remove();if(my===tok){const m=(e&&e.m)||'Algo deu errado. Tente de novo.';idle(true);set('confusao');sub(m);addMsg('e',m,e&&e.retry===false?false:true)}}
finally{busy=false;$('send').disabled=false}}
$('bar').onsubmit=e=>{e.preventDefault();const v=$('txt').value.trim();if(!v||busy)return;if(mode!=='idle'&&mode!=='falha')stop();$('txt').value='';ask(v)};
$('txt').onfocus=()=>{const l=$('log');setTimeout(()=>{l.scrollTop=l.scrollHeight},250)};

// ===== Voz =====
const md=m=>{mode=m;$('chip').textContent=ST[m];$('chip').dataset.m=m;$('mic').textContent=(m==='ouvindo'||m==='perm')?'Parar':'Falar';$('mic').setAttribute('aria-pressed',m==='ouvindo'||m==='perm');$('stopv').hidden=m!=='falando'};
const sub=t=>{$('sub').textContent=t||''};
function micBands(){if(!an||mode!=='ouvindo')return null;an.getByteFrequencyData(fd);return[1,2,3,4,6,8,11].map(i=>Math.min(1,(fd[i]||0)/190))}
async function startMic(){try{stream=await navigator.mediaDevices.getUserMedia({audio:true});ac=new(window.AudioContext||window.webkitAudioContext)();an=ac.createAnalyser();an.fftSize=64;an.smoothingTimeConstant=.7;ac.createMediaStreamSource(stream).connect(an);fd=new Uint8Array(an.frequencyBinCount);return true}catch(e){an=null;return false}}
function stopMic(){stream&&stream.getTracks().forEach(t=>t.stop());ac&&ac.close().catch(()=>{});an=ac=stream=null}
function idle(keep){tok++;md('idle');set('repouso');if(!keep)setTimeout(()=>{if(mode==='idle')sub('')},2500)}
function stopAudio(){if(au){au.onended=au.onerror=null;au.pause();au=null}}
function stop(){tok++;stopAudio();try{rec&&rec.abort()}catch(e){}rec=null;stopMic();window.speechSynthesis&&speechSynthesis.cancel();md('idle');set('repouso');sub('')}
function fail(m){tok++;try{rec&&rec.abort()}catch(e){}rec=null;stopMic();md('falha');set('tristeza');sub(m);setTimeout(()=>{if(mode==='falha'){md('idle');set('repouso')}},4500)}
function setNoan(){try{localStorage.setItem('alya_noan','1')}catch(e){}}
async function listen(){
if(mode==='ouvindo'||mode==='perm'){stop();return}
if(mode==='falando'){stop();return}
if(busy)return;
if(!SR){sub('Este navegador não oferece reconhecimento de voz. Digite no campo abaixo.');$('txt').focus();return}
const my=++tok;md('perm');set('ouvindo');sub('Aguardando permissão do microfone…');
const NOAN=(()=>{try{return localStorage.getItem('alya_noan')==='1'}catch(e){return false}})();const ok=NOAN?true:await startMic();if(my!==tok)return;
if(!ok){fail('Microfone bloqueado ou indisponível. Libere a permissão no navegador (o site precisa estar em HTTPS) ou digite.');return}
md('ouvindo');sub('Ouvindo…');
let last='';rec=new SR();rec.lang='pt-BR';rec.interimResults=true;
let done=false,silT=0,gotErr=false;
const finish=()=>{if(done||my!==tok)return;done=true;clearTimeout(silT);const r0=rec;rec=null;try{r0&&r0.abort()}catch(e){}stopMic();const t=last.trim();t?ask(t):(idle(true),sub('Não captei sua fala. Toque no microfone e tente de novo.'))};
rec.onresult=e=>{last=[...e.results].map(r=>r[0].transcript).join('');sub(last);clearTimeout(silT);const fin=e.results[e.results.length-1].isFinal;silT=setTimeout(finish,fin?250:1800)};
rec.onerror=e=>{if(my!==tok)return;gotErr=true;if(e.error==='audio-capture')setNoan();fail(e.error==='no-speech'?'Não ouvi nada. Tente de novo.':(e.error==='not-allowed'||e.error==='service-not-allowed')?'Reconhecimento de voz bloqueado neste aparelho. Digite no campo abaixo.':e.error==='audio-capture'?'Não consegui usar o microfone. Feche outros apps que o usem e tente de novo.':e.error==='network'?'O reconhecimento de voz precisa de internet. Verifique a conexão.':'Falha no reconhecimento de voz ('+e.error+'). Tente de novo.')};
const t0=Date.now();rec.onend=()=>{if(!last&&!gotErr&&Date.now()-t0<2000)setNoan();finish()};
try{rec.start()}catch(e){fail('Não foi possível iniciar o reconhecimento de voz.')}}
function say(t,ex,log=true){const my=++tok;md('falando');if(log)addMsg('a',t);
X._f={...(X[ex]||X.repouso),m:X.falando.m,sp:1,eq:0,lk:0,dr:0};set('_f');sub(t);
let d=0;const end=()=>{if(d||my!==tok)return;d=1;clearTimeout(endT);idle(true)};
const tts=speakOn&&t;
if(tts&&CFG.tts)speakEL(t,my,end);
clearTimeout(endT);endT=setTimeout(end,CFG.tts&&tts?90000:t.length*60+1500)}
function vozErro(m){console.error('[Alya voz]',m);sub('Voz indisponível: '+m);addMsg('e','Não consegui reproduzir a voz: '+m+' A resposta continua disponível em texto.',false,false)}
async function speakEL(t,my,end){
const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);
try{let r;
try{r=await fetch(CFG.tts,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({text:t}),signal:ctl.signal})}
catch(e){throw new Error(e.name==='AbortError'?'a geração da voz demorou demais.':'sem conexão com a função de voz (confira se a função "tts" está publicada).')}
finally{clearTimeout(to)}
if(!r.ok){let m='código '+r.status;try{const j=await r.json();m=(j.error&&j.error.message)||m}catch(e){}
if(r.status===402)m='a ElevenLabs recusou por plano ou créditos (402). '+m;
if(r.status===404)m='função de voz não encontrada (404).';
throw new Error(m)}
const b=await r.blob();if(my!==tok)return;
if(!b.size||!/audio/.test(b.type))throw new Error('o servidor não devolveu um áudio válido.');
const u=URL.createObjectURL(b);stopAudio();
const a=player||(player=new Audio());au=a;
a.onended=()=>{URL.revokeObjectURL(u);if(au===a)au=null;end()};
a.onerror=()=>{URL.revokeObjectURL(u);if(au===a)au=null;vozErro('o navegador não conseguiu tocar o áudio.');end()};
a.onloadedmetadata=()=>{clearTimeout(endT);endT=setTimeout(end,((a.duration||30)+5)*1000)};
a.src=u;
try{await a.play()}catch(e){URL.revokeObjectURL(u);throw new Error(e.name==='NotAllowedError'?'o navegador bloqueou o som automático. Toque na tela e tente de novo.':'falha ao iniciar o áudio.')}
}catch(e){if(my===tok){vozErro(e.message||'erro desconhecido.');end()}}}
const SILENT='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
function unlockAudio(){document.removeEventListener('pointerdown',unlockAudio);document.removeEventListener('keydown',unlockAudio);
try{const a=player||(player=new Audio());a.muted=true;a.src=SILENT;const p=a.play();Promise.resolve(p).catch(()=>{}).finally(()=>{a.pause();a.muted=false})}catch(e){}}
document.addEventListener('pointerdown',unlockAudio);document.addEventListener('keydown',unlockAudio);
$('mic').onclick=listen;$('stopv').onclick=stop;
if(!SR){$('mic').title='Reconhecimento de voz indisponível neste navegador'}

// ===== Configurações =====
$('spk').onclick=()=>{speakOn=!speakOn;$('spk').setAttribute('aria-pressed',speakOn);if(!speakOn)stopAudio()};
$('rm').setAttribute('aria-pressed',reduce);$('rm').onclick=()=>{reduce=!reduce;$('rm').setAttribute('aria-pressed',reduce)};
const fs=d=>{fsz=Math.min(22,Math.max(12,fsz+d));document.documentElement.style.setProperty('--fs',fsz+'px')};
$('fsm').onclick=()=>fs(-1);$('fsp').onclick=()=>fs(1);
$('tg').onclick=()=>{const s=$('s-inicio').classList.toggle('solo');$('tg').setAttribute('aria-pressed',s);$('tg').textContent=s?'Mostrar conversa':'Só rosto'};

// ===== Menu: nome, status, contadores e cartão "Hoje" (dados reais publicados por tarefas.js e projetos.js) =====
document.addEventListener('DOMContentLoaded',()=>{
const C=window.AlyaCore;if(!C)return;
const data={tasks:undefined,projects:undefined};
const SUB={idle:'em repouso',perm:'aguardando o microfone',ouvindo:'ouvindo',pensando:'pensando',falando:'falando',falha:'com falha no microfone'};
const sess=()=>C.session&&C.session();
const isLate=t=>!!t.due_at&&new Date(t.due_at)<new Date();
function head(){const s=sess(),u=(s&&s.user)||{},m=u.user_metadata||{};
const n=s?String(m.full_name||m.name||(u.email||'').split('@')[0]||'').trim():'';
const t=SUB[$('chip').dataset.m]||SUB.idle;$('dn').textContent=n||'Alya';$('ds').textContent=n?'Alya '+t:t.charAt(0).toUpperCase()+t.slice(1)}
function ct(id,n,lbl,late){const e=document.querySelector('#dl [data-go="'+id+'"] .ct');if(!e)return;
e.hidden=!n;e.textContent=n||'';e.classList.toggle('late',!!late);if(n)e.setAttribute('aria-label',n+' '+lbl);else e.removeAttribute('aria-label')}
function counts(){const t=data.tasks,p=data.projects;
ct('tarefas',Array.isArray(t)?t.filter(isLate).length:0,'atrasadas',true);
ct('projetos',Array.isArray(p)?p.filter(x=>x.status==='ativo'||x.status==='pausado').length:0,'projetos ativos',false)}
function hoje(){const h=$('hoje');h.textContent='';
const add=(tag,cls,txt,par)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;(par||h).appendChild(e);return e};
const top=add('div','hh');add('h3','','Hoje',top);
const tk=data.tasks;
if(!sess()){add('p','hn','Entre na conta para ver o seu dia.');return}
if(tk===false){add('p','hn','Não consegui carregar as tarefas agora.');return}
if(!Array.isArray(tk)){add('p','hn','Carregando…');return}
const y=new Date().toDateString();
const it=tk.filter(t=>t.due_at&&(isLate(t)||new Date(t.due_at).toDateString()===y)).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at));
if(!it.length){add('p','hn','Nada com prazo para hoje.');return}
const ul=add('ul','hl');
it.slice(0,5).forEach(t=>{const li=add('li','',null,ul);add('span','tt',t.title,li);
if(isLate(t))add('span','hb late','Atrasada',li);else add('span','hb',new Date(t.due_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),li)});
if(it.length>5)add('p','hn','+ '+(it.length-5)+' com prazo hoje ou atrasadas');
const b=add('button','hv','Ver tarefas');b.type='button';b.onclick=()=>go('tarefas')}
function all(){head();counts();hoje()}
new MutationObserver(head).observe($('chip'),{attributes:true,attributeFilter:['data-m']});
C.bus.on('data',e=>{if(e&&e.k in data){data[e.k]=e.v;counts();hoje()}});
C.onAuth(all);all();
setInterval(()=>{counts();hoje()},60000);
});
