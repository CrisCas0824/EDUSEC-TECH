/* Inyecta el botón IA en el dashboard del padre sin modificar archivos existentes */
(function(){
  let _lastSid=null;

  function findCurrentSid(){
    let sel=document.getElementById('childSelect');
    return sel?+sel.value:state.childId||null;
  }

  function injectAiButtons(){
    let sectionTitle=document.querySelector('.section-title');
    if(!sectionTitle)return;
    let h2=sectionTitle.querySelector('h2');
    if(!h2)return;
    let text=h2.textContent.trim();
    if(state.user.role!=='padre')return;
    let isParentDash=text==='Panel familiar';
    let isChildCourse=text==='Cursos'||text==='Tareas'||text==='Notas'||text==='Asistencia'||text==='Gamificación'||text==='Bitácora'||text==='Horario'||text==='Reportes';
    if(!isParentDash&&!isChildCourse)return;
    if(sectionTitle.querySelector('.ai-btn'))return;
    let sid=findCurrentSid();
    if(!sid)return;
    _lastSid=sid;
    let btn=document.createElement('button');
    btn.className='btn primary ai-btn';
    btn.style.marginLeft='auto';
    btn.innerHTML=' Consejos con IA';
    btn.onclick=function(){let id=findCurrentSid()||_lastSid;if(id)openAiChat(id)};
    let actions=sectionTitle.querySelector('.hdr-actions');
    if(actions)actions.appendChild(btn);
    else{
      let wrap=document.createElement('div');
      wrap.className='hdr-actions';
      wrap.appendChild(btn);
      sectionTitle.appendChild(wrap);
    }
  }

  function observeContent(){
    let target=document.getElementById('content');
    if(!target)return;
    let obs=new MutationObserver(()=>{setTimeout(injectAiButtons,50)});
    obs.observe(target,{childList:true,subtree:true});
    injectAiButtons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeContent);
  else observeContent();
})();
