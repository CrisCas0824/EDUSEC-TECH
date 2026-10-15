function attRegisterPage(){content.innerHTML=`<div class="section-title"><h2>Asistencia</h2></div><div class="page-body"><article class="card"><h3>Registrar asistencia por curso</h3><form class="form"><label>Curso<select id="acourse" onchange="drawAtt()">${myCoursesDoc().map(c=>`<option value="${c.id}">${c.name} · ${c.grade} ${c.section}</option>`).join('')}</select></label><label>Fecha<input id="adate" type="date" value="${today()}"></label></form><div id="attbox"></div><button class="btn primary" onclick="saveAtt()">Guardar asistencia</button></article></div>`;drawAtt()}

function drawAtt(){let c=state.db.courses.find(x=>x.id==acourse.value);attbox.innerHTML=`<table class="table"><tr><th>Alumno</th><th>Estado</th><th>Observación</th></tr>${rows(studentsOfCourse(c).map(s=>[s.name,`<select id="as${s.id}"><option>Presente</option><option>Tarde</option><option>Ausente</option></select>`,`<input id="an${s.id}" placeholder="Observación">`]))}</table>`}

function saveAtt(){let c=state.db.courses.find(x=>x.id==acourse.value);studentsOfCourse(c).forEach(s=>{let status=document.getElementById('as'+s.id).value;state.db.attendance=state.db.attendance.filter(a=>!(a.studentId==s.id&&a.courseId==c.id&&a.date==adate.value));state.db.attendance.push({studentId:s.id,courseId:c.id,date:adate.value,status,note:document.getElementById('an'+s.id).value});if(status!=='Presente'){addN({toRole:'padre',parentId:s.parentId,title:'Alerta de asistencia',text:`${s.name} registró ${status} en ${c.name}.`,link:'asistencia'});addN({toRole:'estudiante',studentId:s.id,title:'Asistencia registrada',text:`${status} en ${c.name}.`,link:'asistencia'})}});save();toast('Asistencia guardada')}

function showRiskReport(){
  let data=[];
  myCoursesDoc().forEach(c=>{
    studentsOfCourse(c).forEach(s=>{
      let a=+avg(s.id);
      if(a<11) data.push([`${s.name.split(" ")[0]} ${c.grade}${c.section}`, Math.round((a/20)*100)]);
    });
  });
  if(!data.length) data=myCoursesDoc().slice(0,8).map(c=>{
    let label=c.name.length>12?c.name.slice(0,10)+'…':c.name;
    return [`${label} ${c.grade}${c.section}`, teacherCourseValue(c)];
  });
  content.innerHTML=`<section class="section-title"><h2>Reporte de riesgo académico</h2><div class="hdr-actions"><button class="btn secondary" onclick="openPage('reportes')">Volver</button></div></section><div class="page-body"><section class="chart-row"><article class="card"><h3>Riesgo por curso</h3><div class="scroll-content">${verticalBars(data)}</div></article><article class="card"><h3>Distribución de riesgo</h3><div class="scroll-content">${ringChart(data)}</div></article></section></div>`;
}

function teacherReportsPage(){
  let data=teacherReportData();
  content.innerHTML=`<div class="section-title"><h2>Reportes</h2></div><div class="page-body"><section class="chart-row"><article class="card"><h3>Reporte docente</h3><div class="scroll-content">${verticalBars(data)}</div></article><article class="card"><h3>Centro de reportes</h3><div class="scroll-content"><div class="actions-column"><button class="btn secondary" onclick="showRiskReport()">Riesgo académico</button><button class="btn secondary" onclick="showAttendanceReport()">Asistencia</button></div><h3>Resumen por anillos</h3>${ringChart(data)}</div></article></section></div>`;
}

function showAttendanceReport(){
  let data=myCoursesDoc().map(c=>{
    let studs=studentsOfCourse(c);
    let avg=studs.length?Math.round(studs.reduce((a,s)=>a+attPct(s.id,c.id),0)/studs.length):0;
    let label=c.name.length>12?c.name.slice(0,10)+'…':c.name;
    return [`${label} ${c.grade}${c.section}`,avg];
  });
  content.innerHTML=`<section class="section-title"><h2>Reporte de asistencia</h2><div class="hdr-actions"><button class="btn secondary" onclick="openPage('reportes')">Volver</button></div></section><div class="page-body"><section class="chart-row"><article class="card"><h3>Asistencia por curso</h3><div class="scroll-content">${verticalBars(data)}</div></article><article class="card"><h3>Distribución de asistencia</h3><div class="scroll-content">${ringChart(data)}</div></article></section></div>`;
}
