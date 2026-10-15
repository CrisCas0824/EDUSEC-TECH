function teacherCoursesPage(){
  const banners = ['banner-grey','banner-orange','banner-teal','banner-purple','banner-lightgrey','banner-blue','banner-pink','banner-green'];
  const icons = ['&#9733;','&#9733;','&#9733;','&#9733;','&#9733;','&#9733;','&#9733;','&#9733;'];
  let cards = myCoursesDoc().map(function(c,i){
    let students = studentsOfCourse(c);
    let banner = banners[i % banners.length];
    let icon = icons[i % icons.length];
    return '<article class="course-card-clickable" onclick="teacherCourseDetail('+c.id+')">'+
      '<div class="course-card-top '+banner+'">'+
        '<span class="course-card-icon">'+icon+'</span>'+
      '</div>'+
      '<div class="course-card-bottom">'+
        '<h3>'+c.name+'</h3>'+
        '<p class="course-card-meta">'+c.grade+' &middot; Seccion '+c.section+'</p>'+
      '</div>'+
    '</article>';
  }).join('');
  content.innerHTML='<div class="section-title"><h2>Mis cursos</h2></div><div class="page-body"><section class="auto">'+cards+'</section></div>';
}

function teacherCourseDetail(cid){
  var c=state.db.courses.find(function(x){return x.id==cid});
  if(!c)return;
  var list=studentsOfCourse(c);
  window._tCourseTab=window._tCourseTab||'curso';
  window._tEdit=window._tEdit||false;
  var tab=window._tCourseTab;
  var editMode=window._tEdit;
  var tabs=[
    {id:'curso',label:'Curso'},
    {id:'participantes',label:'Participantes'},
    {id:'calificaciones',label:'Calificaciones'},
    {id:'entregas',label:'Entregas'},
    {id:'asistencia',label:'Asistencia'}
  ];
  var tabsHtml=tabs.map(function(t){
    return '<button class="nav-tab-btn'+(tab===t.id?' active':'')+'" data-tab="'+t.id+'" onclick="switchTeacherCourseTab('+cid+',\''+t.id+'\')">'+t.label+'</button>';
  }).join('');
  var editToggle='<button class="btn '+(editMode?'primary':'secondary')+' btn-edit-mode" onclick="window._tEdit=!window._tEdit;teacherCourseDetail('+cid+')" style="flex-shrink:0">'+(editMode?'&#10003; Editando':'&#9998; Modo edicion')+'</button>';
  content.innerHTML=
    '<div class="course-view-wrapper">'+
      '<div class="course-main-header course-detail-header course-top-nav-card" style="display:flex;justify-content:space-between;align-items:center;">'+
        '<div class="course-nav-bar">'+tabsHtml+'</div>'+
        editToggle+
      '</div>'+
      '<div id="course-tab-content"></div>'+
    '</div>';
  updateTeacherCourseContent(cid);
}

function switchTeacherCourseTab(cid,tabId){
  window._tCourseTab=tabId;
  var bar=document.querySelector('.course-nav-bar');
  if(bar){
    bar.querySelectorAll('.nav-tab-btn').forEach(function(b){b.classList.remove('active');});
    var active=bar.querySelector('[data-tab="'+tabId+'"]');
    if(active)active.classList.add('active');
  }
  updateTeacherCourseContent(cid);
}

function updateTeacherCourseContent(cid){
  var c=state.db.courses.find(function(x){return x.id==cid});
  if(!c)return;
  var list=studentsOfCourse(c);
  var tasks=state.db.assignments.filter(function(a){return a.courseId==cid});
  var tab=window._tCourseTab||'curso';
  var editMode=window._tEdit||false;
  function editBtn(type,id){
    if(!editMode)return '';
    if(type==='topic') return '<button class="btn secondary" style="font-size:.75rem;padding:2px 8px" onclick="event.stopPropagation();editItem(\'topic\','+id+','+cid+')">&#9998; Editar</button>';
    if(type==='task') return '<button class="btn secondary" style="font-size:.75rem;padding:2px 8px" onclick="event.stopPropagation();editItem(\'task\','+id+','+cid+')">&#9998;</button>';
    if(type==='form') return '<button class="btn secondary" style="font-size:.75rem;padding:2px 8px" onclick="event.stopPropagation();editItem(\'form\','+id+','+cid+')">&#9998;</button>';
    return '';
  }
  function hideBtn(task){
    if(!editMode)return '';
    var isHidden=task.hidden;
    return '<button class="btn '+(isHidden?'primary':'secondary')+'" style="font-size:.75rem;padding:2px 8px" onclick="event.stopPropagation();toggleTaskHidden('+task.id+','+cid+')" title="'+(isHidden?'Mostrar a alumnos/padres':'Ocultar de alumnos/padres')+'">'+(isHidden?'Oculto':'Visible')+'</button>';
  }
  var tabContent='';
  if(tab==='curso'){
    var syll=syllabusOf(cid);
    var topics=courseTopics(cid);
    var forms=getCourseForms(cid);
    var unlinkedTasks=tasks.filter(function(a){return !a.topicId});
    var unlinkedForms=forms.filter(function(f){return !f.topicId});
    if(unlinkedTasks.length||unlinkedForms.length){
      if(!topics.length){
        var autoTopic={id:Date.now(),courseId:cid,title:'Sesion 1 — Actividades del curso',description:'Tareas y actividades publicadas para este curso.',fileName:'',fileType:'',fileData:null,publishedAt:today(),createdBy:state.user.id};
        if(!state.db.topics)state.db.topics=[];
        state.db.topics.push(autoTopic);
        unlinkedTasks.forEach(function(a){a.topicId=autoTopic.id;});
        unlinkedForms.forEach(function(f){f.topicId=autoTopic.id;});
        save();
      }else{
        var lastTopic=topics[topics.length-1];
        unlinkedTasks.forEach(function(a){a.topicId=lastTopic.id;});
        unlinkedForms.forEach(function(f){f.topicId=lastTopic.id;});
        save();
      }
      topics=courseTopics(cid);
      tasks=state.db.assignments.filter(function(a){return a.courseId==cid});
      forms=getCourseForms(cid);
    }
    var tName = tn(c.teacherId) || 'Joaquín Salas Cruz';
    tabContent='<div class="welcome-banner course-welcome-banner">'+
      '<h2>Bienvenido al curso - '+c.name+'</h2>'+
      '<span class="badge-modalidad" style="background:rgba(255,255,255,0.2);color:#fff;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-block;width:fit-content;">'+c.grade+' &middot; Sección '+c.section+'</span>'+
      '<div class="teacher-name-tag">Docente: '+tName+'</div>'+
    '</div>';
    tabContent+='<div class="section-toggle" onclick="moodleToggle(this,\'silabo_'+cid+'\')"><span class="chev">&#9662;</span> Silabo</div>';
    tabContent+='<div id="silabo_'+cid+'">';
    if(syll){
      tabContent+='<div class="resource-row"><div><span>&#8227; '+syll.title+'</span><div class="meta">'+(syll.fileName||'')+(syll.publishedAt?' &middot; '+syll.publishedAt:'')+'</div></div><button class="btn secondary" onclick="event.stopPropagation();openSyllabusEditor('+cid+')">Editar silabo</button></div>';
    }else{
      tabContent+='<div class="resource-row"><span class="muted">No hay silabo publicado.</span><button class="btn primary" onclick="event.stopPropagation();openSyllabusEditor('+cid+')">Subir silabo</button></div>';
    }
    tabContent+='</div>';
    tabContent+='<div class="section-toggle" onclick="moodleToggle(this,\'sesiones_'+cid+'\')"><span class="chev">&#9662;</span> Sesiones de Aprendizaje</div>';
    tabContent+='<div id="sesiones_'+cid+'">';
    if(topics.length){
      topics.forEach(function(t,idx){
        var tForms=forms.filter(function(f){return f.topicId==t.id});
        var tTasks=tasks.filter(function(a){return a.topicId==t.id});
        tabContent+='<div class="session-row" onclick="moodleToggle(this,\'st_'+t.id+'\')"><span class="chev">&#9662;</span><span class="session-pill">'+(idx+1)+'</span> '+t.title+' '+editBtn('topic',t.id)+'</div>';
        tabContent+='<div id="st_'+t.id+'" class="session-content">';
        if(t.description){tabContent+='<p>'+t.description+'</p>';}
        if(t.fileName){tabContent+='<div class="resource-row"><span>&#8227; '+t.fileName+'</span></div>';}
        if(tForms.length){
          tabContent+='<div class="green-pill">&#8227; Cuestionarios</div>';
          tForms.forEach(function(f){
            var respCount=getFormResponses(f.id).length;
            tabContent+='<div class="resource-row"><div><span>&#8227; '+f.title+'</span> '+editBtn('form',f.id)+'<div class="meta">'+f.questions.length+' preguntas &middot; '+respCount+' respuestas</div></div><div style="display:flex;gap:6px"><button class="btn secondary" onclick="event.stopPropagation();teacherFormResponses(\''+f.id+'\')">Ver respuestas</button><button class="btn secondary" onclick="event.stopPropagation();teacherEditForm(\''+f.id+'\')">Editar</button></div></div>';
          });
        }
        if(tTasks.length){
          tabContent+='<div class="green-pill">&#8227; Tareas</div>';
          tTasks.forEach(function(a){
            var subs=state.db.submissions.filter(function(s){return s.assignmentId==a.id});
            var done=subs.filter(function(s){return s.status!=='Pendiente'}).length;
            var hiddenBadge=a.hidden?'<span style="background:var(--r);color:#fff;font-size:.7rem;padding:1px 6px;border-radius:4px;margin-left:6px">OCULTO</span>':'';
            tabContent+='<div class="resource-row"><div><span>&#8227; '+a.title+'</span> '+editBtn('task',a.id)+' '+hideBtn(a)+hiddenBadge+'<div class="meta">Entrega: '+a.due+' &middot; Entregaron: '+done+' / '+subs.length+'</div></div><div style="display:flex;gap:6px"><button class="btn secondary sm" onclick="event.stopPropagation();taskSubmissionPanel('+a.id+')">Ver entregas</button><button class="btn secondary sm" onclick="event.stopPropagation();taskGradePanel('+a.id+')">Calificar</button></div></div>';
          });
        }
        tabContent+='<button class="btn secondary sm" style="margin-top:10px" onclick="event.stopPropagation();addContentToSession('+cid+','+t.id+')">+ Agregar contenido a sesion</button>';
        tabContent+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">';
        tabContent+='<button class="btn secondary sm" onclick="event.stopPropagation();openTaskModalForSession('+cid+','+t.id+')">&#8227; Agregar tarea</button>';
        tabContent+='<button class="btn secondary sm" onclick="event.stopPropagation();goCreateFormForTopic('+cid+','+t.id+')">&#8227; Agregar cuestionario</button>';
        tabContent+='<button class="btn secondary sm" style="color:var(--r)" onclick="event.stopPropagation();if(confirm(\'Eliminar sesion?\')){deleteTopic('+t.id+');teacherCourseDetail('+cid+')}">&#10005;</button>';
        tabContent+='</div>';
        tabContent+='</div>';
      });
    }else{
      tabContent+='<p class="muted" style="padding:12px 0">No hay sesiones publicadas.</p>';
    }
    tabContent+='</div>';
    tabContent+='<div style="margin-top:20px"><button class="btn primary" onclick="goPublishTopic('+cid+')">+ Nueva sesion</button></div>';
  }else if(tab==='participantes'){
    tabContent='<article class="card"><h3>Alumnos del curso ('+list.length+')</h3><table class="table"><tr><th>Alumno</th><th>Grado</th><th>Seccion</th></tr>'+rows(list.map(function(s){return [s.name,c?c.grade:'-',c?c.section:'-']}))+'</table></article>';
  }else if(tab==='calificaciones'){
    if(window._calFilter===undefined)window._calFilter='all';
    tabContent='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:16px;gap:12px">';
    tabContent+='<div style="display:flex;gap:8px">';
    tabContent+='<button class="btn primary" onclick="switchTeacherCourseTab('+cid+',\'entregas\')">Registrar nota</button>';
    tabContent+='<button class="btn secondary" onclick="openBimesterGradePanel('+cid+')">Calificar bimestre</button>';
    tabContent+='</div>';
    tabContent+='<div style="display:flex;gap:8px">';
    tabContent+='<button class="btn sm '+(window._calFilter==='all'?'primary':'secondary')+'" onclick="window._calFilter=\'all\';updateTeacherCourseContent('+cid+')">Todos</button>';
    tabContent+='<button class="btn sm '+(window._calFilter==='high'?'primary':'secondary')+'" onclick="window._calFilter=\'high\';updateTeacherCourseContent('+cid+')">Alto Rendimiento</button>';
    tabContent+='<button class="btn sm '+(window._calFilter==='low'?'primary':'secondary')+'" onclick="window._calFilter=\'low\';updateTeacherCourseContent('+cid+')">Bajo Rendimiento</button>';
    tabContent+='</div></div>';
    var filteredList=list.slice();
    if(window._calFilter==='high'){
      filteredList=filteredList.filter(function(s){return courseAvg(s.id,cid)>=11;});
    }else if(window._calFilter==='low'){
      filteredList=filteredList.filter(function(s){return courseAvg(s.id,cid)<11;});
    }
    filteredList.sort(function(a,b){return courseAvg(b.id,cid)-courseAvg(a.id,cid);});
    tabContent+='<article class="card"><h3>Notas del curso</h3><table class="table"><tr><th>Alumno</th><th>Promedio</th><th>Notas</th><th>Accion</th></tr>';
    tabContent+=rows(filteredList.map(function(s){
      var gs=state.db.grades.filter(function(g){return g.studentId==s.id&&g.courseId==cid});
      var avg=courseAvg(s.id,cid);
      var color=avg>=11?'var(--ok)':'var(--r)';
      return [s.name,'<span style="color:'+color+';font-weight:700">'+avg.toFixed(1)+'</span>',gs.length+' notas','<button class="btn secondary" onclick="studentCoursePanel('+s.id+','+cid+')">Ver</button>'];
    }));
    tabContent+='</table></article>';
  }else if(tab==='entregas'){
    var visibleTasks=tasks.filter(function(a){return !a.hidden});
    tabContent='<div class="hdr-actions" style="margin-bottom:16px"><button class="btn primary" onclick="goPublishTask('+cid+')">+ Nueva tarea</button></div>';
    tabContent+='<article class="card"><h3>Tareas publicadas</h3><p class="muted" style="margin-bottom:12px">Selecciona una tarea para ver las entregas de los alumnos.</p>';
    if(visibleTasks.length){
      visibleTasks.forEach(function(a){
        var subs=state.db.submissions.filter(function(s){return s.assignmentId==a.id});
        var done=subs.filter(function(s){return s.status!=='Pendiente'}).length;
        var pend=subs.length-done;
        tabContent+='<div class="task-list-card" onclick="taskSubmissionPanel('+a.id+')">'+
          '<div class="task-list-card-icon">&#9998;</div>'+
          '<div class="task-list-card-info">'+
            '<h4>'+a.title+'</h4>'+
            '<div class="meta">Entrega: '+a.due+' \u00b7 '+subs.length+' alumnos</div>'+
          '</div>'+
          '<div class="task-list-card-stats">'+
            '<span class="stat-ok">'+done+' entregados</span>'+
            '<span class="stat-bad">'+pend+' pendientes</span>'+
          '</div>'+
          '<div class="task-list-card-actions">'+
            '<button class="btn secondary" style="font-size:.8rem" onclick="event.stopPropagation();taskSubmissionPanel('+a.id+')">Ver entregas</button>'+
            '<button class="btn primary" style="font-size:.8rem" onclick="event.stopPropagation();taskGradePanel('+a.id+')">Calificar</button>'+
          '</div>'+
        '</div>';
      });
    }else{
      tabContent+='<p class="muted">No hay tareas publicadas.</p>';
    }
    tabContent+='</article>';
  }else if(tab==='asistencia'){
    tabContent='<div class="hdr-actions" style="margin-bottom:16px"><button class="btn primary" onclick="openAttendanceModal('+cid+')">+ Nueva asistencia</button></div>';
    var attRecords=state.db.attendance.filter(function(x){return x.courseId==cid});
    var dates=[...new Set(attRecords.map(function(x){return x.date}))].sort();
    tabContent+='<article class="card"><h3>Asistencia del curso</h3>';
    if(dates.length===0){
      tabContent+='<p class="muted">Registra asistencia para ver el historial</p>';
    }else{
      tabContent+='<div style="overflow-x:auto"><table class="table"><tr><th>Alumno</th><th>%</th>';
      dates.forEach(function(d){
        var parts=d.split('-');
        tabContent+='<th>'+parts[2]+'/'+parts[1]+'</th>';
      });
      tabContent+='</tr>';
      list.forEach(function(s){
        tabContent+='<tr><td>'+s.name+'</td><td><b>'+attPct(s.id,cid)+'%</b></td>';
        dates.forEach(function(d){
          var rec=attRecords.find(function(x){return x.studentId==s.id && x.date===d});
          if(rec && rec.status==='Presente'){
            tabContent+='<td style="text-align:center;color:#22c55e;font-weight:bold">&#10003;</td>';
          }else if(rec && rec.status==='Ausente'){
            tabContent+='<td style="text-align:center;color:#ef4444;font-weight:bold">&#10007;</td>';
          }else{
            tabContent+='<td style="text-align:center;color:#94a3b8">—</td>';
          }
        });
        tabContent+='</tr>';
      });
      tabContent+='</table></div>';
    }
    tabContent+='</article>';
  }
  var el=document.getElementById('course-tab-content');
  if(el)el.innerHTML=tabContent;
}
function editItem(type,id,cid){
  if(type==='topic'){
    var t=state.db.topics.find(function(x){return x.id==id});
    if(!t)return;
    openModal('<h3>Editar sesion</h3><form id="editTopicForm" class="form"><label class="full">Titulo<input id="editTopicTitle" value="'+(t.title||'').replace(/"/g,'&quot;')+'" required></label><label class="full">Descripcion<textarea id="editTopicDesc">'+(t.description||'')+'</textarea></label><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>');
    document.getElementById('editTopicForm').onsubmit=function(e){
      e.preventDefault();
      t.title=document.getElementById('editTopicTitle').value.trim();
      t.description=document.getElementById('editTopicDesc').value.trim();
      save();modal.classList.add('hidden');toast('Sesion actualizada');teacherCourseDetail(cid);
    };
  }else if(type==='task'){
    var a=state.db.assignments.find(function(x){return x.id==id});
    if(!a)return;
    var curStartD=a.startDate||a.due||'';
    var curStartT=a.startTime||'08:00';
    var curDueD=a.dueDate||a.due||'';
    var curDueT=a.dueTime||'23:59';
    openModal('<h3>Editar tarea</h3><form id="editTaskForm" class="form"><label class="full">Titulo<input id="editTaskTitle" value="'+(a.title||'').replace(/"/g,'&quot;')+'" required></label><label class="full">Descripcion<textarea id="editTaskDesc">'+(a.description||'')+'</textarea></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label>Inicio de entrega<input id="editTaskStartDate" type="date" value="'+curStartD+'"></label><label>Hora inicio<input id="editTaskStartTime" type="time" value="'+curStartT+'"></label><label>Fecha limite<input id="editTaskDueDate" type="date" value="'+curDueD+'"></label><label>Hora limite<input id="editTaskDueTime" type="time" value="'+curDueT+'"></label></div><label class="full">Archivo adjunto actual: <span id="editTaskFileName">'+(a.fileName||'Ninguno')+'</span></label><label class="full">Reemplazar archivo (opcional)<input id="editTaskFile" type="file"></label><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>');
    document.getElementById('editTaskForm').onsubmit=async function(e){
      e.preventDefault();
      a.title=document.getElementById('editTaskTitle').value.trim();
      a.description=document.getElementById('editTaskDesc').value.trim();
      a.startDate=document.getElementById('editTaskStartDate').value;
      a.startTime=document.getElementById('editTaskStartTime').value;
      a.dueDate=document.getElementById('editTaskDueDate').value;
      a.dueTime=document.getElementById('editTaskDueTime').value;
      a.due=a.dueDate;
      var fileInput=document.getElementById('editTaskFile');
      if(fileInput&&fileInput.files&&fileInput.files[0]){
        var f=fileInput.files[0];
        if(f.size>10*1024*1024){toast('El archivo supera 10 MB');return}
        a.fileName=f.name;a.fileType=f.type;
        try{a.fileData=await fileData(f)}catch(ex){toast('Error al leer archivo');return}
      }
      save();modal.classList.add('hidden');toast('Tarea actualizada');teacherCourseDetail(cid);
    };
  }else if(type==='form'){
    teacherEditForm(id);
  }
}
function toggleTaskHidden(taskId,cid){
  var a=state.db.assignments.find(function(x){return x.id==taskId});
  if(!a)return;
  a.hidden=!a.hidden;
  save();
  toast(a.hidden?'Tarea ocultada de alumnos/padres':'Tarea visible para alumnos/padres');
  teacherCourseDetail(cid);
}
function openAttendanceModal(cid){
  var c=state.db.courses.find(function(x){return x.id==cid});
  var list=studentsOfCourse(c);
  var attDate=today();
  openModal('<h3>Registrar asistencia — '+(c?c.name:'Curso')+'</h3><form id="attForm" class="form"><label class="full">Fecha<input id="attDateInput" type="date" value="'+attDate+'" required></label><div id="attStudentList" class="full" style="max-height:380px;overflow-y:auto;margin-top:12px"></div><div class="full" style="display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--line)"><button class="btn secondary sm" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button><button class="btn primary sm" type="submit">Guardar asistencia</button></div></form>');
  function renderAttList(){
    var d=document.getElementById('attDateInput').value;
    var listEl=document.getElementById('attStudentList');
    listEl.innerHTML=list.map(function(s){
      var existing=state.db.attendance.find(function(x){return x.studentId==s.id&&x.courseId==cid&&x.date==d});
      var isP=existing&&existing.status==='Presente';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>'+s.name+'</span><div style="display:flex;gap:6px"><button type="button" class="btn '+(isP?'primary':'secondary')+'" onclick="this.parentNode.querySelectorAll(\'.btn\').forEach(function(b){b.className=\'btn secondary\'});this.className=\'btn primary\';this.dataset.val=\'Presente\'" data-val="'+(isP?'Presente':'')+'">&#10003; P</button><button type="button" class="btn '+(!isP&&existing?'primary':'secondary')+'" onclick="this.parentNode.querySelectorAll(\'.btn\').forEach(function(b){b.className=\'btn secondary\'});this.className=\'btn primary\';this.dataset.val=\'Ausente\'" data-val="'+(!isP&&existing?'Ausente':'')+'">&#10007; A</button></div></div>';
    }).join('');
  }
  renderAttList();
  document.getElementById('attDateInput').onchange=renderAttList;
  document.getElementById('attForm').onsubmit=function(e){
    e.preventDefault();
    var d=document.getElementById('attDateInput').value;
    var btns=document.querySelectorAll('#attStudentList > div');
    btns.forEach(function(row,i){
      var s=list[i];
      var pBtn=row.querySelector('.btn.primary');
      var status=pBtn?pBtn.dataset.val:null;
      if(!status)return;
      var existing=state.db.attendance.find(function(x){return x.studentId==s.id&&x.courseId==cid&&x.date==d});
      if(existing){existing.status=status;}
      else{state.db.attendance.push({studentId:s.id,courseId:cid,date:d,status:status});}
    });
    save();modal.classList.add('hidden');toast('Asistencia registrada');teacherCourseDetail(cid);
  };
}

function addContentToSession(cid,tid){
  var t=state.db.topics.find(function(x){return x.id==tid});
  if(!t)return;
  openModal('<h3>Agregar contenido a sesion</h3><form id="contentForm" class="form"><label class="full">Descripcion<textarea id="contentDesc">'+(t.description||'')+'</textarea></label><label class="full">Archivo adjunto (opcional)<input id="contentFile" type="file"></label><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>');
  document.getElementById('contentForm').onsubmit=async function(e){
    e.preventDefault();
    t.description=document.getElementById('contentDesc').value.trim();
    var fileInput=document.getElementById('contentFile');
    if(fileInput&&fileInput.files&&fileInput.files[0]){
      var f=fileInput.files[0];
      if(f.size>10*1024*1024){toast('El archivo supera 10 MB');return}
      t.fileName=f.name;t.fileType=f.type;
      try{t.fileData=await fileData(f)}catch(ex){toast('Error al leer archivo');return}
    }
    save();modal.classList.add('hidden');toast('Contenido actualizado');teacherCourseDetail(cid);
  };
}

function studentCoursePanel(sid,cid){
  let c=state.db.courses.find(x=>x.id==cid);
  let tasks=state.db.assignments.filter(a=>a.courseId==cid);
  let data=tasks.map(a=>{let sb=sub(a.id,sid);return [a.title.slice(0,10), sb?.score ? Math.round((sb.score/20)*100) : 20]});
  content.innerHTML=`<section class="section-title"><div><h2>${sn(sid)}</h2><p>${c.name} · ${c.grade} ${c.section}</p></div><div class="hdr-actions"><button class="btn secondary" onclick="teacherCourseDetail(${cid})">Volver</button><button class="btn primary" onclick="goPublishTask(${cid})">Publicar tarea</button><button class="btn secondary" onclick="goRegisterGrade(${cid})">Registrar nota</button></div></section>
    <div class="page-body">
      ${syllabusCard(cid)}
      <section class="chart-row"><article class="card"><h3>Tareas del alumno</h3><div class="scroll-y">${tasks.map(a=>{let sb=sub(a.id,sid);return `<div class="task clean-task"><div class="thumb">${a.fileName||"Archivo"}</div><div class="stack"><b>${a.title}</b><span class="muted">${sb?.status||"Pendiente"}</span><span>Nota: ${sb?.score??"-"}</span></div><div><button class="btn secondary" onclick="gradeOneSubmission(${a.id},${sid})">Registrar nota</button></div></div>`}).join("")}</div></article><article class="card"><h3>Anillos del alumno</h3><div class="scroll-content">${ringChart(data)}</div></article></section>
    </div>`;
}

function setSelectedCourseAfterOpen(selectId, cid){
  setTimeout(()=>{
    const sel = document.getElementById(selectId);
    if(sel){
      sel.value = String(cid);
      if(selectId==="gcourse" && typeof loadStudentsForCourse==="function") loadStudentsForCourse();
    }
  },120);
}

function goPublishTask(cid){
  openPage("publicar");
  setSelectedCourseAfterOpen("pcourse", cid);
}

function goRegisterGrade(cid){
  let tasks = state.db.assignments.filter(a=>a.courseId==cid);
  if(tasks.length){taskGradePanel(tasks[0].id);}
  else{openPage("publicar");setSelectedCourseAfterOpen("pcourse", cid);toast("Primero publica una tarea para poder registrar nota.");}
}

function goPublishTopic(cid){
  let c=state.db.courses.find(x=>x.id==cid);
  openModal('<h3>Publicar sesion — '+(c?c.name:'Curso')+'</h3>'+
    '<form id="topicForm" class="form">'+
      '<label class="full">Titulo de la sesion<input id="topicTitle" required placeholder="Ej: Sesion 1 — Introduccion"></label>'+
      '<label class="full">Descripcion<textarea id="topicDesc" placeholder="Descripcion opcional..."></textarea></label>'+
      '<label class="full">Archivo adjunto (opcional)<input id="topicFile" type="file"></label>'+
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn secondary" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button><button class="btn primary" type="submit">Publicar sesion</button></div>'+
    '</form>');
  document.getElementById('topicForm').onsubmit=async function(e){
    e.preventDefault();
    let title=document.getElementById('topicTitle').value.trim();
    if(!title){toast('Escribe un titulo');return}
    let desc=document.getElementById('topicDesc').value.trim();
    let fileInput=document.getElementById('topicFile');
    let fileName='',fileType='',fileDataVal=null;
    if(fileInput&&fileInput.files&&fileInput.files[0]){
      let f=fileInput.files[0];
      if(f.size>10*1024*1024){toast('El archivo supera 10 MB');return}
      fileName=f.name;fileType=f.type;
      try{fileDataVal=await fileData(f)}catch(ex){toast('Error al leer archivo');return}
    }
    addTopic(cid,title,desc,fileName,fileType,fileDataVal);
    modal.classList.add('hidden');
    toast('Sesion publicada correctamente');
    window._tCourseTab='curso';
    teacherCourseDetail(cid);
  };
}

function goPublishTaskForTopic(cid,tid){
  openPage('publicar');
  setSelectedCourseAfterOpen('pcourse',cid);
  window._pendingTopicId=tid;
  toast('Publica la tarea — se asignara al tema automaticamente.');
  var origPublish=window.publishTask;
  if(origPublish && !window._topicTaskPatched){
    window._topicTaskPatched=true;
    var realPublish=origPublish;
    window.publishTask=async function(e){
      e.preventDefault();
      loading('Publicando tarea...');
      var f=pfile.files[0],courseId=+pcourse.value,c=state.db.courses.find(function(x){return x.id==courseId}),aId=Date.now();
      var a={id:aId,courseId:courseId,title:ptitle.value,description:pdesc.value||'Desarrollar y subir evidencia.',startDate:startDate.value,startTime:startTime.value,dueDate:dueDate.value,dueTime:dueTime.value,due:dueDate.value,fileName:f?f.name:'material.png',fileType:f?f.type:'image/png',fileData:f?await fileData(f):placeholder(ptitle.value),createdBy:state.user.id};
      if(window._pendingTopicId){a.topicId=window._pendingTopicId;window._pendingTopicId=null;}
      state.db.assignments.unshift(a);
      studentsOfCourse(c).forEach(function(stu){
        state.db.submissions.push({assignmentId:aId,studentId:stu.id,status:'Pendiente'});
        addN({toRole:'estudiante',studentId:stu.id,title:'Nueva tarea',text:a.title+' de '+c.name,link:'tareas'});
        addN({toRole:'padre',parentId:stu.parentId,title:'Nueva tarea',text:stu.name+' recibio '+a.title+'.',link:'cursos'});
      });
      addTL('Docente publico '+a.title+' en '+c.grade+' '+c.section);
      save();stopLoading();toast('Tarea publicada');
      if(window._pendingTopicId===undefined || window._pendingTopicId===null){
        openPage('publicar');
      }
    };
  }
}

function goCreateFormForTopic(cid,tid){
  window._pendingTopicId=tid;
  teacherCreateForm(cid);
  toast('Cuestionario se asignara al tema automaticamente.');
  var origSave=window.teacherSaveForm;
  if(origSave && !window._topicFormPatched){
    window._topicFormPatched=true;
    var realSave=origSave;
    window.teacherSaveForm=function(cid){
      var origFormAdd=addForm;
      addForm=function(f){
        if(window._pendingTopicId){f.topicId=window._pendingTopicId;window._pendingTopicId=null;}
        return origFormAdd(f);
      };
      realSave(cid);
      addForm=origFormAdd;
    };
  }
}

function openTaskModalForSession(cid, tid) {
  var c = state.db.courses.find(function(x){return x.id==cid});
  var t = state.db.topics.find(function(x){return x.id==tid});
  if (!c || !t) return;
  var todayVal=today();
  openModal(
    '<h3>Publicar tarea en ' + t.title + '</h3>' +
    '<form id="taskSessionForm" class="form">' +
      '<label class="full">Titulo de la tarea<input id="tsTitle" required placeholder="Ej: Tarea 1 — Ejercicios del tema"></label>' +
      '<label class="full">Descripcion<textarea id="tsDesc" placeholder="Indicaciones para los alumnos..."></textarea></label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<label>Inicio de entrega<input id="tsStartDate" type="date" value="' + todayVal + '" required></label>' +
        '<label>Hora inicio<input id="tsStartTime" type="time" value="08:00"></label>' +
        '<label>Fecha limite<input id="tsDueDate" type="date" value="' + todayVal + '" required></label>' +
        '<label>Hora limite<input id="tsDueTime" type="time" value="23:59"></label>' +
      '</div>' +
      '<label class="full">Archivo adjunto (opcional)<input id="tsFile" type="file"></label>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button class="btn secondary" type="button" onclick="modal.classList.add(\'hidden\')">Cancelar</button>' +
        '<button class="btn primary" type="submit">Publicar tarea</button>' +
      '</div>' +
    '</form>'
  );
  document.getElementById('taskSessionForm').onsubmit = async function(e) {
    e.preventDefault();
    var title = document.getElementById('tsTitle').value.trim();
    if (!title) return toast('Escribe un titulo');
    var desc = document.getElementById('tsDesc').value.trim() || 'Desarrollar y subir evidencia.';
    var startDateVal = document.getElementById('tsStartDate').value;
    var startTimeVal = document.getElementById('tsStartTime').value;
    var dueDateVal = document.getElementById('tsDueDate').value;
    var dueTimeVal = document.getElementById('tsDueTime').value;
    var fileInput = document.getElementById('tsFile');
    var fileName = 'material.png', fileType = 'image/png', fileDataVal = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      var f = fileInput.files[0];
      if (f.size > 10*1024*1024) { toast('El archivo supera 10 MB'); return; }
      fileName = f.name; fileType = f.type;
      try { fileDataVal = await fileData(f); } catch(ex) { toast('Error al leer archivo'); return; }
    }
    var id = Date.now();
    var a = {id:id, courseId:cid, title:title, description:desc, startDate:startDateVal, startTime:startTimeVal, dueDate:dueDateVal, dueTime:dueTimeVal, due:dueDateVal, fileName:fileName, fileType:fileType, fileData:fileDataVal, createdBy:state.user.id, topicId:tid};
    state.db.assignments.unshift(a);
    studentsOfCourse(c).forEach(function(stu){
      state.db.submissions.push({assignmentId:id, studentId:stu.id, status:'Pendiente'});
      addN({toRole:'estudiante', studentId:stu.id, title:'Nueva tarea', text:a.title+' de '+c.name, link:'tareas'});
      addN({toRole:'padre', parentId:stu.parentId, title:'Nueva tarea', text:stu.name+' recibió '+a.title+'.', link:'cursos'});
    });
    addTL('Docente publicó '+a.title+' en '+c.grade+' '+c.section);
    save();
    toast('Tarea publicada en sesión');
    modal.classList.add('hidden');
    window._tCourseTab = 'curso';
    teacherCourseDetail(cid);
  };
}
function teacherHorarioPage(){
  var myCourses=myCoursesDoc();
  var entries=[];
  myCourses.forEach(function(c){
    (state.db.schedules||[]).filter(function(sch){return sch.courseId===c.id}).forEach(function(sch){
      entries.push({day:sch.day,hour:sch.hour,courseId:sch.courseId});
    });
  });
  content.innerHTML='<div class="section-title"><h2>Mi horario</h2></div><div class="page-body"><article class="card"><h3>Horario semanal</h3>'+(entries.length?renderScheduleGrid(entries,{showSection:true}):'<p class="muted" style="padding:16px 0;text-align:center">No hay horarios registrados. Asigna horarios desde Gestion > Cursos.</p>')+'</article></div>';
}
