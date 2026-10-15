function visibleCalendarEvents(){
  ensureBimestersSafe();
  let courseIds=[];
  if(state.user.role==="docente") courseIds=myCoursesDoc().map(c=>c.id);
  if(state.user.role==="estudiante") courseIds=studentCourses(state.user.id).map(c=>c.id);
  if(state.user.role==="padre") courseIds=getChildren().flatMap(ch=>studentCourses(ch.id).map(c=>c.id));
  if(state.user.role==="director") courseIds=(state.db.courses||[]).map(c=>c.id);
  let ev=[];
  state.db.assignments.filter(a=>courseIds.includes(a.courseId)&&(state.user.role==='docente'||!a.hidden)).forEach(a=>ev.push({kind:"task",id:a.id,date:a.due,title:a.title,courseId:a.courseId}));
  state.db.grades.filter(g=>courseIds.includes(g.courseId)).slice(0,80).forEach(g=>ev.push({kind:"grade",date:g.date,title:`Nota: ${cn(g.courseId)}`,courseId:g.courseId,studentId:g.studentId}));
  state.db.bimesters.forEach(b=>{ev.push({kind:"bimester",id:b.id,date:b.end,title:`Finaliza ${b.name}`,courseId:null,status:b.status});});
  return ev.sort((a,b)=>a.date.localeCompare(b.date));
}

function calendarPage(){
  let months=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  let m=state.calendarMonth??5;
  let ev=visibleCalendarEvents().filter(e=>+e.date.slice(5,7)===m+1);
  content.innerHTML=`<section class="section-title"><div><h2>${months[m]} ${new Date().getFullYear()}</h2><p class="muted">Haz clic en una actividad para abrirla.</p></div><div class="hdr-actions"><button class="btn secondary" onclick="prevMonth()"> Anterior</button><button class="btn secondary" onclick="nextMonth()">Siguiente </button></div></section><div class="page-body"><article class="card">${calendarGrid(m,ev)}</article></div>`;
}

function prevMonth(){state.calendarMonth=(state.calendarMonth??5)-1;if(state.calendarMonth<0)state.calendarMonth=11;saveCalMonth(state.calendarMonth);calendarPage();}
function nextMonth(){state.calendarMonth=(state.calendarMonth??5)+1;if(state.calendarMonth>11)state.calendarMonth=0;saveCalMonth(state.calendarMonth);calendarPage();}

function calendarGrid(month,events){
  let y=new Date().getFullYear(),total=new Date(y,month+1,0).getDate(),first=(new Date(y,month,1).getDay()+6)%7;
  let html=`<div class="cal-heads"><b>Lun</b><b>Mar</b><b>Mié</b><b>Jue</b><b>Vie</b><b>Sáb</b><b>Dom</b></div><div class="cal-days">`;
  for(let i=0;i<first;i++) html+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=total;d++){
    let date=`${y}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    let list=events.filter(e=>e.date===date);
    html+=`<div class="cal-day"><b>${d}</b>${list.slice(0,4).map(e=>`<button onclick="${calendarTarget(e)}">${e.kind==="task"?'':''} ${e.title.slice(0,24)}</button>`).join("")}</div>`;
  }
  return html+`</div>`;
}

function calendarTarget(e){
  if(e.kind==="bimester"){
    if(state.user.role==="docente") return `openPage('calificar')`;
    if(state.user.role==="padre") return `openPage('notas')`;
    if(state.user.role==="estudiante") return `openPage('notas')`;
    return `openPage('dashboard')`;
  }
  if(e.kind==="task"){
    if(state.user.role==="docente") return `taskSubmissionPanel(${e.id})`;
    let sid=state.user.role==="padre"?state.childId:state.user.id;
    return `courseDetail(${sid},${e.courseId})`;
  }
  if(state.user.role==="docente") return `teacherCourseDetail(${e.courseId})`;
  let sid=state.user.role==="padre"?state.childId:state.user.id;
  return `courseDetail(${sid},${e.courseId})`;
}
