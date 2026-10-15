window._selectedRecipientId = null;
window._selectedRecipients = [];
window._isAllStudentsAdded = false;
window._isAllParentsAdded = false;

function toggleAllCourseStudents(){
  let btn = document.getElementById('btn-toggle-all-students');
  let selCourse = document.getElementById('msgCourseSelect')?.value || 'all';
  let courses = typeof myCoursesDoc === 'function' ? myCoursesDoc() : [];
  let filtered = selCourse === 'all' ? courses : courses.filter(c => String(c.id) === String(selCourse));

  if(!window._selectedRecipients) window._selectedRecipients = [];

  let courseStudentUsers = [];
  filtered.forEach(c => {
    let stList = typeof studentsOfCourse === 'function' ? studentsOfCourse(c) : [];
    stList.forEach(s => {
      let u = (state.db.users || []).find(x => x.role === 'estudiante' && String(x.refId) === String(s.id));
      let name = s.name || (u ? u.name : 'Alumno');
      let email = u ? u.email : '';
      let id = u ? u.id : s.id;
      courseStudentUsers.push({ id: id, name: name, email: email, type: 'student', role: 'estudiante' });
    });
  });

  if(!window._isAllStudentsAdded){
    courseStudentUsers.forEach(sUser => {
      if(!window._selectedRecipients.some(x => String(x.id) === String(sUser.id))){
        window._selectedRecipients.push(sUser);
      }
    });
    window._isAllStudentsAdded = true;
    if(btn) btn.classList.add('active');
    toast('Todos los alumnos del curso agregados');
  } else {
    let studentIds = new Set(courseStudentUsers.map(x => String(x.id)));
    window._selectedRecipients = window._selectedRecipients.filter(x => !studentIds.has(String(x.id)));
    window._isAllStudentsAdded = false;
    if(btn) btn.classList.remove('active');
    toast('Alumnos del curso removidos');
  }

  renderSelectedRecipients();
}
window.toggleAllCourseStudents = toggleAllCourseStudents;

function toggleAllCourseParents(){
  let btn = document.getElementById('btn-toggle-all-parents');
  let selCourse = document.getElementById('msgCourseSelect')?.value || 'all';
  let courses = typeof myCoursesDoc === 'function' ? myCoursesDoc() : [];
  let filtered = selCourse === 'all' ? courses : courses.filter(c => String(c.id) === String(selCourse));

  if(!window._selectedRecipients) window._selectedRecipients = [];

  let courseParentUsers = [];
  filtered.forEach(c => {
    let stList = typeof studentsOfCourse === 'function' ? studentsOfCourse(c) : [];
    stList.forEach(s => {
      if(s.parentId){
        let p = (state.db.parents || []).find(x => String(x.id) === String(s.parentId));
        let u = (state.db.users || []).find(x => x.role === 'padre' && String(x.refId) === String(s.parentId));
        let name = p ? p.name : (u ? u.name : 'Padre');
        let email = u ? u.email : '';
        let id = u ? u.id : s.parentId;
        courseParentUsers.push({ id: id, name: name, email: email, type: 'parent', role: 'padre' });
      }
    });
  });

  if(!window._isAllParentsAdded){
    courseParentUsers.forEach(pUser => {
      if(!window._selectedRecipients.some(x => String(x.id) === String(pUser.id))){
        window._selectedRecipients.push(pUser);
      }
    });
    window._isAllParentsAdded = true;
    if(btn) btn.classList.add('active');
    toast('Todos los padres del curso agregados');
  } else {
    let parentIds = new Set(courseParentUsers.map(x => String(x.id)));
    window._selectedRecipients = window._selectedRecipients.filter(x => !parentIds.has(String(x.id)));
    window._isAllParentsAdded = false;
    if(btn) btn.classList.remove('active');
    toast('Padres del curso removidos');
  }

  renderSelectedRecipients();
}
window.toggleAllCourseParents = toggleAllCourseParents;

function renderSelectedRecipients(){
  let el = document.getElementById('selectedRecipients');
  if(!el) return;
  let list = window._selectedRecipients || [];
  if(!list.length){
    el.innerHTML = '';
    return;
  }
  el.innerHTML = list.map(r => `<div class="chip-tag-item recipient-chip-tag recipient-chip">
    <span>${r.name}</span>
    <span class="close-chip-icon close-chip remove-chip-btn" onclick="removeRecipient('${r.id}')">&times;</span>
  </div>`).join('');
}
window.renderSelectedRecipients = renderSelectedRecipients;

function removeRecipient(id){
  if(!window._selectedRecipients) return;
  window._selectedRecipients = window._selectedRecipients.filter(x => String(x.id) !== String(id));
  renderSelectedRecipients();
}
window.removeRecipient = removeRecipient;

function handleRecipientSearchInput(query){
  query = (query || '').toLowerCase().trim();
  let dropdown = document.getElementById('recipient-suggestions-dropdown');
  if(!dropdown) return;

  if(query.length < 1){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  let matches = (state.db.users || []).filter(u => {
    if(state.user && String(u.id) === String(state.user.id) && u.role === state.user.role) return false;
    let name = '';
    if(u.role === 'docente'){
      let ref = (state.db.teachers || []).find(t => t.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'estudiante'){
      let ref = (state.db.students || []).find(s => s.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'padre'){
      let ref = (state.db.parents || []).find(p => p.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'director'){
      name = u.name || 'Director';
    }
    let email = u.email || '';
    return (name && name.toLowerCase().includes(query)) || (email && email.toLowerCase().includes(query));
  }).slice(0, 15);

  if(!matches.length){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  dropdown.innerHTML = matches.map(u => {
    let name = '';
    if(u.role === 'docente'){
      let ref = (state.db.teachers || []).find(t => t.id === u.refId);
      name = ref ? ref.name : 'Docente';
    } else if(u.role === 'estudiante'){
      let ref = (state.db.students || []).find(s => s.id === u.refId);
      name = ref ? ref.name : 'Alumno';
    } else if(u.role === 'padre'){
      let ref = (state.db.parents || []).find(p => p.id === u.refId);
      name = ref ? ref.name : 'Padre';
    } else {
      name = u.name || 'Director';
    }

    let roleLabel = u.role === 'docente' ? 'Docente' : u.role === 'estudiante' ? 'Alumno' : u.role === 'padre' ? 'Padre' : 'Director';

    return `<div class="suggestion-item" onclick="selectRecipientSuggestion(${u.id}, '${name.replace(/'/g, "\\'")}', '${u.email}', '${u.role}')">
      <div>
        <b>${name}</b> <small style="color:#64748b;margin-left:6px;">${u.email}</small>
      </div>
      <span class="user-role-tag">${roleLabel}</span>
    </div>`;
  }).join('');

  dropdown.style.display = 'block';
}
window.handleRecipientSearchInput = handleRecipientSearchInput;

function selectRecipientSuggestion(userId, userName, userEmail, userRole){
  let rec = {
    id: userId,
    type: userRole === 'estudiante' ? 'student' : userRole === 'padre' ? 'parent' : 'user',
    name: userName,
    email: userEmail,
    role: userRole
  };
  if(!window._selectedRecipients) window._selectedRecipients = [];
  if(!window._selectedRecipients.some(x => String(x.id) === String(userId))){
    window._selectedRecipients.push(rec);
  } else {
    toast('El usuario ya ha sido agregado');
  }

  let input = document.getElementById('recipient-search-input');
  if(input) input.value = '';

  let dropdown = document.getElementById('recipient-suggestions-dropdown');
  if(dropdown){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  renderSelectedRecipients();
}
window.selectRecipientSuggestion = selectRecipientSuggestion;

document.addEventListener('click', function(e){
  let container = e.target.closest('.recipient-search-container');
  if(!container){
    let dropdown = document.getElementById('recipient-suggestions-dropdown');
    if(dropdown) dropdown.style.display = 'none';
  }
});

function teacherMessagesPage(){
  let msgTab=window._teacherMsgTab||'inbox';
  let courses=myCoursesDoc();
  let courseOptions=courses.map(c=>`<option value="${c.id}">${c.name} · ${c.grade} ${c.section}</option>`).join('');
  content.innerHTML=`<div class="messages-wrapper">
    <div class="section-title messages-header-title"><h2>Mensajes</h2></div>
    <div class="page-body">
      <div id="teacherMsgInbox" class="${msgTab==='enviar'?'hidden':''}">
        <article class="card messages-card-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h3 style="margin:0">Bandeja de mensajes</h3>
            <button class="btn primary sm" onclick="window._teacherMsgTab='enviar';teacherMessagesPage()">+ Nuevo mensaje</button>
          </div>
          <input type="text" id="teacherMsgSearch" class="search-input messages-search-input" placeholder="Buscar en mensajes..." oninput="debounceSearch('teacherMsgSearch','teacherMsgList')">
          <div id="teacherMsgList">${teacherMessageHistory()}</div>
        </article>
      </div>

      <div id="teacherMsgSend" class="${msgTab==='enviar'?'':'hidden'}">
        <article class="card messages-form-card send-message-container">
          <div class="message-form-header">
            <h3 class="form-title" style="margin:0;">Enviar mensaje</h3>
            <div class="header-buttons-right">
              <button type="button" id="btn-toggle-all-students" class="btn-quick-tag ${window._isAllStudentsAdded?'active':''}" onclick="toggleAllCourseStudents()">Todos los alumnos del curso</button>
              <button type="button" id="btn-toggle-all-parents" class="btn-quick-tag ${window._isAllParentsAdded?'active':''}" onclick="toggleAllCourseParents()">Todos los padres del curso</button>
              <button type="button" class="btn-back-link btn secondary sm" onclick="window._teacherMsgTab='inbox';teacherMessagesPage()">&larr; Volver</button>
            </div>
          </div>

          <div class="form">
            <label class="full">Curso
              <select id="msgCourseSelect" class="search-input" onchange="window._selectedRecipients=[];window._isAllStudentsAdded=false;window._isAllParentsAdded=false;renderSelectedRecipients();">
                <option value="all">Todos mis cursos asignados</option>
                ${courseOptions}
              </select>
            </label>

            <div class="search-recipient-wrapper search-field-block search-field-wrapper single-search-row full" id="teacher-recipient-search-wrapper">
              <label class="full">Buscar destinatario por Nombre o Email</label>
              <div class="autocomplete-container recipient-search-container" style="width:100% !important;">
                <input type="text" id="recipient-search-input" placeholder="Escribe el nombre o correo del destinatario..." autocomplete="off" class="form-input-wide form-input-custom search-input" oninput="handleRecipientSearchInput(this.value)">
                <div id="recipient-suggestions-dropdown" class="suggestions-popover suggestions-dropdown-list" style="display:none;"></div>
              </div>
            </div>

            <div id="selectedRecipients" class="selected-recipients-chips chips-list-below selected-chips-wrapper selected-chips-row selected-chips-container recipient-chips-wrapper full"></div>

            <label class="full" style="margin-top:16px;">Mensaje
              <textarea id="msgText" required placeholder="Escribe tu mensaje..." oninput="document.getElementById('msgCharCount').textContent=this.value.length+' caracteres'"></textarea>
              <small class="muted" id="msgCharCount">0 caracteres</small>
            </label>
            <div class="form-submit-footer-right form-submit-footer form-footer-actions">
              <button id="sendMsgBtn" class="btn-send-main btn-submit-message btn primary">Enviar mensaje</button>
            </div>
          </div>
        </article>
      </div>
    </div></div>`;

  window._selectedRecipientId = null;
  window._selectedRecipients = [];
  var sendBtn = document.getElementById('sendMsgBtn');
  if(sendBtn) sendBtn.onclick = sendTeacherUnifiedMessage;
}

function sendTeacherUnifiedMessage(e){
  e.preventDefault();
  var btn=document.getElementById('sendMsgBtn');
  var text=document.getElementById('msgText').value.trim();
  if(!text){toast('Escribe un mensaje');return;}

  var targetUsers = [];
  var singleName = '';

  if(window._selectedRecipientId){
    let u = (state.db.users||[]).find(x => String(x.id) === String(window._selectedRecipientId));
    if(u){
      targetUsers = [u];
      singleName = typeof getUserDisplayName === 'function' ? getUserDisplayName(u).split(' (')[0] : u.email;
    }
  } else if(window._selectedRecipients && window._selectedRecipients.length){
    window._selectedRecipients.forEach(r => {
      let u = (state.db.users||[]).find(x => String(x.id) === String(r.id));
      if(u) targetUsers.push(u);
    });
  }

  if(!targetUsers.length){
    toast('Selecciona o busca al menos un destinatario');
    return;
  }

  if(btn){ btn.disabled = true; btn.textContent = 'Enviando...'; }

  var count = 0;
  targetUsers.forEach(function(u){
    var msg = createMessage(state.user.role, state.user.id, state.user.name, u.role, u.refId || u.id, u.email, null, text);
    if(typeof addN === 'function'){
      addN({
        toRole: u.role,
        studentId: u.role === 'estudiante' ? u.refId : null,
        parentId: u.role === 'padre' ? u.refId : null,
        teacherId: u.role === 'docente' ? u.refId : null,
        title: 'Mensaje de ' + state.user.name,
        text: text,
        link: 'mensajes',
        refType: 'message',
        messageId: msg.id
      });
    }
    count++;
  });

  save();
  if(btn){ btn.disabled = false; btn.textContent = 'Enviar mensaje'; }

  if(targetUsers.length === 1 && singleName){
    toast('Mensaje enviado exitosamente a ' + singleName);
  } else {
    toast('Mensaje enviado a ' + count + ' destinatario(s)');
  }

  window._selectedRecipientId = null;
  window._selectedRecipients = [];
  window._teacherMsgTab = 'inbox';
  teacherMessagesPage();
}
function parentMessagesPage(){
  let tab = window._parentMsgTab || 'inbox';
  content.innerHTML=`<div class="messages-wrapper">
    <div class="section-title messages-header-title"><h2>Mensajes</h2></div><div class="page-body">
    <div class="messages-tabs-row" style="display:flex;gap:8px;">
      <button class="btn ${tab!=='send'?'primary':'secondary'}" onclick="switchParentMsgTab('inbox')"> Bandeja</button>
      <button class="btn ${tab==='send'?'primary':'secondary'}" onclick="switchParentMsgTab('send')"> Enviar a docente</button>
    </div>
    <div id="parentMsgInbox" class="${tab==='send'?'hidden':''}"><article class="card messages-card-container"><h3>Bandeja de mensajes</h3><input type="text" id="parentMsgSearch" class="search-input messages-search-input" placeholder="Buscar..." oninput="debounceSearch('parentMsgSearch','parentMsgList')"><div id="parentMsgList">${parentMessageHistory()}</div></article></div>
    <div id="parentMsgSend" class="${tab==='send'?'':'hidden'}"><article class="card"><h3>Enviar mensaje a un docente</h3><label style="max-width:300px">Hijo <select id="parentMsgChild" class="full" onchange="loadParentContactTeachers()"></select></label><div id="parentContactList"></div></article></div>
  </div></div>`;
  loadParentContactTeachers();
}
function studentMessagesPage(){
  let tab = window._studentMsgTab || 'inbox';
  content.innerHTML=`<div class="messages-wrapper">
    <div class="section-title messages-header-title"><h2>Mensajes</h2></div><div class="page-body">
    <div class="messages-tabs-row" style="display:flex;gap:8px;">
      <button class="btn ${tab!=='send'?'primary':'secondary'}" onclick="switchStudentMsgTab('inbox')"> Bandeja</button>
      <button class="btn ${tab==='send'?'primary':'secondary'}" onclick="switchStudentMsgTab('send')"> Enviar a docente</button>
    </div>
    <div id="studentMsgInbox" class="${tab==='send'?'hidden':''}"><article class="card messages-card-container"><h3>Bandeja de mensajes</h3><input type="text" id="studentMsgSearch" class="search-input messages-search-input" placeholder="Buscar..." oninput="debounceSearch('studentMsgSearch','studentMsgList')"><div id="studentMsgList">${studentMessageHistory()}</div></article></div>
    <div id="studentMsgSend" class="${tab==='send'?'':'hidden'}"><article class="card"><h3>Enviar mensaje a un docente</h3><div id="studentContactList"></div></article></div>
  </div></div>`;
  loadStudentContactTeachers();
}
function switchParentMsgTab(tab){window._parentMsgTab=tab;parentMessagesPage()}
function switchStudentMsgTab(tab){window._studentMsgTab=tab;studentMessagesPage()}
function loadParentContactTeachers(){
  let sel=document.getElementById('parentMsgChild');
  if(!sel)return;
  let children=getChildren();
  if(!sel.options.length) sel.innerHTML=children.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')||'<option value="">Sin hijos</option>';
  let sid=+sel.value;
  if(!sid)return;
  let teachers=getContactTeachers('padre',state.user.id,sid);
  let el=document.getElementById('parentContactList');
  if(!el)return;
  el.innerHTML=teachers.length?teachers.map(t=>`<div class="task clean-task" style="border-left:4px solid var(--p)"><div class="stack"><b>${t.teacherName}</b><span class="muted">${t.courseName} · ${t.grade} ${t.section}</span></div><div class="actions"><button class="btn secondary" onclick="openParentCompose(${t.teacherId},'${t.teacherName}',${t.courseId},'${t.courseName}','${t.grade}','${t.section}')">Enviar mensaje</button></div></div>`).join(''):'<div class="alert info">No hay docentes disponibles para este hijo.</div>';
}
function loadStudentContactTeachers(){
  let teachers=getContactTeachers('estudiante',state.user.id);
  let el=document.getElementById('studentContactList');
  if(!el)return;
  el.innerHTML=teachers.length?teachers.map(t=>`<div class="task clean-task" style="border-left:4px solid var(--p)"><div class="stack"><b>${t.teacherName}</b><span class="muted">${t.courseName} · ${t.grade} ${t.section}</span></div><div class="actions"><button class="btn secondary" onclick="openStudentCompose(${t.teacherId},'${t.teacherName}',${t.courseId},'${t.courseName}','${t.grade}','${t.section}')">Enviar mensaje</button></div></div>`).join(''):'<div class="alert info">No hay docentes disponibles para tus cursos.</div>';
}
function openParentCompose(teacherId,teacherName,courseId,courseName,grade,section){
  openModal(`<h3>Mensaje a ${teacherName}</h3><p class="muted">${courseName} · ${grade} ${section}</p><textarea id="composeText" style="width:100%;min-height:100px;margin:12px 0;padding:8px;border:1px solid var(--line);border-radius:8px;resize:vertical" placeholder="Escribe tu mensaje..."></textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" onclick="modal.classList.add('hidden')">Cancelar</button><button class="btn primary" onclick="sendParentCompose(${teacherId},${courseId})">Enviar</button></div>`);
  setTimeout(()=>document.getElementById('composeText')?.focus(),100);
}
function openStudentCompose(teacherId,teacherName,courseId,courseName,grade,section){
  openModal(`<h3>Mensaje a ${teacherName}</h3><p class="muted">${courseName} · ${grade} ${section}</p><textarea id="composeText" style="width:100%;min-height:100px;margin:12px 0;padding:8px;border:1px solid var(--line);border-radius:8px;resize:vertical" placeholder="Escribe tu mensaje..."></textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" onclick="modal.classList.add('hidden')">Cancelar</button><button class="btn primary" onclick="sendStudentCompose(${teacherId},${courseId})">Enviar</button></div>`);
  setTimeout(()=>document.getElementById('composeText')?.focus(),100);
}
function sendParentCompose(teacherId,courseId){
  let text=document.getElementById('composeText');
  if(!text||!text.value.trim()){toast('Escribe un mensaje');return}
  let childSel=document.getElementById('parentMsgChild');
  let childId=childSel?+childSel.value:state.childId;
  sendParentToTeacher(state.user.id,childId,teacherId,courseId,text.value);
  modal.classList.add('hidden');toast('Mensaje enviado al docente');switchParentMsgTab('inbox');
}
function sendStudentCompose(teacherId,courseId){
  let text=document.getElementById('composeText');
  if(!text||!text.value.trim()){toast('Escribe un mensaje');return}
  sendStudentToTeacher(state.user.id,teacherId,courseId,text.value);
  modal.classList.add('hidden');toast('Mensaje enviado al docente');switchStudentMsgTab('inbox');
}
function teacherMessageHistory(search){
  let role='docente';
  let threads=getThreads(role,state.user.id,search);
  return renderThreads(threads,role);
}
function parentMessageHistory(search){
  let role='padre';
  let threads=getThreads(role,state.user.id,search);
  return renderThreads(threads,role);
}
function studentMessageHistory(search){
  let role='estudiante';
  let threads=getThreads(role,state.user.id,search);
  return renderThreads(threads,role);
}
function renderThreads(threads,role){
  return threads.map(t=>{
    let tid=safeId(t.id);
    let last=t.last;
    let participants=[...t.participants].join(', ');
    let canReplyThread = t.messages.some(m=>canReply(m));
    return `<div class="chat-thread ${t.unread?'unread':''}">
      <div class="chat-thread-summary" onclick="toggleThread('${tid}')">
        <div class="chat-thread-info">
          <div class="chat-thread-participants"><b>${participants}</b> ${t.unread?`<span class="badge">${t.unread}</span>`:''}</div>
          <div class="chat-thread-preview">${last.text}</div>
          <small>${last.time} ${last.courseId?`· ${cn(last.courseId)}`:''}</small>
        </div>
      </div>
      <div id="thread_${tid}" class="chat-thread-body hidden">
        ${t.messages.map(m=>renderMessageDetail(m)).join('')}
        ${canReplyThread ? `<div class="chat-answer">
          <input id="reply_${tid}" placeholder="Escribir respuesta...">
          <button class="btn secondary" onclick="replyMsg('${t.id}')">Responder</button>
        </div>` : `<div style="padding:8px;font-size:0.85rem;color:var(--mut);text-align:center;">No puedes responder a esta conversación.</div>`}
      </div>
    </div>`;
  }).join("") || '<div style="padding:40px;text-align:center;color:var(--mut)"><p style="margin:0;font-size:1rem">No tienes conversaciones registradas.</p></div>';
}
function renderMessageDetail(m){
  let isMe = String(m.senderId || m.fromId) === String(state.user.id) && m.fromRole === state.user.role;
  let alignRow = isMe ? 'flex-end' : 'flex-start';
  let bubbleBg = isMe ? '#2563eb' : '#f1f5f9';
  let textColor = isMe ? '#ffffff' : '#1e293b';
  let subTextColor = isMe ? 'rgba(255,255,255,0.85)' : '#64748b';
  let borderStyle = isMe ? 'none' : '1px solid #e2e8f0';
  let borderRadius = isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px';
  let mainHtml = `<div style="display:flex;justify-content:${alignRow};margin-bottom:12px;width:100%">`+
    `<div style="max-width:75%;background:${bubbleBg};color:${textColor};padding:10px 14px;border-radius:${borderRadius};box-shadow:0 1px 3px rgba(0,0,0,0.06);border:${borderStyle}">`+
    `<div style="font-size:0.8rem;font-weight:600;margin-bottom:4px;color:${subTextColor}">${isMe?'Tu':m.fromName}</div>`+
    `<div style="font-size:0.95rem;line-height:1.4">${m.text}</div>`+
    `<div style="font-size:0.7rem;text-align:right;margin-top:6px;color:${subTextColor}">${m.time}${m.courseId?' · '+cn(m.courseId):''}</div>`+
    `</div></div>`;
  let replies=(m.replies||[]).map(r=>{
    let rIsMe = String(r.senderId || r.fromId) === String(state.user.id) && r.fromRole === state.user.role;
    let rAlign = rIsMe ? 'flex-end' : 'flex-start';
    let rBg = rIsMe ? '#2563eb' : '#f1f5f9';
    let rColor = rIsMe ? '#ffffff' : '#1e293b';
    let rSub = rIsMe ? 'rgba(255,255,255,0.85)' : '#64748b';
    let rBorder = rIsMe ? 'none' : '1px solid #e2e8f0';
    let rRadius = rIsMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px';
    return `<div style="display:flex;justify-content:${rAlign};margin-bottom:8px;padding-left:${rIsMe?'0':'20px'};padding-right:${rIsMe?'20px':'0'}">`+
      `<div style="max-width:75%;background:${rBg};color:${rColor};padding:8px 12px;border-radius:${rRadius};box-shadow:0 1px 2px rgba(0,0,0,0.06);border:${rBorder}">`+
      `<div style="font-size:0.75rem;font-weight:600;margin-bottom:2px;color:${rSub}">${rIsMe?'Tu':r.fromName}</div>`+
      `<div style="font-size:0.9rem;line-height:1.4">${r.text}</div>`+
      `<div style="font-size:0.65rem;text-align:right;margin-top:4px;color:${rSub}">${r.time||''}</div>`+
      `</div></div>`;
  }).join("");
  return `<div style="padding:4px 0">${mainHtml}${replies?`<div style="padding-left:12px;margin-left:8px">${replies}</div>`:''}</div>`;
}
function toggleThread(tid){
  let el=document.getElementById("thread_"+tid);
  if(!el)return;
  el.classList.toggle("hidden");
  let summary=el.parentElement.querySelector(".chat-thread-summary");
  if(summary)summary.classList.toggle("expanded");
  if(!el.classList.contains("hidden")){
    markThreadRead(tid,state.user.role,state.user.id);
    save();
  }
}
function toggleDmThread(tid,event){
  if(event&&event.target.tagName==='BUTTON')return;
  let el=document.getElementById("dmthread_"+tid);
  if(!el)return;
  el.classList.toggle("hidden");
}
function debounceSearch(inputId,listId){
  clearTimeout(window._msgSearch);
  window._msgSearch=setTimeout(()=>{
    let q=document.getElementById(inputId)?.value;
    let el=document.getElementById(listId);
    if(!el)return;
    if(q){
      let role=inputId.includes('teacher')?'docente':inputId.includes('parent')?'padre':'estudiante';
      el.innerHTML=renderThreads(getThreads(role,state.user.id,q),role);
    }else{
      if(inputId.includes('teacher'))el.innerHTML=teacherMessageHistory();
      else if(inputId.includes('parent'))el.innerHTML=parentMessageHistory();
      else el.innerHTML=studentMessageHistory();
    }
  },250);
}
function sendParentMessage(e){
  e.preventDefault();
  sendParentBtn.disabled=true;sendParentBtn.textContent='Enviando...';
  try{
    if(!sendParentMessages(pmCourse.value,pmText.value,pmType.value,pmStudent.value)){sendParentBtn.disabled=false;sendParentBtn.textContent='Enviar a padres';return}
  }catch(ex){
    sendParentBtn.disabled=false;sendParentBtn.textContent='Enviar a padres';
    toast('Error al enviar: '+ex.message);return;
  }
  toast("Mensaje enviado a padres");openPage("mensajes");
}
function sendStudentMessage(e){
  e.preventDefault();
  sendStudentBtn.disabled=true;sendStudentBtn.textContent='Enviando...';
  try{
    if(!sendStudentMessages(smCourse.value,smText.value,smType.value,smStudent.value)){sendStudentBtn.disabled=false;sendStudentBtn.textContent='Enviar a alumnos';return}
  }catch(ex){
    sendStudentBtn.disabled=false;sendStudentBtn.textContent='Enviar a alumnos';
    toast('Error al enviar: '+ex.message);return;
  }
  toast("Mensaje enviado a alumnos");openPage("mensajes");
}
function replyMsg(threadId){
  let tid=safeId(threadId);
  let input=document.getElementById("reply_"+tid);
  let msgs=getThreadMessages(threadId);
  let firstMsg=msgs[0];
  let targetId=firstMsg?firstMsg.id:threadId;
  if(!processReply(targetId,input?.value||""))return;
  toast("Respuesta enviada");openPage("mensajes");
}
