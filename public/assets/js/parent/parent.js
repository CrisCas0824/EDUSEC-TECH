/* ============================================
   PARENT.JS — Restructured Navigation
   Top nav: Inicio | Mis Hijos | Mensajes
   Child context: secondary bar + courses with tabs
   ============================================ */

function aiAdvice(){
  var children = getChildren();
  if(!children.length){
    toast('No hay estudiantes asociados a tu cuenta.');
    return;
  }
  var recommendationsHtml = children.map(function(s){
    var studentAvg = parseFloat(avg(s.id));
    var pendCount = pending(s.id).length;
    var att = attPct(s.id);
    var grades = state.db.grades.filter(function(g){return g.studentId === s.id;});
    
    var highestCourse = "General";
    var highestScore = -1;
    var lowestCourse = "General";
    var lowestScore = 999;
    
    grades.forEach(function(g){
      var sc = Number(g.score);
      var cName = cn(g.courseId);
      if(sc > highestScore){ highestScore = sc; highestCourse = cName; }
      if(sc < lowestScore){ lowestScore = sc; lowestCourse = cName; }
    });

    var adviceText = "";
    if(studentAvg >= 16){
      adviceText = "<b>" + s.name + "</b> tiene un excelente desempeño (Promedio: " + studentAvg + "). Destaca en <b>" + (highestCourse !== "General" ? highestCourse : "sus cursos") + "</b> (" + (highestScore > -1 ? highestScore : studentAvg) + "). ¡Te sugerimos reconocer su esfuerzo!";
    } else if(studentAvg >= 11){
      adviceText = "<b>" + s.name + "</b> mantiene un rendimiento estable (Promedio: " + studentAvg + "). Tiene buen nivel en " + (highestCourse !== "General" ? highestCourse : "sus materias") + ", pero te recomendamos reforzar <b>" + (lowestCourse !== "General" ? lowestCourse : "sus repasos") + "</b> esta semana.";
    } else {
      adviceText = "<b>" + s.name + "</b> presenta un promedio de " + studentAvg + ". Requiere atención prioritaria en <b>" + (lowestCourse !== "General" ? lowestCourse : "sus asignaturas") + "</b>. Te sugerimos revisar sus tareas pendientes y coordinar con el docente.";
    }

    if(pendCount > 0){
      adviceText += " Además, cuenta con <b>" + pendCount + " tarea(s) pendiente(s)</b>.";
    }

    return '<div class="ai-advice-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:16px;margin-bottom:12px;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'+
        '<span style="font-weight:700;color:#0f172a;font-size:1rem;">' + s.name + '</span>'+
        '<span class="badge ok" style="background:#eff6ff;color:#2563eb;font-weight:700;">Prom. ' + studentAvg + '</span>'+
      '</div>'+
      '<p style="margin:0;font-size:0.9rem;color:#334155;line-height:1.5;">' + adviceText + '</p>'+
    '</div>';
  }).join('');

  var modalHtml = '<div id="ai-advice-modal" class="ai-advice-container">'+
    '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:16px;">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;display:grid;place-items:center;font-weight:800;font-size:1.1rem;">&#10024;</div>'+
        '<h3 style="margin:0;font-size:1.2rem;color:#0f172a;">Recomendaciones con IA</h3>'+
      '</div>'+
      '<button class="modal-close-btn" onclick="modal.classList.add(\'hidden\')">&#10005;</button>'+
    '</div>'+
    '<div style="max-height:60vh;overflow-y:auto;padding-right:4px;">'+
      recommendationsHtml +
    '</div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;border-top:1px solid #e2e8f0;padding-top:14px;">'+
      (children.length ? '<button class="btn secondary sm" onclick="modal.classList.add(\'hidden\');openAiChat('+children[0].id+')">Chatear con el Asistente IA</button>' : '<div></div>')+
      '<button class="btn primary sm" onclick="modal.classList.add(\'hidden\')">Entendido</button>'+
    '</div>'+
  '</div>';

  openModal(modalHtml);
}

/* ---- Parent Dashboard: Overview of all children ---- */
function dashParent(){
  var children=getChildren();
  if(!children.length){
    content.innerHTML='<div class="parent-dashboard-wrapper"><div class="parent-dashboard-header"><h2>Panel familiar</h2></div><div class="empty-state">No hay estudiantes asociados a tu cuenta.</div></div>';
    return;
  }
  var totalAvg=0;
  children.forEach(function(ch){totalAvg+=parseFloat(avg(ch.id))});
  totalAvg=(totalAvg/children.length).toFixed(1);
  var totalAlerts=0;
  children.forEach(function(ch){totalAlerts+=state.db.grades.filter(function(g){return g.studentId===ch.id&&Number(g.score)<11}).length});
  content.innerHTML=
    '<div class="parent-dashboard-wrapper">'+
      '<div class="parent-dashboard-header">'+
        '<h2>Panel familiar</h2>'+
        '<button id="ai-advice-btn" class="btn primary btn-ai-advice" onclick="aiAdvice()">Consejos con IA</button>'+
      '</div>'+
      '<section class="kpi-row">'+
        kpi('Hijos',children.length,'asociados')+
        kpi('Promedio general',totalAvg,'familiar',+totalAvg<11?'bad':+totalAvg>=16?'ok':'warn')+
        kpi('Pendientes',children.reduce(function(s,ch){return s+pending(ch.id).length},0),'tareas','warn')+
        kpi('Alertas',totalAlerts,'notas bajas',totalAlerts?'bad':'ok')+
      '</section>'+
      '<div class="section-title"><h3>Mis hijos</h3></div>'+
      '<div class="parent-children-grid">'+
        children.map(function(s){
          return '<article class="child-card">'+
            '<h3>'+s.name+'</h3>'+
            '<p class="muted">'+s.grade+' \u00B7 Seccion '+s.section+'</p>'+
            '<div class="child-stats-row">'+
              '<div class="child-stat-item"><span class="stat-label">Prom.</span><span class="stat-value">'+avg(s.id)+'</span></div>'+
              '<div class="child-stat-item"><span class="stat-label">Asist.</span><span class="stat-value">'+attPct(s.id)+'%</span></div>'+
              '<div class="child-stat-item"><span class="stat-label">Pend.</span><span class="stat-value">'+pending(s.id).length+'</span></div>'+
            '</div>'+
            '<div class="actions" style="justify-content:center"><button class="btn primary" onclick="selectChild('+s.id+')">Ver perfil</button></div>'+
          '</article>';
        }).join('')+
      '</div>'+
      '<div class="recent-activity-section"><h3>Actividad reciente familiar</h3><div class="timeline">'+
        state.db.timeline.slice(0,6).map(function(x){return '<div class="tl"><b>'+x.date+'</b><p>'+x.text+'</p></div>'}).join('')||
        '<div class="empty-state">Sin actividad reciente.</div>'+
      '</div></div>'+
    '</div>';
}

/* ---- Children Page: List + Select ---- */
function childrenPage(){
  var children=getChildren();
  content.innerHTML=
    '<div class="parent-dashboard-wrapper">'+
      '<div class="parent-dashboard-header"><h2>Mis hijos</h2></div>'+
      (children.length?
        '<div class="auto">'+
          children.map(function(s){
            return '<article class="card">'+
              '<h3>'+s.name+'</h3>'+
              '<p class="muted">'+s.grade+' \u00B7 Seccion '+s.section+'</p>'+
              '<div class="child-stats-row">'+
                '<div class="child-stat-item"><span class="stat-label">Promedio</span><span class="stat-value">'+avg(s.id)+'</span></div>'+
                '<div class="child-stat-item"><span class="stat-label">Asistencia</span><span class="stat-value">'+attPct(s.id)+'%</span></div>'+
                '<div class="child-stat-item"><span class="stat-label">Pendientes</span><span class="stat-value">'+pending(s.id).length+'</span></div>'+
              '</div>'+
              '<div class="actions" style="justify-content:center"><button class="btn primary" onclick="selectChild('+s.id+')">Seleccionar</button></div>'+
            '</article>';
          }).join('')+
        '</div>':
        '<div class="empty-state">No hay estudiantes asociados a tu cuenta.</div>'
      )+
    '</div>';
}

/* ---- Select Child: Enter child context ---- */
function selectChild(sid){
  state.childId=sid;
  childContextPage();
}

/* ---- Child Context: Full child view with secondary bar ---- */
function childContextPage(){
  var sid=state.childId;
  var x=st(sid);
  if(!x){childrenPage();return;}
  var trend=studentTrend(x.id);
  var children=getChildren();
  if(!window._parentChildTab) window._parentChildTab='cursos';
  var activeTab=window._parentChildTab;

  window.switchTab=function(t){window._parentChildTab=t;childContextPage();};

  content.innerHTML=
    '<div class="child-context-bar">'+
      '<button class="course-back-btn" onclick="openPage(\'dashboard\')" title="Volver al panel familiar"> Inicio</button>'+
      '<div class="child-context-info">'+
        '<span class="child-context-name">'+x.name+' <small class="muted">'+x.grade+' '+x.section+'</small></span>'+
      '</div>'+
      '<div class="child-context-actions">'+
        (children.length>1?
          '<select class="child-switch-select" onchange="selectChild(+this.value)">'+
            children.map(function(ch){
              return '<option value="'+ch.id+'"'+(ch.id===sid?' selected':'')+'>'+ch.name+' · '+ch.grade+' '+ch.section+'</option>';
            }).join('')+
          '</select>':''
        )+
      '</div>'+
    '</div>'+

    '<div class="page-body">'+
      '<div class="course-nav-bar-container"><div class="course-nav-bar">'+
        '<button class="nav-tab-btn'+(activeTab==='resumen'?' active':'')+'" onclick="switchTab(\'resumen\')">Resumen General</button>'+
        '<button class="nav-tab-btn'+(activeTab==='cursos'?' active':'')+'" onclick="switchTab(\'cursos\')">Cursos</button>'+
      '</div></div>'+

      (activeTab==='resumen'?
        '<div class="tab-resumen">'+
          '<section class="kpi-row">'+
            kpi('Promedio',avg(x.id),'actual',+avg(x.id)<11?'bad':+avg(x.id)>=16?'ok':'warn')+
            kpi('Asistencia',attPct(x.id)+'%','general')+
            kpi('Pendientes',pending(x.id).length,'tareas','warn')+
            kpi('Estrellas',x.stars||0,'canjeables')+
          '</section>'+

          '<section class="chart-row">'+
            '<article class="card"><h3>Rendimiento por curso</h3><div class="scroll-content">'+barChart(trend)+'</div></article>'+
            '<article class="card"><h3>Distribucion del rendimiento</h3><div class="scroll-content">'+ringChart(trend)+parentLowAlerts(x.id)+'</div></article>'+
          '</section>'+

          '<div class="actions" style="justify-content:center;gap:12px;padding:16px 0">'+
            '<button class="btn secondary" onclick="reportsPage('+x.id+')">Ver reportes completos</button>'+
            '<button class="btn secondary" onclick="rewardsPage('+x.id+')">Logros y canjes</button>'+
            '<button class="btn primary" onclick="parentHorarioPage()">Ver horario</button>'+
            '<button class="btn primary" onclick="timelinePage(state.childId)">Ver bitacora</button>'+
          '</div>'+
        '</div>'
      :
        '<div class="tab-cursos">'+
          courseCards(sid)+
        '</div>'
      )+
    '</div>';
}

/* ---- Courses page (accessed from child context or top nav) ---- */
function coursesPage(sid){
  if(state.user.role==='padre'&&!sid)sid=state.childId;
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<section class="section-title"><h2>Cursos</h2></section>'+
    '<div class="page-body">'+courseCards(sid)+'</div>';
}

/* ---- Course Detail with Tabs (Moodle-style) ---- */
function courseDetail(sid,cid,initialTab){
  var c=state.db.courses.find(function(x){return x.id==cid});
  if(!c)return;
  if(initialTab) window._courseDetailTab = initialTab;
  else window._courseDetailTab=window._courseDetailTab||'curso';
  var tab=window._courseDetailTab;
  var isParent=state.user.role==="padre";
  var backAction=isParent?"childContextPage()":"openPage('cursos')";
  var tabs=[
    {id:'curso',label:'Curso'},
    {id:'calificaciones',label:'Calificaciones'},
    {id:'entregas',label:'Entregas'},
    {id:'asistencia',label:'Asistencia'},
    {id:'participantes',label:'Participantes'},
    {id:'logros',label:'Logros'}
  ];
  var tabsHtml=tabs.map(function(t){
    return '<button class="nav-tab-btn'+(tab===t.id?' active':'')+'" data-tab="'+t.id+'" onclick="switchCourseTab('+sid+','+cid+',\''+t.id+'\')">'+t.label+'</button>';
  }).join('');
  var shell=(isParent?childContextBar():'')+
    '<div class="course-view-wrapper">'+
      '<div class="course-main-header course-detail-header course-top-nav-card">'+
        '<div class="course-nav-bar">'+tabsHtml+'</div>'+
      '</div>'+
      '<div id="course-tab-content"></div>'+
    '</div>';
  content.innerHTML=shell;
  updateCourseContent(sid,cid);
}

function switchCourseTab(sid,cid,tabId){
  window._courseDetailTab=tabId;
  var bar=document.querySelector('.course-nav-bar');
  if(bar){
    bar.querySelectorAll('.nav-tab-btn').forEach(function(b){b.classList.remove('active');});
    var active=bar.querySelector('[data-tab="'+tabId+'"]');
    if(active)active.classList.add('active');
  }
  updateCourseContent(sid,cid);
}

function updateCourseContent(sid,cid){
  var c=state.db.courses.find(function(x){return x.id==cid});
  if(!c)return;
  var tab=window._courseDetailTab||'curso';
  var isStudent=state.user.role==="estudiante";
  var courseTasks=studentTasks(sid).filter(function(a){return a.courseId==cid});
  var courseGrades=state.db.grades.filter(function(g){return g.studentId==sid&&g.courseId==cid});
  var courseStudents=state.db.students.filter(function(s){return s.grade===c.grade&&s.section===c.section});
  var syll=syllabusOf(cid);
  var topics=courseTopics(cid);
  var forms=getCourseForms(cid);
  var allTasks=state.db.assignments.filter(function(a){return a.courseId==cid&&!a.hidden});
  var unlinkedTasks=allTasks.filter(function(a){return !a.topicId});
  var unlinkedForms=forms.filter(function(f){return !f.topicId});
  if(unlinkedTasks.length||unlinkedForms.length){
    if(!topics.length){
      var autoTopic={id:Date.now(),courseId:cid,title:'Sesion 1',description:'Tareas y actividades del curso.',fileName:'',fileType:'',fileData:null,publishedAt:today(),createdBy:state.user.id};
      if(!state.db.topics)state.db.topics=[];
      state.db.topics.push(autoTopic);
      topics=courseTopics(cid);
    }
    var lastTopic=topics[topics.length-1];
    unlinkedTasks.forEach(function(a){a.topicId=lastTopic.id;});
    unlinkedForms.forEach(function(f){f.topicId=lastTopic.id;});
    save();
    courseTasks=studentTasks(sid).filter(function(a){return a.courseId==cid});
    forms=getCourseForms(cid);
  }
  var tabContent='';
  if(tab==='curso'){
    var tName = tn(c.teacherId) || 'Joaquín Salas Cruz';
    tabContent='<div class="welcome-banner course-welcome-banner">'+
      '<h2>Bienvenido al curso - '+c.name+'</h2>'+
      '<span class="badge-modalidad" style="background:rgba(255,255,255,0.2);color:#fff;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-block;width:fit-content;">'+c.grade+' &middot; Sección '+c.section+'</span>'+
      '<div class="teacher-name-tag">Docente: '+tName+'</div>'+
    '</div>';
    tabContent+='<div class="section-toggle" onclick="moodleToggle(this,\'silabo_'+cid+'\')"><span class="chev">&#9662;</span> Silabo</div>';
    tabContent+='<div id="silabo_'+cid+'">';
    if(syll){
      tabContent+='<div class="resource-row"><div><span>&#8227; '+syll.title+'</span><div class="meta">'+(syll.fileName||'')+(syll.publishedAt?' &middot; '+syll.publishedAt:'')+'</div></div></div>';
    }else{
      tabContent+='<div class="resource-row"><span class="muted">No hay silabo publicado.</span></div>';
    }
    tabContent+='</div>';
    tabContent+='<div class="section-toggle" onclick="moodleToggle(this,\'sesiones_'+cid+'\')"><span class="chev">&#9662;</span> Sesiones de Aprendizaje</div>';
    tabContent+='<div id="sesiones_'+cid+'">';
    if(topics.length){
      topics.forEach(function(t,idx){
        var tForms=forms.filter(function(f){return f.topicId==t.id});
        var tTasks=courseTasks.filter(function(a){return a.topicId==t.id});
        tabContent+='<div class="session-row" onclick="moodleToggle(this,\'st_'+t.id+'\')"><span class="chev">&#9662;</span><span class="session-pill">'+(idx+1)+'</span> '+t.title+'</div>';
        tabContent+='<div id="st_'+t.id+'" class="session-content">';
        if(t.description){tabContent+='<p>'+t.description+'</p>';}
        if(t.fileName){tabContent+='<div class="resource-row"><span>&#8227; '+t.fileName+'</span></div>';}
        if(tForms.length){
          tabContent+='<div class="green-pill">&#8227; Cuestionarios</div>';
          tForms.forEach(function(f){
            if(isStudent){
              var avail=getAvailableForms(sid);
              var canTake=avail.find(function(x){return x.id===f.id});
              tabContent+='<div class="resource-row"><div><span>&#8227; '+f.title+'</span><div class="meta">'+f.questions.length+' preguntas'+(f.timeLimit?' &middot; '+f.timeLimit+' min':'')+'</div></div><div>'+(canTake?'<button class="btn primary" onclick="event.stopPropagation();studentSolveForm(\''+f.id+'\')">Resolver</button>':'<span class="badge">Resuelto</span>')+'</div></div>';
            }else{
              tabContent+='<div class="resource-row"><div><span>&#8227; '+f.title+'</span><div class="meta">'+f.questions.length+' preguntas</div></div></div>';
            }
          });
        }
        if(tTasks.length){
          tabContent+='<div class="green-pill">&#8227; Tareas</div>';
          tTasks.forEach(function(a){
            var s=sub(a.id,sid);
            var status=s?s.status:'Pendiente';
            var statusBadge=status==='Entregado'?'<span class="badge ok">'+status+'</span>':'<span class="badge b-warn">'+status+'</span>';
            tabContent+='<div class="resource-row"><div><span>&#8227; '+a.title+'</span><div class="meta">Entrega: '+a.due+'</div></div><div style="display:flex;gap:6px;align-items:center">'+statusBadge+(isStudent?'<button class="btn secondary" onclick="event.stopPropagation();openTask('+sid+','+a.id+')">Ver</button>':'')+'</div></div>';
          });
        }
        tabContent+='</div>';
      });
    }else{
      tabContent+='<p class="muted" style="padding:12px 0">El docente aun no ha publicado sesiones.</p>';
    }
    tabContent+='</div>';
  }else if(tab==='calificaciones'){
    var cAvg=courseAvg(sid,cid);
    var avgColor=cAvg<11?'text-danger':cAvg>=16?'text-success':'';
    tabContent='<div class="course-metrics-bar">'+
      '<div class="summary-card"><div class="summary-card-content"><span class="label">Promedio</span><span class="value '+avgColor+'">'+cAvg.toFixed(1)+'</span><span class="sub-label">en este curso</span></div></div>'+
      '<div class="summary-card"><div class="summary-card-content"><span class="label">Notas</span><span class="value">'+courseGrades.length+'</span><span class="sub-label">registradas</span></div></div>'+
    '</div><article class="card">'+gradesTable(courseGrades)+'</article>';
  }else if(tab==='asistencia'){
    var ca=state.db.attendance.filter(function(x){return x.studentId==sid&&x.courseId==cid});
    tabContent='<article class="card"><h3>Asistencia — '+c.name+'</h3>';
    if(ca.length){
      tabContent+='<table class="table"><tr><th>Fecha</th><th>Estado</th><th>%</th></tr>';
      ca.forEach(function(x){
        tabContent+='<tr><td>'+x.date+'</td><td>'+x.status+'</td><td><b>'+attPct(sid,cid)+'%</b></td></tr>';
      });
      tabContent+='</table>';
    }else{
      tabContent+='<div class="empty-state">Sin registros de asistencia.</div>';
    }
    tabContent+='</article>';
  }else if(tab==='entregas'){
    tabContent='<article class="card"><h3>Entregas del curso</h3>';
    if(courseTasks.length){
      courseTasks.forEach(function(a){
        var s=sub(a.id,sid);
        var statusBadge=s&&s.fileName?'<span class="badge ok">Entregado</span>':'<span class="badge b-warn">Pendiente</span>';
        tabContent+='<div class="entrega-row"><div class="entrega-info"><b>'+a.title+'</b><span class="muted">Entrega: '+a.due+'</span>'+(s&&s.fileName?'<span class="muted">Archivo: '+s.fileName+'</span>':'')+'</div><div class="entrega-actions">'+statusBadge+(isStudent?'<button class="btn secondary sm" onclick="event.stopPropagation();openTask('+sid+','+a.id+')">Ver</button>':'')+'</div></div>';
      });
    }else{
      tabContent+='<p class="muted">No hay tareas publicadas.</p>';
    }
    tabContent+='</article>';
  }else if(tab==='participantes'){
    tabContent='<article class="card"><h3>Companeros de clase</h3><table class="table"><tr><th>Nombre</th><th>Grado</th></tr>'+courseStudents.map(function(s){return '<tr><td>'+s.name+'</td><td>'+s.grade+' '+s.section+'</td></tr>'}).join('')+'</table></article>';
  }else if(tab==='logros'){
    var s=st(sid);
    tabContent='<div class="course-metrics-bar">'+
      '<div class="summary-card"><div class="summary-card-content"><span class="label">Estrellas</span><span class="value">'+(s.stars||0)+'</span><span class="sub-label">disponibles</span></div></div>'+
      '<div class="summary-card"><div class="summary-card-content"><span class="label">Nivel</span><span class="value">'+(s.level||1)+'</span><span class="sub-label">actual</span></div></div>'+
    '</div>'+
      '<article class="card"><h3>Canjear estrellas por punto extra</h3>'+
      '<div class="mt-12"><button class="btn primary" onclick="redeemForCourse('+sid+','+cid+')">Canjear 50 estrellas</button></div></article>';
  }
  var el=document.getElementById('course-tab-content');
  if(el)el.innerHTML=tabContent;
}

/* ---- Child Context Bar (reusable for parent sub-pages) ---- */
function childContextBar(){
  var sid=state.childId;
  var x=st(sid);
  if(!x)return'';
  var children=getChildren();
  return '<div class="child-context-bar child-profile-banner">'+
    '<div class="banner-left-group child-banner-title-container">'+
      '<button class="banner-back-btn course-back-btn" onclick="openPage(\'dashboard\')" title="Volver al panel familiar">&lt;</button>'+
      '<div class="banner-student-info child-context-info">'+
        '<span class="banner-student-name">'+x.name+'</span>'+
        '<span class="banner-student-grade">'+x.grade+' '+x.section+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="child-context-actions">'+
      (children.length>1?
        '<select class="child-switch-select child-select-dropdown" onchange="selectChild(+this.value)">'+
          children.map(function(ch){return '<option value="'+ch.id+'"'+(ch.id===sid?' selected':'')+'>'+ch.name+'</option>'}).join('')+
        '</select>':''
      )+
    '</div>'+
  '</div>';
}

/* ---- Standalone pages (still accessible for backward compat) ---- */
function tasksPage(sid){
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<div class="section-title"><h2>Tareas</h2></div>'+
    '<div class="page-body"><section class="chart-row">'+
      '<article class="card"><h3>Pendientes</h3>'+taskRows(sid,pending(sid),true)+'</article>'+
      '<article class="card"><h3>Todas</h3>'+taskRows(sid,studentTasks(sid),true)+'</article>'+
    '</section></div>';
}

function gradesPage(sid){
  var g=state.db.grades.filter(function(x){return x.studentId==sid});
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<div class="section-title"><h2>Notas</h2></div>'+
    '<div class="page-body"><section class="kpi-row">'+
      kpi('Promedio',avg(sid),'actual')+
      kpi('I Bim',bimAvg(sid,'I'),'')+
      kpi('Notas',g.length,'registradas')+
      kpi('Riesgo',+avg(sid)<11?'Alto':+avg(sid)<14?'Medio':'Bajo','motor inteligente',+avg(sid)<11?'bad':+avg(sid)<14?'warn':'ok')+
    '</section><article class="card">'+gradesTable(g)+'</article></div>';
}

function attendancePage(sid){
  var a=state.db.attendance.filter(function(x){return x.studentId==sid});
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<div class="section-title"><h2>Asistencia</h2></div>'+
    '<div class="page-body"><section class="kpi-row">'+
      kpi('Asistencia',attPct(sid)+'%','general')+
      kpi('Presentes',a.filter(function(x){return x.status==='Presente'}).length,'')+
      kpi('Tardanzas',a.filter(function(x){return x.status==='Tarde'}).length,'','warn')+
      kpi('Ausencias',a.filter(function(x){return x.status==='Ausente'}).length,'','bad')+
    '</section><article class="card">'+(a.length?'<table class="table"><tr><th>Curso</th><th>Fecha</th><th>Estado</th></tr>'+rows(a.map(function(x){return[cn(x.courseId),x.date,x.status]}))+'</table>':'<div class="empty-state">Sin registros de asistencia.</div>')+'</article></div>';
}

function rewardsPage(sid){
  var s=st(sid);
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<div class="section-title"><h2>Gamificacion</h2></div>'+
    '<div class="page-body"><section class="kpi-row">'+
      kpi('Estrellas',s.stars||0,'disponibles')+
      kpi('Nivel',s.level||1,'actual')+
      kpi('Canje','50',' = +1 punto')+
      kpi('Tareas',studentTasks(sid).length,'asignadas')+
    '</section><article class="card"><h3>Canjear estrellas por punto extra</h3>'+
    '<select id="rewardCourse">'+studentCourses(sid).map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join('')+'</select>'+
    '<div class="mt-12"><button class="btn primary" onclick="redeem('+sid+')">Canjear 50 estrellas</button></div></article></div>';
}

function redeem(sid){
  var s=st(sid);
  if((s.stars||0)<50)return toast('No tiene suficientes estrellas');
  s.stars-=50;
  state.db.grades.unshift({studentId:sid,courseId:+rewardCourse.value,type:'Canje',name:'Punto extra por estrellas',score:1,date:today(),bim:'I'});
  addTL(s.name+' canjeo 50 estrellas por +1 punto en '+cn(+rewardCourse.value),sid);
  save();
  toast('Canje realizado');
  openPage('dashboard');
}

function redeemForCourse(sid,cid){
  var s=st(sid);
  if((s.stars||0)<50)return toast('No tiene suficientes estrellas');
  s.stars-=50;
  state.db.grades.unshift({studentId:sid,courseId:cid,type:'Canje',name:'Punto extra por estrellas',score:1,date:today(),bim:'I'});
  addTL(s.name+' canjeo 50 estrellas por +1 punto en '+cn(cid),sid);
  save();
  toast('Canje realizado');
  courseDetail(sid,cid);
}

function timelinePage(sid){
  var list=state.db.timeline.filter(function(x){return !sid||x.studentId==sid});
  content.innerHTML=(state.user.role==='padre'?childContextBar():'')+
    '<div class="section-title"><h2>Bitacora</h2></div>'+
    '<div class="page-body"><article class="card"><h3>Actividad reciente</h3><div class="timeline">'+
      list.map(function(x){return '<div class="tl"><b>'+x.date+'</b><p>'+x.text+'</p></div>'}).join('')||
      '<div class="empty-state">Sin eventos recientes.</div>'+
    '</div></article></div>';
}

function parentHorarioPage(){
  var chs = getChildren();
  if(!state.childId && chs && chs.length > 0){
    state.childId = chs[0].id;
  }
  var sid = state.childId;
  if(!sid){
    if(typeof childrenPage === 'function') childrenPage();
    return;
  }
  var s = st(sid);
  if(!s){
    if(typeof childrenPage === 'function') childrenPage();
    return;
  }
  var entries = (state.db.schedules || []).filter(function(x){
    return x.grade === s.grade && x.section === s.section;
  }).map(function(x){
    return {day: x.day, hour: x.hour, courseId: x.courseId};
  });
  content.innerHTML = childContextBar() +
    '<div class="section-title"><h2>Horario de ' + s.name + '</h2><p>' + s.grade + ' ' + s.section + '</p></div>' +
    '<div class="page-body"><article class="card">' + renderScheduleGrid(entries) + '</article></div>';
}

function reportsPage(sid){
  var trend=studentTrend(sid);
  content.innerHTML=(state.user.role==="padre"?childContextBar():"")+
    '<div class="section-title"><h2>Reportes</h2></div>'+
    '<div class="page-body"><section class="chart-row">'+
      '<article class="card"><h3>Reporte academico</h3><div class="scroll-content">'+ringChart(trend)+'</div></article>'+
      '<article class="card"><h3>Resumen por anillos</h3><div class="scroll-content">'+verticalBars(trend)+'</div></article>'+
    '</section></div>';
}

/* ---- Student Dashboard (also used for student role) ---- */
function dashStudent(){
  var x=st(state.user.id);
  var trend=studentTrend(x.id);
  content.innerHTML=
    '<div class="section-title"><h2>Panel del estudiante</h2></div>'+
    '<div class="page-body">'+
      '<section class="kpi-row">'+
        kpi('Promedio',avg(x.id),'actual',+avg(x.id)<11?'bad':+avg(x.id)>=16?'ok':'warn')+
        kpi('Asistencia',attPct(x.id)+'%','general')+
        kpi('Pendientes',pending(x.id).length,'tareas','warn')+
        kpi('Estrellas',x.stars||0,'canjeables')+
      '</section>'+
      '<section class="chart-row">'+
        '<article class="card"><h3>Rendimiento por curso</h3><div class="scroll-content">'+barChart(trend)+'</div></article>'+
        '<article class="card"><h3>Mi desempeno</h3><div class="scroll-content">'+ringChart(trend)+'</div></article>'+
      '</section>'+
      '<section class="chart-row">'+
        '<article class="card"><h3>Mis tareas</h3>'+taskRows(x.id,studentTasks(x.id),true)+'</article>'+
        '<article class="card"><h3>Proximas actividades</h3>'+upcomingForStudent(x.id)+'</article>'+
      '</section>'+
    '</div>';
}

/* studentHorarioPage lives in student.js */
