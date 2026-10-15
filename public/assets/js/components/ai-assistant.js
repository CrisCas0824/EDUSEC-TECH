/* Asistente virtual IA — chat conversacional */
function injectAiStyles(){
  if(document.getElementById('aiStyles'))return;
  let el=document.createElement('style');
  el.id='aiStyles';
  el.textContent=`
.ai-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s}
.ai-modal{background:white;border-radius:24px;width:min(700px,100%);height:min(600px,90vh);display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,.25);animation:slideUp .25s}
.ai-head{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid #f1f5f9;flex-shrink:0}
.ai-head h3{margin:0;font-size:1.05rem;display:flex;align-items:center;gap:8px}
.ai-head-close{background:#eff6ff!important;color:#2563eb!important;border:none!important;width:32px!important;height:32px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:1rem!important;font-weight:700!important;transition:all 0.2s ease!important}
.ai-head-close:hover{background:#dbeafe!important;color:#1d4ed8!important}
.ai-badge{display:inline-block;background:#eaf1ff;color:var(--p);font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600}
.ai-chat{flex:1;overflow-y:auto;padding:16px 24px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
.ai-chat-end{flex:1;min-height:4px}
.ai-msg{display:flex;gap:8px;max-width:88%;animation:msgIn .2s ease-out}
.ai-msg.user{align-self:flex-end;flex-direction:row-reverse}
.ai-msg.bot{align-self:flex-start}
.ai-msg-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:15px;flex-shrink:0}
.ai-msg.user .ai-msg-av{background:var(--p);color:#fff;font-size:13px;font-weight:700}
.ai-msg.bot .ai-msg-av{background:#eef2ff}
.ai-msg-bubble{padding:10px 14px;border-radius:18px;font-size:.9rem;line-height:1.55;word-wrap:break-word}
.ai-msg.user .ai-msg-bubble{background:var(--p);color:#fff;border-bottom-right-radius:4px}
.ai-msg.bot .ai-msg-bubble{background:var(--soft);border-bottom-left-radius:4px}
.ai-msg.bot .ai-msg-bubble p{margin:6px 0}
.ai-msg.bot .ai-msg-bubble p:first-child{margin-top:0}
.ai-msg.bot .ai-msg-bubble p:last-child{margin-bottom:0}
.ai-msg.bot .ai-msg-bubble ul{padding-left:18px;margin:6px 0}
.ai-msg.bot .ai-msg-bubble li{margin:3px 0}
.ai-typing{display:flex;gap:5px;align-items:center;padding:6px 0}
.ai-typing span{width:7px;height:7px;border-radius:50%;background:var(--mut);animation:typingBounce 1.4s infinite}
.ai-typing span:nth-child(2){animation-delay:.2s}
.ai-typing span:nth-child(3){animation-delay:.4s}
.ai-foot{display:flex;gap:8px;padding:12px 24px 16px;border-top:1px solid var(--line);flex-shrink:0}
.ai-foot input{flex:1;border:1px solid var(--line);border-radius:24px;padding:10px 16px;font-size:.9rem;outline:0;transition:border-color .15s}
.ai-foot input:focus{border-color:var(--p)}
.ai-foot button{width:40px;height:40px;border-radius:50%;border:0;background:var(--p);color:#fff;cursor:pointer;display:grid;place-items:center;font-size:1.1rem;flex-shrink:0;transition:opacity .15s}
.ai-foot button:disabled{opacity:.4;cursor:not-allowed}
.ai-error-msg{text-align:center;padding:24px;color:var(--r);font-size:.85rem}
.ai-error-msg .btn{margin-top:10px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
`;
  document.head.appendChild(el);
}

function openAiChat(sid){
  injectAiStyles();
  let data=prepareAiData(sid);
  if(!data){toast('No hay datos del estudiante');return}
  window._chatData=data;
  window._chatSid=sid;
  window._chatHistory=[];
  window._isSending=false;
  let ov=document.createElement('div');
  ov.className='ai-overlay';ov.id='aiOverlay';
  ov.innerHTML=`
    <div class="ai-modal" onclick="event.stopPropagation()">
      <div class="modal-header ai-head">
        <h3> EduCoach <span class="ai-badge">Beta</span></h3>
        <button class="modal-close-btn ai-head-close" id="aiCloseBtn">&#10005;</button>
      </div>
      <div class="ai-chat" id="aiChat">
        <div class="ai-msg bot">
          <div class="ai-message-icon-container ai-msg-av"><svg class="ai-message-icon" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 2a1 1 0 0 1 1 1v1.05A7.002 7.002 0 0 1 19 11v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6a7.002 7.002 0 0 1 6-6.95V3a1 1 0 0 1 1-1zm0 4a5 5 0 0 0-5 5v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6a5 5 0 0 0-5-5zm-3 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6 5h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z"/></svg></div>
          <div class="ai-msg-bubble">¡Hola! Soy EduCoach, tu asistente educativo. Puedo ayudarte con consejos sobre el rendimiento académico de tu hijo. ¿Qué deseas saber?<br><br>Ej: <i>"¿Cómo va mi hijo en general?"</i>, <i>"¿Qué cursos necesita mejorar?"</i></div>
        </div>
        <div class="ai-chat-end"></div>
      </div>
      <div class="ai-foot">
        <input id="aiInput" type="text" placeholder="Escribe tu mensaje..." autofocus>
        <button id="aiSendBtn" title="Enviar"></button>
      </div>
    </div>`;
  ov.addEventListener('click',closeAiChat);
  document.body.appendChild(ov);
  document.getElementById('aiCloseBtn').addEventListener('click',closeAiChat);
  document.getElementById('aiSendBtn').addEventListener('click',sendChatMessage);
  document.getElementById('aiInput').addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChatMessage()}
  });
  setTimeout(()=>document.getElementById('aiInput').focus(),300);
}

function closeAiChat(){
  let el=document.getElementById('aiOverlay');
  if(el)el.remove();
  window._chatData=null;window._chatSid=null;window._chatHistory=null;window._isSending=false;
}

function sendChatMessage(){
  if(window._isSending)return;
  let inp=document.getElementById('aiInput');
  if(!inp)return;
  let text=inp.value.trim();
  if(!text)return;
  inp.value='';
  window._isSending=true;
  document.getElementById('aiSendBtn').disabled=true;
  inp.disabled=true;
  renderChatBubble(text,'user');
  window._chatHistory.push({role:'user',text});
  if(!AI_CONFIG.API_KEY){
    setTimeout(()=>{
      hideTyping();
      let d=window._chatData;
      let reply='';
      if(d&&d.alertsCount>0){
        let lowCourses=d.courses.filter(c=>c.score<11).map(c=>c.name+' ('+c.score+'/20)').join(', ');
        reply='Como EduCoach, le recomiendo priorizar el apoyo en las asignaturas que presentan alerta: '+lowCourses+'. Sugerimos coordinar una cita mediante el semáforo de Hora Docente y reforzar el hábito de repaso de 45 minutos diarios.';
      }else if(d){
        reply='Excelente desempeño académico general (promedio '+d.overallAvg+'/20 y asistencia '+d.overallAtt+'%). Para mantener este rendimiento sobresaliente, felicite a su hijo y motive su participación en actividades extracurriculares.';
      }else{
        reply='Hola, soy EduCoach. Estoy a su disposición para brindarle orientación pedagógica y seguimiento al rendimiento escolar.';
      }
      window._chatHistory.push({role:'model',text:reply});
      renderChatBubble(reply,'bot');
      scrollChat();
      window._isSending=false;
      let btn=document.getElementById('aiSendBtn');
      let input=document.getElementById('aiInput');
      if(btn)btn.disabled=false;
      if(input){input.disabled=false;input.focus()}
    },500);
    return;
  }
  let ctx=AI_SYSTEM_PROMPT+'\n\nESTUDIANTE ACTUAL:\n'+buildAiPrompt(window._chatData);
  let prefix=[
    {role:'user',parts:[{text:ctx}]},
    {role:'model',parts:[{text:'Entendido. Contexto académico cargado.'}]}
  ];
  let body={
    contents:prefix.concat(window._chatHistory.map(m=>({role:m.role,parts:[{text:m.text}]}))),
    generationConfig:{temperature:AI_CONFIG.TEMPERATURE,maxOutputTokens:AI_CONFIG.MAX_TOKENS}
  };
  fetch(AI_CONFIG.API_URL+'?key='+AI_CONFIG.API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(r=>r.json().then(json=>{if(!r.ok)throw new Error(json?.error?.message||'Error '+r.status);return json}))
    .then(json=>{
      hideTyping();
      let text=json?.candidates?.[0]?.content?.parts?.[0]?.text||'';
      if(!text)throw new Error('Respuesta vacía');
      window._chatHistory.push({role:'model',text});
      renderChatBubble(text,'bot');
      scrollChat();
    })
    .catch(err=>{
      hideTyping();
      console.error('AI chat error:',err);
      let isQuota=err.message&&(err.message.includes('429')||err.message.includes('quota'));
      renderChatError(isQuota?'Se alcanzó el límite temporal de consultas. Intenta de nuevo en unos momentos.':'Error al conectar con el servicio: '+err.message);
    })
    .finally(()=>{
      window._isSending=false;
      let btn=document.getElementById('aiSendBtn');
      let input=document.getElementById('aiInput');
      if(btn)btn.disabled=false;
      if(input){input.disabled=false;input.focus()}
    });
}

function getAiAvatarHtml(role){
  if(role==='user'){
    return '<div class="user-message-icon-container ai-msg-av"><svg class="user-message-icon" viewBox="0 0 24 24"><path fill="#64748b" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
  }
  return '<div class="ai-message-icon-container ai-msg-av"><svg class="ai-message-icon" viewBox="0 0 24 24"><path fill="#ffffff" d="M12 2a1 1 0 0 1 1 1v1.05A7.002 7.002 0 0 1 19 11v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6a7.002 7.002 0 0 1 6-6.95V3a1 1 0 0 1 1-1zm0 4a5 5 0 0 0-5 5v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6a5 5 0 0 0-5-5zm-3 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6 5h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z"/></svg></div>';
}

function renderChatBubble(text,role){
  let chat=document.getElementById('aiChat');
  if(!chat)return;
  let div=document.createElement('div');
  div.className='ai-msg '+role;
  let avatar=getAiAvatarHtml(role);
  let content=role==='user'?escapeHtml(text):formatBotText(text);
  div.innerHTML=`${avatar}<div class="ai-msg-bubble">${content}</div>`;
  chat.insertBefore(div,chat.lastElementChild);
  scrollChat();
}

function showTyping(){
  let chat=document.getElementById('aiChat');
  if(!chat)return;
  let div=document.createElement('div');
  div.className='ai-msg bot';div.id='aiTyping';
  let avatar=getAiAvatarHtml('bot');
  div.innerHTML=`${avatar}<div class="ai-msg-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
  chat.insertBefore(div,chat.lastElementChild);
  scrollChat();
}

function hideTyping(){
  let el=document.getElementById('aiTyping');
  if(el)el.remove();
}

function renderChatError(msg){
  let chat=document.getElementById('aiChat');
  if(!chat)return;
  let div=document.createElement('div');
  div.className='ai-msg bot';
  let avatar=getAiAvatarHtml('bot');
  div.innerHTML=`${avatar}<div class="ai-msg-bubble ai-error-msg">${msg}<br><button class="btn secondary" onclick="retryLastMessage()">Reintentar</button></div>`;
  chat.insertBefore(div,chat.lastElementChild);
  scrollChat();
}

function retryLastMessage(){
  let lastText=null;
  for(let i=window._chatHistory.length-1;i>=0;i--){
    if(window._chatHistory[i].role==='user'){
      lastText=window._chatHistory[i].text;
      window._chatHistory.splice(i,1);
      break;
    }
  }
  if(!lastText)return;
  let errorEl=document.querySelector('.ai-msg.bot .ai-error-msg');
  if(errorEl)errorEl.closest('.ai-msg')?.remove();
  let userBubbles=document.querySelectorAll('.ai-msg.user');
  if(userBubbles.length)userBubbles[userBubbles.length-1].remove();
  let inp=document.getElementById('aiInput');
  if(inp)inp.value=lastText;
  sendChatMessage();
}

function scrollChat(){
  let chat=document.getElementById('aiChat');
  if(chat)chat.scrollTop=chat.scrollHeight;
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBotText(text){
  let html='',inList=false;
  text.split('\n').forEach(line=>{
    let t=line.trim();
    if(!t)return;
    let isListItem=t.match(/^[-*]\s/)||t.match(/^\d+[.)]\s/);
    if(isListItem){
      if(!inList){html+='<ul>';inList=true}
      html+=`<li>${t.replace(/^[-*]\s*/,'').replace(/^\d+[.)]\s*/,'').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</li>`;
    } else {
      if(inList){html+='</ul>';inList=false}
      if(t.match(/^#{1,3}\s/)) html+=`<b>${t.replace(/^#+\s/,'')}</b>`;
      else html+=`<p>${t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>`;
    }
  });
  if(inList)html+='</ul>';
  return html;
}
