function publishPage(){
  let courses=myCoursesDoc();
  let todayVal=today();
  content.innerHTML=`<div class="section-title"><h2>Publicar tarea</h2></div><div class="page-body"><article class="card"><h3>Nueva tarea</h3><form id="pf" class="form"><label>Curso asignado<select id="pcourse">${courses.length?courses.map(c=>`<option value="${c.id}">${c.name} &middot; ${c.grade} ${c.section}</option>`).join(""):`<option>No hay cursos asignados</option>`}</select></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label>Inicio de entrega<input id="startDate" type="date" value="${todayVal}" required></label><label>Hora inicio<input id="startTime" type="time" value="08:00"></label><label>Fecha limite<input id="dueDate" type="date" value="${todayVal}" required></label><label>Hora limite<input id="dueTime" type="time" value="23:59"></label></div><label class="full">Titulo<input id="ptitle" required autofocus></label><label class="full">Indicaciones<textarea id="pdesc"></textarea></label><label class="full">Archivo<input id="pfile" type="file"></label><div class="full"><button class="btn primary">Publicar</button></div></form></article><article class="card"><h3>Publicadas</h3>${teacherTasksTable()}</article></div>`;
  pf.onsubmit=publishTask;
}

async function publishTask(e){
  e.preventDefault();
  loading('Publicando tarea...');
  let f=pfile.files[0],cid=+pcourse.value,c=state.db.courses.find(x=>x.id==cid),id=Date.now();
  let a={id,courseId:cid,title:ptitle.value,description:pdesc.value||'Desarrollar y subir evidencia.',startDate:startDate.value,startTime:startTime.value,dueDate:dueDate.value,dueTime:dueTime.value,due:dueDate.value,fileName:f?f.name:'material.png',fileType:f?f.type:'image/png',fileData:f?await fileData(f):placeholder(ptitle.value),createdBy:state.user.id};
  state.db.assignments.unshift(a);
  studentsOfCourse(c).forEach(stu=>{
    state.db.submissions.push({assignmentId:id,studentId:stu.id,status:'Pendiente'});
    addN({toRole:'estudiante',studentId:stu.id,title:'Nueva tarea',text:`${a.title} de ${c.name}`,link:'tareas'});
    addN({toRole:'padre',parentId:stu.parentId,title:'Nueva tarea',text:`${stu.name} recibio ${a.title}.`,link:'cursos'});
  });
  addTL(`Docente publico ${a.title} en ${c.grade} ${c.section}`);
  save();stopLoading();toast('Tarea publicada');openPage('publicar');
}

function submissionsPage(){
  let ids=myCoursesDoc().map(c=>c.id);
  let list=state.db.assignments.filter(a=>ids.includes(a.courseId));
  content.innerHTML=`<div class="section-title"><h2>Entregas por tarea</h2></div><div class="page-body"><article class="card"><h3>Tareas publicadas</h3><p class="muted">Selecciona una tarea para ver entregados/no entregados y calificar.</p>${list.length?list.map(a=>{let subs=state.db.submissions.filter(s=>s.assignmentId==a.id);let done=subs.filter(s=>s.status!=="Pendiente").length;return `<div class="task clean-task"><div class="thumb">${a.fileName||"Archivo"}</div><div class="stack"><b>${a.title}</b> ${badge(cn(a.courseId))}<span class="muted">Entrega: ${a.due}</span><span class="ok">Entregaron: ${done}</span> · <span class="bad">No entregaron: ${subs.length-done}</span></div><div class="actions"><button class="btn secondary" onclick="taskSubmissionPanel(${a.id})">Ver alumnos</button><button class="btn primary" onclick="taskGradePanel(${a.id})">Calificar</button></div></div>`}).join(""):`<div class="empty-state">Aún no has publicado tareas.</div>`}</article></div>`;
}

/* ============================================
   FLOW 1 — Unified submission table for a task
   ============================================ */
function taskSubmissionPanel(aid){
  var a=state.db.assignments.find(function(x){return x.id==aid});
  if(!a)return toast('Tarea no encontrada');
  var c=state.db.courses.find(function(x){return x.id==a.courseId});
  var all=studentsOfCourse(c).map(function(stu){
    var s=sub(aid,stu.id);
    if(!s){s={assignmentId:aid,studentId:stu.id,status:'Pendiente'};state.db.submissions.push(s);}
    return s;
  });
  var delivered=all.filter(function(s){return s.status!=='Pendiente'});
  var pend=all.filter(function(s){return s.status==='Pendiente'});
  save();

  var backAction="window._tCourseTab='entregas';teacherCourseDetail("+c.id+")";
  var tableRows='';
  all.forEach(function(s){
    var stu=st(s.studentId);
    var isDelivered=s.status!=='Pendiente';
    var badge=isDelivered
      ?'<span style="background:var(--ok);color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600">Entregado</span>'
      :'<span style="background:var(--r);color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600">Pendiente</span>';
    var fecha=s.submittedAt||'\u2014';
    tableRows+='<tr>'+
      '<td><b>'+stu.name+'</b></td>'+
      '<td>'+a.title+'</td>'+
      '<td>'+fecha+'</td>'+
      '<td>'+badge+'</td>'+
      '<td style="white-space:nowrap">'+
        '<button class="btn secondary" style="font-size:.8rem;padding:4px 10px" onclick="viewStudentSubmission('+aid+','+s.studentId+')">Ver</button> '+
        '<button class="btn primary" style="font-size:.8rem;padding:4px 10px" onclick="viewStudentSubmission('+aid+','+s.studentId+')">Calificar</button>'+
      '</td>'+
    '</tr>';
  });

  content.innerHTML=
    '<section class="section-title"><div>'+
      '<h2>'+a.title+'</h2>'+
      '<p>'+c.name+' \u00b7 '+c.grade+' \u00b7 Seccion '+c.section+'</p>'+
    '</div><div class="hdr-actions">'+
      '<button class="btn secondary" onclick="'+backAction+'">Volver</button>'+
    '</div></section>'+
    '<div class="page-body">'+
      '<p style="font-weight:700;font-size:.95rem;margin-bottom:4px">'+
        '<span style="color:var(--ok)">'+delivered.length+' entregados</span> / '+
        '<span style="color:var(--r)">'+pend.length+' pendientes</span>'+
      '</p>'+
      '<article class="card">'+
        '<h3>Entregas del curso</h3>'+
        (all.length
          ?'<table class="table"><tr><th>Alumno</th><th>Tarea</th><th>Fecha Entrega</th><th>Estado de Entrega</th><th>Accion</th></tr>'+tableRows+'</table>'
          :'<div class="empty-state">No hay alumnos matriculados en este curso.</div>'
        )+
      '</article>'+
    '</div>';
}

function notifyMissing(aid,sid){
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var stu=st(sid);
  addN({toRole:'padre',parentId:stu.parentId,title:'Tarea pendiente',text:stu.name+' aun no entrego '+a.title+'.',link:'cursos',refType:'task',assignmentId:aid,studentId:sid,courseId:a.courseId});
  addN({toRole:'estudiante',studentId:sid,title:'Tarea pendiente',text:'Recuerda entregar '+a.title+'.',link:'tareas',refType:'task',assignmentId:aid,studentId:sid,courseId:a.courseId});
  save();toast('Aviso enviado.');
}

/* ============================================
   FLOW 3 — Full-screen grading layout 70/30
   ============================================ */
function viewStudentSubmission(aid, sid){
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var stu=st(sid);
  var s=sub(aid,sid);
  if(!a||!stu)return toast('No encontrado');
  if(!s){s={assignmentId:aid,studentId:sid,status:'Pendiente'};state.db.submissions.push(s);save();}

  var isDelivered=s.status!=='Pendiente';
  var fileName=s.fileName||'Sin archivo';
  var submittedAt=s.submittedAt||'Sin fecha';
  var currentScore=s.score!=null?s.score:'';
  var currentComment=s.comment||s.feedback||'';
  var fileDataSrc=s.fileData||'';

  var statusBadge=isDelivered
    ?'<span class="status-badge delivered">Enviado para calificar</span>'
    :'<span class="status-badge pending">Pendiente de entrega</span>';

  var previewContent='';
  if(fileDataSrc){
    var ft=s.fileType||'';
    if(ft.indexOf('image')>=0){
      previewContent='<img src="'+fileDataSrc+'" alt="'+fileName+'" style="max-width:100%;max-height:100%;object-fit:contain">';
    }else if(ft.indexOf('pdf')>=0||fileName.match(/\.pdf$/i)){
      previewContent='<iframe src="'+fileDataSrc+'" style="width:100%;height:100%;border:none;border-radius:var(--radius)"></iframe>';
    }else{
      previewContent='<embed src="'+fileDataSrc+'" type="'+(ft||'application/octet-stream')+'" style="width:100%;height:100%;border:none">';
    }
  }else{
    previewContent=
      '<div style="text-align:center;padding:40px;color:var(--mut)">'+
        '<div style="font-size:3rem;margin-bottom:16px">&#9998;</div>'+
        '<p style="font-size:1.1rem;font-weight:600;color:var(--text)">'+a.title+'</p>'+
        '<p style="margin-top:8px">'+stu.name+' no ha adjuntado archivo.</p>'+
        '<div style="margin-top:20px;padding:20px;background:#fff;border-radius:var(--radius);border:1px solid var(--line);max-width:500px;margin-left:auto;margin-right:auto;text-align:left">'+
          '<p style="font-weight:700;margin-bottom:8px">Descripcion de la tarea:</p>'+
          '<p style="color:var(--mut);line-height:1.6">'+(a.description||'Sin descripcion disponible.')+'</p>'+
          '<p style="margin-top:12px;font-weight:600">Fecha de entrega: '+a.due+'</p>'+
        '</div>'+
      '</div>';
  }

  var nextSid=getNextUndradedSid(aid,sid);
  var nextBtnHtml=nextSid
    ?'<button class="btn primary sm" type="submit" data-action="next">Guardar y mostrar siguiente</button>'
    :'<button class="btn primary sm" type="submit">Guardar cambios</button>';

  content.innerHTML=
    '<div class="grading-layout">'+
      '<div class="grading-preview">'+
        '<div class="grading-preview-bar">'+
          '<button class="btn secondary" style="font-size:.8rem;padding:4px 12px" onclick="taskSubmissionPanel('+aid+')">&#8592; Volver</button>'+
          '<b>'+a.title+'</b>'+
          '<span class="muted">'+fileName+'</span>'+
        '</div>'+
        '<div class="grading-preview-frame">'+previewContent+'</div>'+
      '</div>'+
      '<div class="grading-sidebar">'+
        '<div class="grading-sidebar-header">'+
          '<h3>'+stu.name+'</h3>'+
          '<div class="student-email">'+(stu.email||'')+'</div>'+
          '<div class="submission-date">Enviado: '+submittedAt+'</div>'+
          statusBadge+
        '</div>'+
        '<form class="grading-sidebar-body" id="gradingForm" onsubmit="saveSubmissionGrade('+aid+','+sid+',event)">'+
          '<label>Calificacion sobre 20'+
            '<input id="subGrade" type="number" min="0" max="20" step="0.5" value="'+currentScore+'" placeholder="0 - 20" style="font-size:1.1rem;padding:10px 12px;font-weight:700">'+
          '</label>'+
          '<label>Comentarios de retroalimentacion'+
            '<textarea id="subComment" rows="5" placeholder="Escribe observaciones, sugerencias...">'+currentComment+'</textarea>'+
          '</label>'+
        '</form>'+
        '<div class="grading-sidebar-footer" style="display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--line)">'+
          '<button class="btn secondary sm" type="button" onclick="taskSubmissionPanel('+aid+')">Cancelar</button>'+
          nextBtnHtml+
        '</div>'+
      '</div>'+
    '</div>';

  var footerBtns=document.querySelectorAll('.grading-sidebar-footer .btn');
  var saveBtn=footerBtns[footerBtns.length-1];
  if(saveBtn){
    saveBtn.onclick=function(e){
      e.preventDefault();
      var action=saveBtn.getAttribute('data-action');
      saveSubmissionGradeFlow(aid,sid,action==='next');
    };
  }
}

function getNextUndradedSid(aid,currentSid){
  var a=state.db.assignments.find(function(x){return x.id==aid});
  if(!a)return null;
  var c=state.db.courses.find(function(x){return x.id==a.courseId});
  var all=studentsOfCourse(c).map(function(stu){
    return sub(aid,stu.id)||{assignmentId:aid,studentId:stu.id,status:'Pendiente'};
  });
  var foundCurrent=false;
  for(var i=0;i<all.length;i++){
    if(all[i].studentId==currentSid){foundCurrent=true;continue;}
    if(foundCurrent&&all[i].status==='Pendiente')return all[i].studentId;
  }
  for(var j=0;j<all.length;j++){
    if(all[j].studentId!=currentSid&&all[j].status==='Pendiente')return all[j].studentId;
  }
  return null;
}

function saveSubmissionGradeFlow(aid,sid,goNext){
  var s=sub(aid,sid);
  if(!s)return;
  var gradeEl=document.getElementById('subGrade');
  var commentEl=document.getElementById('subComment');
  var grade=parseFloat(gradeEl.value);
  var comment=commentEl.value.trim();
  if(isNaN(grade)||grade<0||grade>20)return toast('Nota invalida (0-20)');
  s.score=grade;s.comment=comment;s.feedback=comment;
  if(s.status==='Pendiente'){s.status='Entregado';s.submittedAt=today();}
  else if(s.status!=='Calificado'){s.status='Calificado';}
  save();
  toast('Calificacion guardada');
  if(goNext){
    var nextSid=getNextUndradedSid(aid,sid);
    if(nextSid){viewStudentSubmission(aid,nextSid);return;}
  }
  taskSubmissionPanel(aid);
}

function saveSubmissionGrade(aid,sid,e){
  if(e)e.preventDefault();
  saveSubmissionGradeFlow(aid,sid,false);
}

/* ============================================
   Grade panel (bulk inline editing)
   ============================================ */
function taskGradePanel(aid){
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var c=state.db.courses.find(function(x){return x.id==a.courseId});
  var all=studentsOfCourse(c).map(function(stu){
    var s=sub(aid,stu.id);
    if(!s){s={assignmentId:aid,studentId:stu.id,status:'Pendiente'};state.db.submissions.push(s);}
    return s;
  });
  var delivered=all.filter(function(s){return s.status!=='Pendiente'});
  save();
  content.innerHTML='<section class="section-title"><div><h2>Calificar tarea</h2><p>'+a.title+' \u00b7 '+c.name+' \u00b7 '+c.grade+' '+c.section+'</p></div><div class="hdr-actions"><button class="btn secondary" onclick="window._tCourseTab=\'entregas\';teacherCourseDetail('+c.id+')">Volver</button></div></section>'+
    '<div class="page-body">'+
      '<article class="card"><h3>Entregas para calificar</h3><table class="table"><tr><th>Alumno</th><th>Archivo</th><th>Estado</th><th>Nota</th><th>Retroalimentacion</th><th>Accion</th></tr>'+rows(delivered.map(function(s){
        var key=aid+'_'+s.studentId;
        return[sn(s.studentId),s.fileName||'archivo_subido.pdf',s.status,
          '<input id="score_'+key+'" type="number" min="0" max="20" value="'+(s.score!=null?s.score:16)+'">',
          '<input id="feed_'+key+'" placeholder="Retroalimentacion" value="'+(s.feedback||'')+'">',
          '<button class="btn secondary" onclick="saveTaskGrade('+aid+','+s.studentId+')">Guardar nota</button>'];
      }))+'</table>'+(delivered.length?'':'<div class="empty-state">No hay entregas todav\u00eda.</div>')+'</article>'+
    '</div>';
}

function saveTaskGrade(aid,sid){
  loading('Guardando nota...');
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var s=sub(aid,sid);
  var key=aid+'_'+sid;
  var scoreEl=document.getElementById('score_'+key);
  var feedEl=document.getElementById('feed_'+key);
  var score=Number(scoreEl&&scoreEl.value);
  var feedback=feedEl&&feedEl.value||'';
  if(!scoreEl||scoreEl.value===''||scoreEl.value==null||isNaN(score)||score<0||score>20){stopLoading();toast('Ingresa una nota valida de 0 a 20.');return;}
  s.score=score;s.feedback=feedback;s.status='Calificado';
  var existing=state.db.grades.find(function(g){return g.studentId==sid&&g.courseId==a.courseId&&g.type==='Tarea'&&g.name===a.title});
  if(existing){existing.score=score;existing.feedback=feedback;existing.date=today();}
  else state.db.grades.unshift({studentId:sid,courseId:a.courseId,type:'Tarea',name:a.title,score:score,date:today(),bim:'I',feedback:feedback});
  var stu=st(sid);
  var msg=score<11?'Nota baja. Requiere refuerzamiento y acompanamiento.':score>=16?'Excelente desempeno. Felicitar y motivar.':'Nota registrada. Continuar practicando.';
  if(score>=16)stu.stars=(stu.stars||0)+20;
  addN({toRole:'estudiante',studentId:sid,title:score<11?'Alerta por nota baja':score>=16?'Felicitacion por nota alta':'Tarea calificada',text:a.title+': '+score+'. '+msg,link:'notas',refType:'grade',assignmentId:aid,studentId:sid,courseId:a.courseId});
  addN({toRole:'padre',parentId:stu.parentId,title:score<11?'Alerta academica':score>=16?'Felicitacion academica':'Tarea calificada',text:stu.name+' obtuvo '+score+' en '+a.title+'. '+msg,link:'notas',refType:'grade',assignmentId:aid,studentId:sid,courseId:a.courseId});
  save();
  clearGradeInputs(aid,sid);
  stopLoading();
  toast('Nota guardada y campos limpiados.');
}

function clearGradeInputs(aid,sid){
  var key=aid+'_'+sid;
  var scoreInput=document.getElementById('score_'+key);
  var feedInput=document.getElementById('feed_'+key);
  if(scoreInput)scoreInput.value='';
  if(feedInput)feedInput.value='';
  var row=scoreInput?scoreInput.closest('tr'):null;
  if(row){row.classList.add('grade-saved-row');setTimeout(function(){row.classList.remove('grade-saved-row')},1200);}
}

function gradeOneSubmission(aid,sid){
  var s=sub(aid,sid);
  if(!s){s={assignmentId:aid,studentId:sid,status:'Entregado',submittedAt:today(),fileName:'archivo_demo.pdf',fileType:'application/pdf'};state.db.submissions.push(s);}
  if(s.status==='Pendiente'){s.status='Entregado';s.submittedAt=today();s.fileName=s.fileName||'archivo_demo.pdf';}
  openModal('<h2>Registrar nota</h2><p>'+sn(sid)+' \u00b7 '+state.db.assignments.find(function(x){return x.id==aid}).title+'</p><form id="oneGradeForm" class="form"><label>Nota<input id="oneScore" type="number" min="0" max="20" value="'+(s.score!=null?s.score:16)+'"></label><label class="full">Retroalimentacion<textarea id="oneFeed">'+(s.feedback||'')+'</textarea></label><div class="full"><button class="btn primary">Guardar nota</button></div></form>');
  var frm=document.getElementById('oneGradeForm');
  if(frm)frm.onsubmit=function(e){e.preventDefault();saveTaskGradeManual(aid,sid,Number(document.getElementById('oneScore').value),document.getElementById('oneFeed').value);modal.classList.add('hidden');taskSubmissionPanel(aid);};
}

function saveTaskGradeManual(aid,sid,score,feedback){
  if(score===''||score==null||isNaN(score)||score<0||score>20){toast('Ingresa una nota valida de 0 a 20.');return;}
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var s=sub(aid,sid);
  if(!s){s={assignmentId:aid,studentId:sid,status:'Entregado'};state.db.submissions.push(s);}
  s.score=score;s.feedback=feedback;s.status='Calificado';
  var existing=state.db.grades.find(function(g){return g.studentId==sid&&g.courseId==a.courseId&&g.type==='Tarea'&&g.name===a.title});
  if(existing){existing.score=score;existing.feedback=feedback;existing.date=today();}
  else state.db.grades.unshift({studentId:sid,courseId:a.courseId,type:'Tarea',name:a.title,score:score,date:today(),bim:'I',feedback:feedback});
  var stu=st(sid);
  var msg=score<11?'Nota baja. Requiere refuerzamiento.':score>=16?'Excelente desempeno. Felicitaciones.':'Nota registrada.';
  addN({toRole:'estudiante',studentId:sid,title:score<11?'Alerta por nota baja':score>=16?'Felicitacion por nota alta':'Tarea calificada',text:a.title+': '+score+'. '+msg,link:'notas'});
  addN({toRole:'padre',parentId:stu.parentId,title:score<11?'Alerta academica':score>=16?'Felicitacion academica':'Tarea calificada',text:stu.name+' obtuvo '+score+' en '+a.title+'. '+msg,link:'notas'});
  save();toast('Nota guardada');
}

function gradeRegisterPage(){
  var tasks=myCoursesDoc().flatMap(function(c){return state.db.assignments.filter(function(a){return a.courseId===c.id}).map(function(a){return{a:a,c:c}})});
  ensureBimestersSafe();
  var courses=myCoursesDoc();
  var bimBlock='<article class="card bimester-clean-card"><h3>Calificar bimestre</h3><p class="bimester-helper">Selecciona un curso para registrar la nota final del bimestre.</p><section class="auto bimester-course-grid">'+(courses.length?courses.map(function(c){return '<article class="card bimester-course-card"><h3>'+c.name+'</h3><p>'+c.grade+' \u00b7 Seccion '+c.section+'</p><button class="btn secondary" onclick="openBimesterGradePanel('+c.id+')">Calificar bimestre</button></article>'}).join(''):'<div class="alert info"><b>Sin cursos</b><span>No tienes cursos asignados.</span></div>')+'</section></article>';
  content.innerHTML='<div class="section-title"><h2>Registrar notas</h2></div><div class="page-body">'+bimBlock+'<article class="card"><h3>Tareas publicadas</h3><p class="muted">Selecciona una tarea para calificar entregas.</p>'+(tasks.length?tasks.map(function(x){var subs=state.db.submissions.filter(function(s){return s.assignmentId==x.a.id});var done=subs.filter(function(s){return s.status!=='Pendiente'}).length;return '<div class="task clean-task"><div class="thumb">'+(x.a.fileName||'Archivo')+'</div><div class="stack"><b>'+x.a.title+'</b><span>'+x.c.name+' \u00b7 '+x.c.grade+' '+x.c.section+'</span><span class="ok">Entregaron: '+done+'</span> \u00b7 <span class="bad">Pendientes: '+(subs.length-done)+'</span></div><div class="actions"><button class="btn secondary" onclick="teacherCourseDetail('+x.c.id+')">Ver curso</button><button class="btn primary" onclick="taskGradePanel('+x.a.id+')">Registrar nota</button></div></div>'}).join(''):'<div class="empty-state">Publica una tarea primero para registrar notas.</div>')+'</article></div>';
}

function review(sid,aid){
  openModal('<h2>Retroalimentacion</h2><form id="rf" class="form"><label>Nota<input id="rscore" type="number" min="0" max="20" value="16"></label><label class="full">Retroalimentacion<textarea id="rtext"></textarea></label><div class="full"><button class="btn primary">Guardar</button></div></form>');
  var frm=document.getElementById('rf');
  if(frm)frm.onsubmit=function(e){saveReview(e,sid,aid)};
}

function saveReview(e,sid,aid){
  e.preventDefault();
  var a=state.db.assignments.find(function(x){return x.id==aid});
  var score=+document.getElementById('rscore').value;
  state.db.grades.unshift({studentId:sid,courseId:a.courseId,type:'Tarea',name:a.title,score:score,date:today(),bim:'I'});
  var stu=st(sid);
  var txt=score<11?'Nota baja: reforzar y coordinar apoyo.':score>=16?'Felicitaciones por la alta calificacion.':'Nota registrada, continuar seguimiento.';
  if(score>=16)stu.stars=(stu.stars||0)+20;
  addN({toRole:'estudiante',studentId:sid,title:score<11?'Alerta por nota baja':score>=16?'Felicitacion por nota alta':'Nueva nota',text:txt,link:'notas'});
  addN({toRole:'padre',parentId:stu.parentId,title:score<11?'Alerta academica':score>=16?'Felicitacion academica':'Nueva nota',text:stu.name+' obtuvo '+score+'. '+txt,link:'notas'});
  addTL(stu.name+' recibio nota '+score+' en '+cn(a.courseId),sid);
  save();
  modal.classList.add('hidden');toast('Retroalimentacion enviada');openPage('entregas');
}
