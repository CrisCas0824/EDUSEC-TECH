function dashTeacher(){
  let cs=myCoursesDoc();
  let ids=cs.map(c=>c.id);
  let students=[...new Map(cs.flatMap(c=>studentsOfCourse(c)).map(s=>[s.id,s])).values()];
  let data=teacherReportData();
  let entregas=state.db.submissions.filter(s=>s.status!=="Pendiente" && ids.includes(state.db.assignments.find(a=>a.id===s.assignmentId)?.courseId)).length;
  content.innerHTML=`<div class="section-title"><h2>Panel docente</h2></div>
    <div class="page-body">
      <section class="kpi-row">${kpi("Cursos",cs.length,"asignados")}${kpi("Mis alumnos",students.length,"segundos mis cursos")}${kpi("Tareas",state.db.assignments.filter(a=>ids.includes(a.courseId)).length,"publicadas")}${kpi("Entregas",entregas,"recibidas","warn")}</section>
      <section class="chart-row"><article class="card"><h3>Rendimiento por curso/seccion</h3><div class="scroll-content">${barChart(data)}</div></article><article class="card"><h3>Grafico de anillos</h3><div class="scroll-content">${ringChart(data)}</div></article></section>
      <article class="card"><h3>Acciones rapidas</h3>
        <div class="actions">
          <button class="btn primary" onclick="openPage('misCursos')">Ver mis cursos</button>
          <button class="btn secondary" onclick="openPage('mensajes')">Enviar mensajes</button>
        </div>
      </article>
    </div>`;
}

function teacherAlerts(){let arr=[];myCoursesDoc().forEach(c=>studentsOfCourse(c).slice(0,6).forEach(s=>{let a=+avg(s.id);if(a<11)arr.push(`<div class="alert critical"><b>${s.name}</b><span>Promedio bajo. Brindar retroalimentación en ${c.name}.</span></div>`)}));return arr.join('')||'<div class="alert good"><b>Sin riesgos críticos</b></div>'}

function teacherStudentsPage(){let cs=myCoursesDoc(),ids=new Set(cs.flatMap(c=>studentsOfCourse(c).map(s=>s.id))),list=state.db.students.filter(s=>ids.has(s.id));content.innerHTML=`<div class="section-title"><h2>Mis alumnos</h2></div><div class="page-body"><article class="card"><h3>${list.length} alumno(s) asignados</h3>${list.length?`<table class="table"><tr><th>Alumno</th><th>Grado</th><th>Sección</th><th>Promedio</th><th>Asistencia</th></tr>${rows(list.map(s=>[s.name,s.grade,s.section,avg(s.id),attPct(s.id)+'%']))}</table>`:`<div class="empty-state">Aún no tienes estudiantes asignados.</div>`}</article></div>`}

function teacherTasksTable(){let ids=myCoursesDoc().map(c=>c.id),list=state.db.assignments.filter(a=>ids.includes(a.courseId));if(!list.length)return`<div class="alert info"><b>Sin tareas</b><span>Aún no has publicado tareas.</span></div>`;return `<table class="table"><tr><th>Curso</th><th>Tarea</th><th>Entrega</th><th>Recibidas</th></tr>${rows(list.map(a=>[cn(a.courseId),a.title,a.due,state.db.submissions.filter(s=>s.assignmentId==a.id&&s.status==='Entregado').length]))}</table>`}
function teacherHorarioPage(){
  var cs=myCoursesDoc(),ids=cs.map(function(c){return c.id;});
  var entries=(state.db.schedules||[]).filter(function(s){return ids.includes(s.courseId);}).map(function(s){
    return{day:s.day,hour:s.hour,courseId:s.courseId};
  });
  content.innerHTML='<div class="section-title"><h2>Mi horario</h2></div><div class="page-body"><article class="card">'+renderScheduleGrid(entries,{showSection:true})+'</article></div>';
}
