function closeNotificationsPanel(){
  let dr = document.getElementById("drawer");
  if(dr) dr.classList.add("hidden");
}

function selectCourse(courseId, tab){
  tab = tab || 'curso';
  if(!state.user) return;
  let role = state.user.role;
  if(role === 'docente'){
    window._tCourseTab = tab;
    return teacherCourseDetail(courseId);
  }
  if(role === 'padre'){
    let sid = state.childId || (getChildren()[0]?.id);
    if(sid) state.childId = sid;
    window._courseDetailTab = tab;
    return courseDetail(state.childId, courseId, tab);
  }
  if(role === 'estudiante'){
    window._courseDetailTab = tab;
    return courseDetail(state.user.id, courseId, tab);
  }
  return openPage('cursos');
}

window.MapsToCourse = selectCourse;

function openTaskDetail(courseId, taskId){
  selectCourse(courseId, 'entregas');
  if(taskId){
    if(state.user && state.user.role === 'docente'){
      taskSubmissionPanel(taskId);
    } else {
      let sid = state.user ? (state.user.role === 'padre' ? (state.childId || state.user.id) : state.user.id) : 0;
      openTask(sid, taskId);
    }
  }
}

function childSelect(){return `<article class="card"><h3>Seleccionar hijo</h3><select onchange="state.childId=+this.value;openPage(state.page)">${getChildren().map(x=>`<option value="${x.id}" ${x.id===state.childId?'selected':''}>${x.name} · ${x.grade} ${x.section}</option>`).join('')}</select></article>`}

function courseCards(sid){
  let courses=studentCourses(sid);
  if(!courses.length)return '<div class="alert info"><b>Sin cursos</b><span>No hay cursos asignados.</span></div>';
  const banners = ['banner-grey','banner-orange','banner-teal','banner-purple','banner-lightgrey','banner-blue','banner-pink','banner-green'];
  let cards = courses.map(function(c,i){
    let banner = banners[i % banners.length];
    return '<article class="course-card-clickable" onclick="courseDetail('+sid+','+c.id+')">'+
      '<div class="course-card-top '+banner+'">'+
        '<span class="course-card-icon">&#9733;</span>'+
      '</div>'+
      '<div class="course-card-bottom">'+
        '<h3>'+c.name+'</h3>'+
        '<p class="course-card-meta">'+tn(c.teacherId)+' &middot; '+c.grade+' '+c.section+'</p>'+
      '</div>'+
    '</article>';
  }).join('');
  return '<div class="auto">'+cards+'</div>';
}

function gradesTable(g){if(!g||!g.length)return `<div class="alert info"><b>Sin notas</b><span>Aún no hay notas registradas.</span></div>`;return `<table class="table"><tr><th>Curso</th><th>Eval.</th><th>Nota</th><th>Bim.</th><th>Fecha</th></tr>${rows(g.map(x=>[cn(x.courseId),x.name,x.score,x.bim||'I',x.date]))}</table>`}

function taskRows(sid,list,can){let html=list.map(a=>{let s=sub(a.id,sid);return `<div class="task">${thumb(a)}<div class="stack"><b>${a.title}</b> ${badge(cn(a.courseId))}<span class="muted">${a.description}</span><span class="muted">Entrega: ${a.due}</span>${s?.fileName?`<b class="ok">Entregado: ${s.fileName}</b>`:badge('Pendiente','b-warn')}</div><div class="actions"><button class="btn secondary" onclick="openTask(${sid},${a.id})">Abrir</button>${can?`<button class="btn secondary" onclick="submitView(${a.id})">Subir</button>`:''}</div></div>`}).join('')||'<div class="alert good"><b>Sin tareas</b></div>';return `<div class="scroll-y">${html}</div>`}

function openTask(sid,aid){
  let a=state.db.assignments.find(x=>x.id==aid);
  if(!a)return;
  let s=sub(aid,sid);
  let isStudent=state.user.role==='estudiante';
  let html='<div class="modal-task-detail">';
  html+='<div class="modal-task-header"><h2>'+a.title+'</h2><p>'+cn(a.courseId)+' &middot; Entrega: '+a.due+'</p></div>';
  html+='<div class="modal-task-section"><h3>Indicaciones</h3><p>'+a.description+'</p>';
  if(a.fileName){
    html+='<div class="resource-row"><span>&#8227; '+a.fileName+'</span>';
    if(a.fileData){html+=' <button class="btn secondary sm" onclick="window.open(\''+a.fileData+'\',\'_blank\')">Descargar</button>';}
    html+='</div>';
  }
  html+='</div>';
  html+='<div class="modal-task-section">';
  if(s&&s.fileName){
    html+='<h3>Estado de la entrega</h3>';
    html+='<div class="alert good"><b>'+s.fileName+'</b><span>'+(s.comment||'Sin comentario')+'</span></div>';
    if(s.submittedAt){html+='<p class="muted">Enviado: '+s.submittedAt+'</p>';}
  }else{
    html+='<h3>Estado de la entrega</h3><p class="muted">Sin entrega enviada.</p>';
  }
  html+='</div>';
  if(isStudent){
    html+='<div class="modal-task-section"><h3>'+(s&&s.fileName?'Actualizar entrega':'Subir tarea')+'</h3>';
    html+='<form id="sf" class="form">';
    html+='<label class="full">Archivo<input id="studentTaskFile" type="file" required></label>';
    html+='<label class="full">Comentario<textarea id="studentTaskComment" placeholder="Comentario para el docente"></textarea></label>';
    html+='<div class="full"><button class="btn primary" type="submit">Enviar tarea</button></div>';
    html+='</form></div>';
  }
  html+='</div>';
  openModal(html);
  var form=document.getElementById('sf');
  if(form){form.onsubmit=function(e){submitTaskFixed(e,aid)};}
}

function submitView(aid){openTask(state.user.id,aid)}

async function submitTaskFixed(e, aid){
  e.preventDefault();
  loading('Enviando tarea...');
  const fileInput = document.getElementById("studentTaskFile");
  const commentInput = document.getElementById("studentTaskComment");
  if(!fileInput || !fileInput.files || !fileInput.files[0]){stopLoading();toast("Selecciona un archivo para enviar la tarea.");return false;}
  const uploadedFile = fileInput.files[0];
  const maxSize=10*1024*1024;
  const allowedTypes=['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'];
  if(uploadedFile.size>maxSize){stopLoading();toast("El archivo supera los 10 MB permitidos.");return false;}
  if(!allowedTypes.includes(uploadedFile.type)&&uploadedFile.type){stopLoading();toast("Tipo de archivo no permitido. Sube PDF, Word, Excel, imagen o texto.");return false;}
  const sid = state.user.id;
  const task = state.db.assignments.find(a=>a.id==aid);
  if(!task){toast("No se encontró la tarea.");return false;}
  let submission = state.db.submissions.find(s=>s.assignmentId==aid && s.studentId==sid);
  if(!submission){submission = {assignmentId:aid, studentId:sid};state.db.submissions.push(submission);}
  submission.status = "Entregado";
  submission.submittedAt = today();
  submission.fileName = uploadedFile.name;
  submission.fileType = uploadedFile.type || "archivo";
  submission.comment = commentInput ? commentInput.value : "";
  submission.fileData = await fileData(uploadedFile);
  let stu = st(sid);
  stu.stars = (stu.stars || 0) + 10;
  addN({toRole:"docente",teacherId:task.createdBy,title:"Nueva entrega",text:`${stu.name} entregó ${task.title}.`,link:"entregas",refType:"submission",assignmentId:task.id,studentId:sid,courseId:task.courseId});
  addN({toRole:"padre",parentId:stu.parentId,title:"Tarea entregada",text:`${stu.name} entregó ${task.title} y ganó +10 estrellas.`,link:"cursos",refType:"task",assignmentId:task.id,studentId:sid,courseId:task.courseId});
  addN({toRole:"estudiante",studentId:sid,title:"Tarea enviada",text:`Tu tarea ${task.title} fue enviada correctamente.`,link:"tareas",refType:"task",assignmentId:task.id,studentId:sid,courseId:task.courseId});
  addTL(`${stu.name} entregó ${task.title}`, sid);
  save();
  modal.classList.add("hidden");
  stopLoading();
  toast("Tarea enviada correctamente.");
  if(state.user.role==="estudiante"){openPage("tareas");}
  return false;
}

function renderScheduleGrid(entries,opts){
  opts=opts||{};
  var days=['Lun','Mar','Mie','Jue','Vie'];
  var allSlots=['08:00','09:00','10:20','11:40'];
  var tl={'08:00':'08:00 - 09:00','09:00':'09:00 - 10:00','10:20':'10:20 - 11:40','11:40':'11:40 - 13:00'};
  var showSection=opts.showSection||false;
  var editable=opts.editable||false;
  var onCell=opts.onCell||null;
  var navSid=opts.sid||(state.user.role==='padre'?state.childId:state.user.id)||0;
  var lookup={};
  entries.forEach(function(e){lookup[e.day+'-'+e.hour]=e;});
  var skip={};
  function cellContent(e){
    if(!e||!e.courseId)return '';
    var c=state.db.courses.find(function(x){return x.id===e.courseId;});
    var name=c?c.name:'';
    if(showSection&&c)name+=' '+c.grade+' '+c.section;
    var teacher='';
    if(c&&c.teacherId){
      var t=state.db.teachers.find(function(x){return x.id===c.teacherId;});
      if(t)teacher=t.name;
    }
    var h='<div class="sch-course-name" style="font-weight:700;font-size:0.9rem">'+name+'</div>';
    if(teacher)h+='<div class="sch-teacher-name" style="font-size:0.75rem;opacity:0.8">'+teacher+'</div>';
    return h;
  }
  var html='<table class="schedule-table sch-table"><thead><tr><th>Hora</th>'+days.map(function(d){return '<th>'+d+'</th>';}).join('')+'</tr></thead><tbody>';
  for(var hi=0;hi<allSlots.length;hi++){
    var h=allSlots[hi];
    html+='<tr><td class="sch-time">'+tl[h]+'</td>';
    for(var di=0;di<days.length;di++){
      var d=days[di];
      var key=d+'-'+h;
      if(skip[key]){continue;}
      var e=lookup[key];
      var merged=false;
      var nextH=allSlots[hi+1];
      if(nextH){
        var nextKey=d+'-'+nextH;
        var ne=lookup[nextKey];
        if(e&&ne&&e.courseId===ne.courseId){
          skip[nextKey]=true;
          merged=true;
        }
      }
      var rs=merged?' rowspan="2"':'';
      var tdClass='';
      var click='';
      if(e&&e.courseId){
        tdClass=' course-cell';
        click=' onclick="courseDetail('+navSid+','+e.courseId+')" style="cursor:pointer"';
      }else if(!editable){
        tdClass=' sch-empty';
      }
      if(editable&&onCell){
        click=' onclick="('+onCell+')(\''+d+'\',\''+h+'\')"';
        tdClass='';
      }
      html+='<td class="'+tdClass+'"'+rs+click+'>';
      if(e&&e.courseId){
        html+=cellContent(e);
      }else if(editable){
        html+='<div class="sch-no-teacher"><span class="sch-no-teacher-label">Por asignar</span></div>';
      }else{
        html+='<span class="muted">&mdash;</span>';
      }
      html+='</td>';
    }
    html+='</tr>';
    if(h==='09:00'){
      html+='<tr class="sch-recreo break-row"><td class="sch-time sch-recreo-time">10:00 - 10:20</td>';
      days.forEach(function(d){html+='<td class="sch-recreo-cell">RECREO INSTITUCIONAL</td>'});
      html+='</tr>';
    }
  }
  html+='<tr class="sch-salida dismissal-row"><td class="sch-time">13:00</td>';
  days.forEach(function(d){html+='<td>SALIDA</td>'});
  html+='</tr>';
  return html+'</tbody></table>';
}

function recommend(sid){let a=+avg(sid);if(a<11)return `<div class="alert critical"><b>Riesgo alto</b><span>Revisar rutina de estudio y reforzar cursos críticos.</span></div>`;if(a<14)return `<div class="alert medium"><b>Riesgo medio</b><span>Supervisar tareas pendientes y estudiar 30 minutos diarios.</span></div>`;if(a>=16)return `<div class="alert good"><b>Felicitación</b><span>Excelente rendimiento. Mantener hábitos y reconocer el esfuerzo.</span></div>`;return `<div class="alert info"><b>Seguimiento estable</b></div>`}

function parentLowAlerts(sid){
  let lows=state.db.grades.filter(g=>g.studentId===sid && Number(g.score)<11).slice(0,4);
  if(!lows.length) return `<div class="alert good"><b>Sin notas bajas recientes</b><span>El estudiante no presenta alertas críticas.</span></div>`;
  let html=lows.map(g=>`<div class="alert critical"><b>Alerta: ${cn(g.courseId)}</b><span>Nota ${g.score}. Recomendación: revisar tarea, reforzar el tema y comunicarse con el docente.</span></div>`).join("");
  return `<div class="alerts-stack">${html}</div>`;
}

function upcomingForStudent(sid){
  let list=studentTasks(sid).filter(a=>{let s=sub(a.id,sid);return !s || s.status==="Pendiente";}).slice(0,6);
  let html=list.map(a=>`<button class="cal-event" onclick="courseDetail(${sid},${a.courseId})"><b>${a.due}</b><span>${a.title}</span><small>${cn(a.courseId)}</small></button>`).join("") || `<p class="muted">No hay tareas pendientes.</p>`;
  return `<div class="scroll-y">${html}</div>`;
}

function syllabusCard(cid){
  let s=syllabusOf(cid);
  return `<article class="card syllabus-card"><h3>Sílabo del curso</h3><p><b>${s.title}</b></p><p>${s.description}</p><p class="muted">Archivo: ${s.fileName||"Sin archivo"} · Publicado: ${s.publishedAt||"-"}</p>${state.user.role==="docente"?`<button class="btn secondary" onclick="openSyllabusEditor(${cid})">Actualizar sílabo</button>`:""}</article>`;
}

function userProfilePage(){
  let u=state.user;
  let avatarLg=`<div style="width:100px;height:100px;border-radius:50%;background:var(--soft);color:var(--p);display:grid;place-items:center;font-size:2.5rem;font-weight:800;margin:0 auto 16px">${u.short}</div>`;
  let coursesHtml='<p class="muted">No hay cursos asignados.</p>';
  if(u.role==='docente')coursesHtml=myCoursesDoc().map(c=>`<p style="color:var(--p);font-weight:600;font-size:.9rem;margin:6px 0">${c.name} - ${c.grade} ${c.section}</p>`).join('');
  if(u.role==='estudiante')coursesHtml=studentCourses(u.id).map(c=>`<p style="color:var(--p);font-weight:600;font-size:.9rem;margin:6px 0">${c.name} - ${c.grade} ${c.section}</p>`).join('');
  content.innerHTML=`
    <div class="page-body" style="background:#fff;padding:40px 24px;border-radius:var(--radius);border:1px solid var(--line);margin-top:20px">
      <div style="text-align:center;margin-bottom:40px;border-bottom:1px solid var(--line);padding-bottom:30px">
        ${avatarLg}
        <h2 style="color:var(--p);font-size:1.8rem;margin:0">${u.name.toUpperCase()}</h2>
        <p class="muted" style="margin-top:8px">Rol: ${u.roleName}</p>
      </div>
      <div class="grid3" style="align-items:start">
        <div>
          <h3 style="color:var(--mut);font-size:1rem;margin-bottom:16px">Detalles de usuario</h3>
          <p style="margin:8px 0"><b>Direccion de correo</b><br><span style="color:var(--p)">${u.email}</span></p>
          <p style="margin:8px 0"><b>Pais</b><br>Peru</p>
          <p style="margin:8px 0"><b>Ciudad</b><br>Chiclayo</p>
          <p style="margin:8px 0"><b>Zona horaria</b><br>America/Lima</p>
        </div>
        <div>
          <h3 style="color:var(--mut);font-size:1rem;margin-bottom:16px">Detalles del curso</h3>
          <b>Perfiles de curso</b>
          <div style="margin-top:8px">${coursesHtml}</div>
        </div>
        <div>
          <h3 style="color:var(--mut);font-size:1rem;margin-bottom:16px">Privacidad y Politicas</h3>
          <p style="color:var(--p);cursor:pointer">Resumen de retencion de datos</p>
        </div>
      </div>
    </div>`;
}

function userTimelinePage(){
  let list=state.db.timeline||[];
  if(state.user.role==='estudiante')list=list.filter(x=>x.studentId==state.user.id);
  if(state.user.role==='padre')list=list.filter(x=>x.studentId==state.childId);
  let timelineHtml=list.slice(0,50).map(x=>`<div class="tl"><b>${x.date}</b><p>${x.text}</p></div>`).join('')||'<div class="empty-state">Sin eventos recientes.</div>';
  content.innerHTML=`
    <div class="section-title"><h2>Bitacora de Actividades</h2><p class="muted">Historial de acciones recientes</p></div>
    <div class="page-body">
      <article class="card">
        <div class="timeline" style="padding:16px">
          ${timelineHtml}
        </div>
      </article>
    </div>`;
}
