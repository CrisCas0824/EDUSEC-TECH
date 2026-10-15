function notificationIcon(n){
  let title = (typeof n === 'object' ? n.title : n) || "";
  title = title.toLowerCase();
  let type = (typeof n === 'object' ? (n.targetType || n.refType || '') : '').toLowerCase();

  if (type === 'task' || title.includes("tarea")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>';
  }
  if (type === 'topic' || title.includes("tema") || title.includes("sesion") || title.includes("sesión")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h14V6H5zm7 13h2v2h-2v-2z"/></svg>';
  }
  if (type === 'submission' || title.includes("entrega")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#10b981" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
  }
  if (title.includes("alerta") || title.includes("baja") || title.includes("riesgo")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
  }
  if (type === 'message' || title.includes("mensaje") || title.includes("respuesta")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  }
  if (type === 'syllabus' || title.includes("silabo") || title.includes("sílabo") || title.includes("curso")){
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#8b5cf6" xmlns="http://www.w3.org/2000/svg"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>';
  }
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
}

function notificationButtonText(n){
  let title=(n.title||"").toLowerCase();
  if(title.includes("entrega")) return "Calificar";
  if(title.includes("mensaje") || title.includes("respuesta")) return "Ir a conversación";
  if(title.includes("alerta") || title.includes("baja")) return "Ver detalle";
  if(title.includes("sílabo") || title.includes("silabo")) return "Ver curso";
  if(title.includes("tarea")) return "Ver tarea";
  return "Abrir";
}

function resolveNotification(n){
  let title=(n.title||"").toLowerCase();
  let targetType = (n.targetType || n.refType || '').toLowerCase();
  let cid = n.courseId;
  let tid = n.taskId || n.assignmentId;
  let sid = n.studentId || state.childId;

  if(!cid && tid && state.db.assignments){
    let task = state.db.assignments.find(a=>a.id==tid);
    if(task) cid = task.courseId;
  }
  if(!cid && state.db.courses && state.db.courses.length > 0){
    cid = state.db.courses[0].id;
  }

  if (targetType === "topic" || title.includes("tema") || title.includes("sesion") || title.includes("sesión")){
    if (cid) return selectCourse(cid, 'curso');
    return openPage("cursos");
  }

  if(targetType==="submission" || n.refType==="submission" || title.includes("entrega")){
    if(state.user.role==="docente" && tid) return taskSubmissionPanel(tid);
    if(cid) return selectCourse(cid, 'entregas');
    return openPage("entregas");
  }

  if(targetType==="task" || n.refType==="task" || title.includes("tarea")){
    if(cid) return selectCourse(cid, 'entregas');
    if(state.user.role==="docente" && tid) return taskSubmissionPanel(tid);
    if(state.user.role==="estudiante" && tid) return openTask(state.user.id, tid);
    return openPage("tareas");
  }

  if(targetType==="course" || title.includes("curso")){
    if(cid) return selectCourse(cid, 'curso');
    return openPage("cursos");
  }

  if(n.refType==="grade" || title.includes("nota") || title.includes("calificada") || title.includes("académica") || title.includes("baja") || title.includes("alta")){
    if(cid) return selectCourse(cid, 'calificaciones');
    return openPage("notas");
  }

  if(n.refType==="message" || title.includes("mensaje") || title.includes("respuesta")){
    return openPage("mensajes");
  }

  if(n.refType==="syllabus" || title.includes("sílabo") || title.includes("silabo")){
    if(cid) return selectCourse(cid, 'curso');
    return openPage("cursos");
  }

  if(cid) return selectCourse(cid, 'curso');
  return openPage(n.link || "dashboard");
}

function openNotif(id){
  let n=state.db.notifications ? state.db.notifications.find(x=>String(x.id)===String(id)) : null;
  if(!n && typeof visibleNotifs === 'function'){
    n = visibleNotifs().find(x=>String(x.id)===String(id));
  }
  if(n){
    n.read=true;
    n.isRead=true;
    save();
    closeNotificationsPanel();
    resolveNotification(n);
    updateNotif();
  }
}

function getNotifType(n){
  return n.targetType || n.refType || (n.title.toLowerCase().includes('tarea')?'task':n.title.toLowerCase().includes('tema')?'topic':'general');
}

function renderNotifCard(n){
  let type = getNotifType(n);
  let cid = n.courseId || '';
  let tid = n.taskId || n.assignmentId || '';
  return `<div class="notif-card ${(!n.read && !n.isRead)?'unread':''} smart-notif notification-item"
    data-type="${type}"
    data-course-id="${cid}"
    data-task-id="${tid}"
    data-id="${n.id}"
    onclick="openNotif('${n.id}')"
    style="cursor:pointer;">
    <div class="notif-icon notification-icon-placeholder">${notificationIcon(n)}</div>
    <div><b>${n.title}</b><p>${n.text}</p></div>
    <button class="btn secondary btn-notification-action"
      data-type="${type}"
      data-course-id="${cid}"
      data-task-id="${tid}"
      data-id="${n.id}"
      onclick="event.stopPropagation();openNotif('${n.id}')">
      ${notificationButtonText(n)}
    </button>
  </div>`;
}

document.addEventListener('click', function(e){
  let btn = e.target.closest('.btn-notification-action');
  let card = e.target.closest('.notification-item');
  if(btn || card){
    let target = btn || card;
    let nid = target.getAttribute('data-id');
    if(nid){
      openNotif(nid);
    }
  }
});

function notifsPage(){
  content.innerHTML=`<div class="section-title"><h2>Notificaciones</h2></div><div class="page-body"><article class="card"><div class="notif-page-scroll" id="notifications-container">${visibleNotifs().map(n=>renderNotifCard(n)).join("")||"<div class=\"empty-state\">No hay notificaciones.</div>"}</div></article></div>`;
}

function markAllRead(){
  let unread=visibleNotifs().filter(n=>!n.read && !n.isRead);
  if(!unread.length)return toast('No hay notificaciones sin leer');
  unread.forEach(n=>{ n.read=true; n.isRead=true; });
  save();updateNotif();openDrawer();
}

function openDrawer(){
  let myNotifs=visibleNotifs();
  let dr=document.getElementById("drawer");
  if(!dr) return;
  let html=`<div class="drawer-head" style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:12px">
    <h3 style="margin:0;font-size:1.2rem;color:var(--p)">Notificaciones</h3>
    <button class="btn secondary sm" onclick="closeNotificationsPanel()" style="width:32px;height:32px;padding:0;display:grid;place-items:center;border-radius:50%;background:var(--bg);border:1px solid var(--line);cursor:pointer;font-weight:bold">&#10005;</button>
  </div>`;
  html+=`<div style="margin-bottom:16px"><button class="btn secondary sm" onclick="markAllRead()">Marcar todo leido</button></div>`;
  if(!myNotifs||!myNotifs.length){
    html+=`<p class="muted" style="margin-top:20px">No hay notificaciones.</p>`;
  }else{
    html+=`<div class="notif-scroll notifications-list" id="notifications-container">${myNotifs.map(n=>renderNotifCard(n)).join("")}</div>`;
  }
  dr.innerHTML=html;
  dr.classList.remove('hidden');
}
