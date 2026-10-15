function ensureInteractiveData(){
  state.db.messages = state.db.messages || [];
  state.db.timeline = state.db.timeline || [];
  state.db.assignments = state.db.assignments || [];
  state.db.submissions = state.db.submissions || [];
  state.db.grades = state.db.grades || [];
  state.db.attendance = state.db.attendance || [];

  const taskTemplates = [
    ["Práctica dirigida", "Resolver la práctica y subir evidencia en PDF, Word o imagen.", 7],
    ["Trabajo individual", "Desarrollar la actividad y adjuntar el archivo final.", 13],
    ["Proyecto corto", "Subir avance del proyecto con capturas o documento.", 20]
  ];

  state.db.courses.forEach((c,ci)=>{
    let current = state.db.assignments.filter(a=>a.courseId===c.id);
    if(current.length < 2){
      taskTemplates.slice(0, 2-current.length).forEach((tpl,idx)=>{
        let aid = Number(`${c.id}${idx+4}${String(ci).padStart(2,"0")}`);
        if(state.db.assignments.some(a=>a.id===aid)) aid = Date.now()+ci+idx;
        let dueDay = Math.min(28, tpl[2] + (c.id % 5));
        let task = {
          id: aid,
          courseId: c.id,
          title: `${tpl[0]} - ${c.name}`,
          description: tpl[1],
          due: `2026-06-${String(dueDay).padStart(2,"0")}`,
          fileName: "actividad_demo.pdf",
          fileType: "application/pdf",
          fileData: null,
          createdBy: c.teacherId
        };
        state.db.assignments.push(task);

        studentsOfCourse(c).forEach((stu,k)=>{
          let delivered = (k + c.id + idx) % 3 !== 0;
          state.db.submissions.push({
            assignmentId: aid,
            studentId: stu.id,
            status: delivered ? "Entregado" : "Pendiente",
            submittedAt: delivered ? `2026-06-${String(Math.min(28,dueDay-1+(k%3))).padStart(2,"0")}` : null,
            fileName: delivered ? `entrega_${stu.id}_${aid}.pdf` : null,
            fileType: delivered ? "application/pdf" : null,
            fileData: null,
            comment: delivered ? "Entrega subida por el estudiante." : "",
            score: null,
            feedback: ""
          });
        });
      });
    }
  });

  state.db.submissions.filter(s=>s.status==="Entregado").slice(0,80).forEach((s,i)=>{
    let a = state.db.assignments.find(x=>x.id===s.assignmentId);
    if(!a) return;
    let exists = state.db.grades.some(g=>g.studentId===s.studentId && g.courseId===a.courseId && g.type==="Tarea" && g.name===a.title);
    if(!exists){
      let score = 9 + ((s.studentId + a.courseId + i) % 11);
      s.score = score;
      s.feedback = score < 11 ? "Debe reforzar el tema y corregir la actividad." : score >= 16 ? "Muy buen trabajo, felicitaciones." : "Buen avance, seguir practicando.";
      s.status = "Calificado";
      state.db.grades.push({
        studentId: s.studentId,
        courseId: a.courseId,
        type: "Tarea",
        name: a.title,
        score,
        date: a.due,
        bim: "I",
        feedback: s.feedback
      });
    }
  });
}

function ensureSyllabusData(){
  state.db.syllabus = state.db.syllabus || [];
  state.db.courses.forEach(c=>{
    if(!state.db.syllabus.some(s=>s.courseId===c.id)){
      state.db.syllabus.push({
        id:c.id,
        courseId:c.id,
        title:`Sílabo de ${c.name}`,
        description:`Competencias, capacidades, metodología, criterios de evaluación y cronograma del curso ${c.name} para ${c.grade} ${c.section}.`,
        fileName:"silabo_demo.pdf",
        fileType:"application/pdf",
        fileData:null,
        publishedAt:"2026-06-01",
        createdBy:c.teacherId
      });
    }
  });
}

function syllabusOf(cid){
  ensureSyllabusData();
  return state.db.syllabus.find(s=>s.courseId==cid);
}

function ensureBimestersSafe(){
  state.db.bimesters = state.db.bimesters || [
    {id:"I", name:"I Bimestre", start:"2026-03-10", end:"2026-05-09", status:"Finalizado"},
    {id:"II", name:"II Bimestre", start:"2026-05-12", end:"2026-07-18", status:"Finalizado"},
    {id:"III", name:"III Bimestre", start:"2026-08-11", end:"2026-10-10", status:"Finalizado"},
    {id:"IV", name:"IV Bimestre", start:"2026-10-13", end:"2026-12-19", status:"Finalizado"}
  ];
}

function bimesterAverageForStudentSafe(sid,cid,bim){
  let g = state.db.grades.filter(x=>x.studentId==sid && x.courseId==cid && (x.bim||"I")===bim && x.type!=="Bimestre");
  if(!g.length) return "";
  return (g.reduce((a,b)=>a+Number(b.score||0),0)/g.length).toFixed(1);
}
