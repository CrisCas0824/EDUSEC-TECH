function coursePercent(sid,cid){
  let g = state.db.grades.filter(x=>x.studentId==sid && x.courseId==cid);
  if(g.length){
    let avgScore = g.reduce((a,b)=>a+Number(b.score||0),0)/g.length;
    return Math.max(5, Math.min(100, Math.round((avgScore/20)*100)));
  }
  let tasks = state.db.assignments.filter(a=>a.courseId==cid);
  let delivered = tasks.filter(a=>{
    let s = sub(a.id,sid);
    return s && s.status !== "Pendiente";
  }).length;
  let base = tasks.length ? Math.round((delivered/tasks.length)*40) : 20;
  return Math.max(15, Math.min(95, 35 + base + ((sid*7+cid*3)%25)));
}

function studentTrend(sid){
  return studentCourses(sid).slice(0,8).map(c=>[c.name.length>12?c.name.slice(0,10)+'…':c.name, coursePercent(sid,c.id)]);
}

function teacherCourseValue(c){
  let studs = studentsOfCourse(c);
  if(!studs.length) return 20;
  let vals = studs.map(s=>coursePercent(s.id,c.id));
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
}

function teacherReportData(){
  return myCoursesDoc().slice(0,8).map(c=>{
    let label=c.name.length>10?c.name.slice(0,8)+'…':c.name;
    return [`${label} ${c.grade}${c.section}`, teacherCourseValue(c)];
  });
}

function barChart(data){
  return `<div class="pro-bars">${data.map(d=>{
    let v=Math.max(5,Math.min(100,Number(d[1])||0));
    return `<div class="pro-bar-row"><span>${d[0]}</span><div class="pro-bar-track"><div class="pro-bar-fill" style="width:${v}%"><b>${v}%</b></div></div></div>`;
  }).join("")}</div>`;
}

function lineChart(data){
  let clean=data.map(d=>[String(d[0]),Math.max(5,Math.min(100,Number(d[1])||0))]);
  if(clean.length===1) clean.push(["", clean[0][1]]);
  let pts=clean.map((d,i)=>({
    label:d[0],
    val:d[1],
    x:8 + i*(84/(Math.max(1,clean.length-1))),
    y:92 - (d[1]*0.74)
  }));
  let poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
  return `<div class="line-proper"><svg viewBox="0 0 100 110" preserveAspectRatio="none">
    <line x1="6" y1="18" x2="6" y2="94"></line>
    <line x1="6" y1="94" x2="96" y2="94"></line>
    <line class="grid" x1="6" y1="57" x2="96" y2="57"></line>
    <polyline points="${poly}" fill="none"></polyline>
    ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="2.6"></circle><text x="${p.x}" y="${Math.max(12,p.y-5)}">${p.val}%</text>`).join("")}
  </svg><div class="line-proper-labels">${pts.filter(p=>p.label).map(p=>`<span>${p.label}</span>`).join("")}</div></div>`;
}

function ringChart(data){
  return `<div class="ring-grid">${data.slice(0,6).map(d=>{
    let v=Math.max(5,Math.min(100,Number(d[1])||0));
    return `<div class="ring-item" style="--v:${v}"><div class="ring"><b>${v}%</b></div><span>${d[0]}</span></div>`;
  }).join("")}</div>`;
}

function verticalBars(data){
  return `<div class="vertical-bars">${data.map(d=>{
    let v=Math.max(5,Math.min(100,Number(d[1])||0));
    return `<div class="vertical-item"><div class="vertical-value">${v}%</div><div class="vertical-track"><div class="vertical-fill" style="height:${v}%"></div></div><b>${d[0]}</b></div>`;
  }).join("")}</div>`;
}
