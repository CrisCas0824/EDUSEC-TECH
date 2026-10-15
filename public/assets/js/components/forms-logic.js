/* Capa de lógica — Formularios */
function createForm(data){
  if(!data.title || !data.title.trim()) { toast('El título es obligatorio'); return null; }
  if(!data.questions || !data.questions.length) { toast('Agrega al menos una pregunta'); return null; }
  let course = state.db.courses.find(c => c.id == data.courseId);
  if(!course) { toast('Curso no encontrado'); return null; }
  let questionCount = { multiple:0, checkbox:0, truefalse:0, dropdown:0, short:0, paragraph:0 };
  data.questions.forEach(q => {
    if(questionCount[q.type] !== undefined) questionCount[q.type]++;
    if(!q.id) q.id = 'q_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  });
  let timeLimit = parseInt(data.timeLimit) || 0;
  let form = addForm({
    teacherId: state.user.id,
    courseId: data.courseId,
    grade: course.grade,
    section: course.section,
    title: data.title.trim(),
    description: (data.description || '').trim(),
    published: data.published !== false,
    timeLimit: timeLimit < 0 ? 0 : timeLimit,
    startDate: data.startDate || '',
    startTime: data.startTime || '',
    endDate: data.endDate || '',
    endTime: data.endTime || '',
    questions: data.questions,
  });
  toast('Formulario creado');
  return form;
}

function submitFormResponse(formId, answers, sid){
  let form = getForm(formId);
  if(!form) { toast('Formulario no encontrado'); return null; }
  if(!sid) sid = state.user.id;
  let existing = getStudentFormResponse(formId, sid);
  if(existing) { toast('Ya respondiste este formulario'); return null; }
  let result = autoGrade(form, answers);
  let response = saveResponse({
    formId, studentId: sid, courseId: form.courseId, section: form.section,
    answers,
    autoCorrect: result.correct,
    autoTotal: result.total,
    hasManual: result.hasManual,
    reviewed: !result.hasManual,
    manualCorrect: 0,
    manualTotal: result.manualCount,
  });
  return response;
}

function autoGrade(form, answers){
  let correct = 0, total = 0, manualCount = 0;
  form.questions.forEach(q => {
    let a = answers.find(x => x.qId == q.id);
    if(!a) return;
    if(q.type === 'multiple' || q.type === 'dropdown'){
      total++;
      if(a.value == q.correctIndex) correct++;
    } else if(q.type === 'checkbox'){
      total++;
      let sel = (a.value || []).slice().sort();
      let corr = (q.correctIndices || []).slice().sort();
      if(JSON.stringify(sel) === JSON.stringify(corr)) correct++;
    } else if(q.type === 'truefalse'){
      total++;
      if(a.value === q.correctAnswer) correct++;
    } else {
      manualCount++;
    }
  });
  return { correct, total, hasManual: manualCount > 0, manualCount };
}

function manualGradeResponse(formId, studentId, qId, value){
  let r = state.db.formResponses.find(x => x.formId == formId && x.studentId == studentId);
  if(!r) return;
  if(!r.manualGrades) r.manualGrades = {};
  r.manualGrades[qId] = value === true || value === 'true';
  r.manualCorrect = Object.values(r.manualGrades).filter(v => v === true).length;
  r.reviewed = true;
  save();
  toast('Revisión guardada');
}

function getFormStats(formId){
  let form = getForm(formId);
  let responses = getFormResponses(formId);
  if(!form || !responses.length) return null;
  let totalStudents = responses.length;
  let questionStats = form.questions.map(q => {
    let correct = 0, total = 0;
    if(q.type === 'multiple' || q.type === 'dropdown' || q.type === 'checkbox' || q.type === 'truefalse'){
      responses.forEach(r => {
        let a = r.answers.find(x => x.qId == q.id);
        if(!a) return;
        total++;
        if(q.type === 'multiple' || q.type === 'dropdown'){
          if(a.value == q.correctIndex) correct++;
        } else if(q.type === 'checkbox'){
          let sel = (a.value || []).slice().sort();
          let corr = (q.correctIndices || []).slice().sort();
          if(JSON.stringify(sel) === JSON.stringify(corr)) correct++;
        } else if(q.type === 'truefalse'){
          if(a.value === q.correctAnswer) correct++;
        }
      });
    }
    return { qId: q.id, text: q.text, type: q.type, correct, total };
  });
  return { totalStudents, questionStats };
}
