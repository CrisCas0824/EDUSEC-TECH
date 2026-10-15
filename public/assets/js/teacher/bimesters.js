function openSyllabusEditor(cid){
  let c=state.db.courses.find(x=>x.id==cid);
  let s=syllabusOf(cid);
  openModal(`<h2>Subir sílabo</h2><p>${c.name} · ${c.grade} ${c.section}</p><form id="syForm" class="form"><label>Título<input id="syTitle" value="${s.title}"></label><label>Fecha<input id="syDate" type="date" value="${s.publishedAt||today()}"></label><label class="full">Descripción<textarea id="syDesc">${s.description||""}</textarea></label><label class="full">Archivo del sílabo<input id="syFile" type="file"></label><div class="full"><button class="btn primary">Guardar sílabo</button></div></form>`);
  syForm.onsubmit=e=>saveSyllabus(e,cid);
}

async function saveSyllabus(e,cid){
  e.preventDefault();
  let s=syllabusOf(cid);
  let f=syFile.files[0];
  s.title=syTitle.value;
  s.description=syDesc.value;
  s.publishedAt=syDate.value||today();
  s.createdBy=state.user.id;
  if(f){
    s.fileName=f.name;
    s.fileType=f.type||"archivo";
    s.fileData=await fileData(f);
  }
  let c=state.db.courses.find(x=>x.id==cid);
  studentsOfCourse(c).forEach(stu=>{
    addN({toRole:"estudiante",studentId:stu.id,title:"Sílabo publicado",text:`Se publicó el sílabo de ${c.name}.`,link:"cursos",refType:"syllabus",courseId:cid,studentId:stu.id});
    addN({toRole:"padre",parentId:stu.parentId,title:"Sílabo publicado",text:`Se publicó el sílabo de ${c.name} para ${stu.name}.`,link:"cursos",refType:"syllabus",courseId:cid,studentId:stu.id});
  });
  save();
  modal.classList.add("hidden");
  toast("Sílabo guardado");
  teacherCourseDetail(cid);
}

function openBimesterGradePanel(cid){
  ensureBimestersSafe();
  let c = state.db.courses.find(x=>x.id==cid);
  if(!c) return toast("Curso no encontrado");
  content.innerHTML = `<section class="section-title"><div><h2>Calificar bimestre</h2><p>${c.name} · ${c.grade} ${c.section}</p></div><div class="hdr-actions"><button class="btn secondary" onclick="teacherCourseDetail(${cid})">Volver</button></div></section>
  <div class="page-body">
    <article class="card"><h3>Registro de nota bimestral</h3><p class="muted">Selecciona el bimestre y registra la nota final por alumno.</p>
    <label>Bimestre<select id="bimSelect" onchange="drawBimesterTable(${cid})">${state.db.bimesters.map(b=>`<option value="${b.id}">${b.name} · ${b.status}</option>`).join("")}</select></label>
    <div id="bimesterBox"></div></article>
  </div>`;
  drawBimesterTable(cid);
}

function drawBimesterTable(cid){
  let c = state.db.courses.find(x=>x.id==cid);
  let bim = document.getElementById("bimSelect")?.value || "I";
  let students = studentsOfCourse(c);
  document.getElementById("bimesterBox").innerHTML = `<div class="table-wrap"><table class="table"><tr><th>Alumno</th><th>Bimestre</th><th>Promedio tareas</th><th>Nota final bimestre</th><th>Retroalimentación</th><th>Acción</th></tr>${rows(students.map(s=>{
    let taskAvg=bimesterAverageForStudentSafe(s.id,cid,bim)||"-";
    let existing=state.db.grades.find(g=>g.studentId==s.id&&g.courseId==cid&&g.type==="Bimestre"&&g.bim===bim);
    let key=`${cid}_${s.id}_${bim}`;
    return [s.name,bim,taskAvg,`<input id="bimScore_${key}" type="number" min="0" max="20" value="${existing?.score??""}" placeholder="0-20">`,`<input id="bimFeed_${key}" placeholder="Retroalimentación" value="${existing?.feedback||""}">`,`<button class="btn secondary" onclick="saveBimesterGrade(${cid},${s.id},'${bim}')">Guardar</button>`];
  }))}</table></div>`;
}

function saveBimesterGrade(cid,sid,bim){
  let key=`${cid}_${sid}_${bim}`;
  let scoreEl=document.getElementById("bimScore_"+key);
  let feedEl=document.getElementById("bimFeed_"+key);
  let score=Number(scoreEl?.value);
  let feedback=feedEl?.value||"";
  if(scoreEl?.value==="" || scoreEl?.value==null || isNaN(score) || score<0 || score>20){toast("Ingresa una nota bimestral válida de 0 a 20.");return;}
  let existing=state.db.grades.find(g=>g.studentId==sid&&g.courseId==cid&&g.type==="Bimestre"&&g.bim===bim);
  if(existing){existing.score=score;existing.feedback=feedback;existing.date=today();}
  else state.db.grades.unshift({studentId:sid,courseId:cid,type:"Bimestre",name:`Nota final ${bim} Bimestre`,score,date:today(),bim,feedback});
  let stu=st(sid);
  let msg=score<11?"Nota bimestral baja. Requiere seguimiento y refuerzo.":score>=16?"Excelente resultado bimestral. Felicitaciones.":"Nota bimestral registrada.";
  addN({toRole:"estudiante",studentId:sid,title:"Nota bimestral registrada",text:`${cn(cid)} · ${bim} Bimestre: ${score}. ${msg}`,link:"notas",refType:"grade",studentId:sid,courseId:cid});
  addN({toRole:"padre",parentId:stu.parentId,title:score<11?"Alerta bimestral":"Nota bimestral registrada",text:`${stu.name} obtuvo ${score} en ${cn(cid)} · ${bim} Bimestre. ${msg}`,link:"notas",refType:"grade",studentId:sid,courseId:cid});
  save();
  scoreEl.value="";feedEl.value="";
  toast("Nota bimestral guardada.");
}
