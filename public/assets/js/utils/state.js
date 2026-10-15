let state={user:null,db:null,page:'dashboard',childId:1};
let _calKey=STORE+'_calMonth';
state.calendarMonth = Number(localStorage.getItem(_calKey)) || 5;
function saveCalMonth(m){state.calendarMonth=m;try{localStorage.setItem(_calKey,String(m))}catch(e){}}

function load(){
  try{
    let raw=localStorage.getItem(STORE);
    state.db = raw ? JSON.parse(raw) : demoDB();
  }catch(e){
    try{state.db = demoDB();}catch(e2){console.error('demoDB() error:',e2);state.db={courses:[],students:[],teachers:[],parents:[],assignments:[],submissions:[],grades:[],attendance:[],notifications:[],messages:[],timeline:[],users:[],directors:[],schedules:[],syllabus:[],topics:[],forms:[],formResponses:[],bimesters:[]};}
  }
  try{ensureInteractiveData();}catch(e){console.error('ensureInteractiveData error:',e);}
  try{ensureSyllabusData();}catch(e){console.error('ensureSyllabusData error:',e);}
  try{ensureUsersData();}catch(e){console.error('ensureUsersData error:',e);}
  try{ensureScheduleData();}catch(e){console.error('ensureScheduleData error:',e);}
  save();
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state.db))}catch(e){toast('Error al guardar datos. Espacio insuficiente.')}}

/* Entidades */
function getChildren(){ if(!state || !state.user || state.user.role !== 'padre') return (state.db && state.db.students) ? state.db.students : []; var pid = state.user.id; var stds = (state.db && state.db.students) ? state.db.students : []; return stds.filter(function(s){ return s.parentId === pid; }); }
function st(id){return state.db.students.find(s=>s.id==id)}
function cn(id){return state.db.courses.find(c=>c.id==id)?.name||'Curso'}
function tn(id){return state.db.teachers.find(t=>t.id==id)?.name||'Docente'}
function sn(id){return st(id)?.name||'Estudiante'}
function myCoursesDoc(){return state.db.courses.filter(c=>c.teacherId===state.user.id)}
function studentsOfCourse(c){return state.db.students.filter(s=>s.grade===c.grade&&s.section===c.section)}
function studentCourses(sid){let x=st(sid);return state.db.courses.filter(c=>c.grade===x.grade&&c.section===x.section)}
function studentTasks(sid){let ids=studentCourses(sid).map(c=>c.id);return state.db.assignments.filter(a=>ids.includes(a.courseId)&&!a.hidden)}
function sub(aid,sid){return state.db.submissions.find(s=>s.assignmentId==aid&&s.studentId==sid)}
function avg(sid){let g=state.db.grades.filter(x=>x.studentId==sid);return g.length?(g.reduce((a,b)=>a+b.score,0)/g.length).toFixed(1):'0.0'}
function attPct(sid,cid=null){let a=state.db.attendance.filter(x=>x.studentId==sid&&(!cid||x.courseId==cid));return a.length?Math.round(a.filter(x=>x.status==='Presente').length/a.length*100):100}
function pending(sid){return studentTasks(sid).filter(a=>{let x=sub(a.id,sid);return !x||x.status==='Pendiente'})}
function courseAvg(sid,cid){let g=state.db.grades.filter(x=>x.studentId==sid&&x.courseId==cid);return g.length?g.reduce((a,b)=>a+b.score,0)/g.length:0}
function bimAvg(sid,b){let g=state.db.grades.filter(x=>x.studentId==sid&&(x.bim||'I')===b);return g.length?(g.reduce((a,b)=>a+b.score,0)/g.length).toFixed(1):'-'}
function thumb(a){return a.fileData&&a.fileType?.startsWith('image/')?`<img class="thumb" src="${a.fileData}">`:`<div class="thumb">${a.fileName||'Archivo'}</div>`}
function today(){return new Date().toISOString().slice(0,10)}

/* Notif y bitácora */
function addN(n){state.db.notifications.unshift({id:Date.now()+Math.random(),time:'Ahora',read:false,...n});updateNotif()}
function addTL(text,sid=null){state.db.timeline.unshift({date:new Date().toLocaleString(),text,studentId:sid})}

/* Utilidades DOM */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const rows=d=>d.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
const badge=(t,c='')=>`<span class="badge ${c}">${t}</span>`;
const kpi=(l,v,d,c='ok')=>`<article class="card kpi"><b class="muted">${l}</b><div class="val">${v}</div><b class="${c}">${d}</b></article>`;
const prog=v=>`<div class="bar"><div class="fill" style="width:${v}%">${v}%</div></div>`;
const chart=arr=>`<div class="chart">${arr.map(x=>`<div class="col"><div class="cbar" style="height:${x[1]}%">${x[1]}%</div><span>${x[0]}</span></div>`).join('')}</div>`;
const safeId=id=>String(id).replace(/[^a-zA-Z0-9]/g,"_");
function fileData(f){return new Promise((r,rej)=>{let fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>rej(new Error('Error al leer archivo'));try{fr.readAsDataURL(f)}catch(e){rej(e)}})}
function openModal(html){
  if(typeof modalBody !== 'undefined' && modalBody){
    let hasCloseBtn = html.includes('modal-close-btn') || html.includes('ai-head-close');
    if(!hasCloseBtn){
      html = '<button class="modal-close-btn" onclick="modal.classList.add(\'hidden\')" style="position:absolute;right:18px;top:18px;">&#10005;</button>' + html;
    }
    modalBody.innerHTML = html;
  }
  if(typeof modal !== 'undefined' && modal) modal.classList.remove('hidden');
}
function toast(t){toastBox.textContent=t;toastBox.classList.remove('hidden','loading');setTimeout(()=>toastBox.classList.add('hidden'),2200)}
function exportPDF(title){
  window.print();
  toast('Abriendo impresión — elige "Guardar como PDF"');
}
function exportCSV(headers,rows,filename){
  let csv=headers.join(',')+'\n'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  let blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename+'.csv';a.click();
  URL.revokeObjectURL(a.href);toast('Archivo CSV descargado');
}
function loading(t){toastBox.innerHTML=`<span class="spin"></span> ${t}`;toastBox.classList.remove('hidden');toastBox.classList.add('loading')}
function stopLoading(){toastBox.classList.add('hidden');toastBox.classList.remove('loading')}

/* Sistema de usuarios (Director) */
function ensureUsersData(){
  state.db.users = state.db.users || [];
  state.db.schedules = state.db.schedules || [];
  if(!state.db.directors){
    state.db.directors = [{id:1, name:'Director General', email:'director001@edusec.pe'}];
  }else if(state.db.directors.length>1){
    state.db.directors = [state.db.directors[0]];
  }
  let users = state.db.users;
  let nextId = users.length ? Math.max(...users.map(u=>u.id)) + 1 : 1;
  const migrate = (arr, role) => {
    arr.forEach(item => {
      if(!users.some(u => u.email === item.email)){
        users.push({id:nextId++, email:item.email, password:'123456', role, refId:item.id, active:true, securityAnswer:'Pérez'});
      }
    });
  };
  migrate(state.db.teachers || [], 'docente');
  migrate(state.db.students || [], 'estudiante');
  migrate(state.db.parents || [], 'padre');
  migrate(state.db.directors, 'director');
  state.db.users = state.db.users.filter(u => u.role!=='director' || state.db.directors.some(d => d.email===u.email));
  (state.db.teachers||[]).forEach(t=>{
    let old=!t.assignments||(t.assignments.length&&!t.assignments[0].courseName);
    if(old) t.assignments=(state.db.courses||[]).filter(c=>c.teacherId===t.id).map(c=>({courseName:c.name,grade:c.grade,section:c.section}));
    if(t.assignments&&t.assignments.length) t.specialties=[...new Set(t.assignments.map(a=>a.courseName))];
  });
}
function findUser(email){
  ensureUsersData();
  return state.db.users.find(u => u.email === email.toLowerCase().trim()) || null;
}
function loginUser(email, password){
  let u = findUser(email);
  if(!u) return null;
  if(!u.active) return 'inactive';
  if(u.password !== password) return null;
  return u;
}

function ensureScheduleData(){
  state.db.schedules = state.db.schedules || [];
  let sch = state.db.schedules;
  let days = ['Lun','Mar','Mie','Jue','Vie'];
  let hours = ['08:00','09:00','10:20','11:40'];
  let needsSave = false;

  let oldHours = ['10:00','11:20','12:20'];
  if(sch.some(function(x){ return oldHours.indexOf(x.hour) >= 0; })){
    sch = sch.filter(function(x){ return oldHours.indexOf(x.hour) < 0; });
    needsSave = true;
  }

  let SCHEDULE_TEMPLATE = [
    0,0,1,2,
    3,3,4,5,
    6,6,7,8,
    9,9,0,1,
    3,3,4,9
  ];

  grades.forEach(function(g){
    sections.forEach(function(s){
      let sc = state.db.courses.filter(function(c){ return c.grade === g && c.section === s; });
      if(!sc.length) return;
      let existing = sch.filter(function(x){ return x.grade===g && x.section===s; });
      if(existing.length >= 20) return;
      sch = sch.filter(function(x){ return !(x.grade===g && x.section===s); });
      let si = sections.indexOf(s);
      let idx = 0;
      days.forEach(function(d){
        hours.forEach(function(h){
          let ci = (SCHEDULE_TEMPLATE[idx] + si) % 10;
          sch.push({grade:g, section:s, day:d, hour:h, courseId:sc[ci].id});
          idx++;
        });
      });
      needsSave = true;
    });
  });
  state.db.schedules = sch;
  if(needsSave) save();
}

/* ---- Course Topics ---- */
function courseTopics(cid){return (state.db.topics||[]).filter(t=>t.courseId==cid).sort((a,b)=>b.id-a.id)}
function addTopic(cid,title,description,fileName,fileType,fileData){
  if(!state.db.topics)state.db.topics=[];
  let t={id:Date.now(),courseId:cid,title,description:description||'',fileName:fileName||'',fileType:fileType||'',fileData:fileData||null,publishedAt:today(),createdBy:state.user.id};
  state.db.topics.push(t);
  let c=state.db.courses.find(x=>x.id==cid);
  if(c){
    state.db.students.filter(s=>s.grade===c.grade&&s.section===c.section).forEach(s=>{
      addN({toRole:'estudiante',studentId:s.id,title:'Nuevo tema',text:`Se publicó "${title}" en ${c.name}.`,link:'cursos',refType:'topic',courseId:cid});
      addN({toRole:'padre',parentId:s.parentId,title:'Nuevo tema',text:`Se publicó "${title}" en ${c.name}.`,link:'cursos',refType:'topic',courseId:cid});
    });
  }
  save();
}
function deleteTopic(id){
  if(!state.db.topics)return;
  state.db.topics=state.db.topics.filter(t=>t.id!=id);
  save();
}
