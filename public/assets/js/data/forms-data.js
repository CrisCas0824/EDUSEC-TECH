/* Capa de datos — Formularios */
(function(){
  if(!state.db) state.db = {};
  if(!state.db.forms) state.db.forms = [];
  if(!state.db.formResponses) state.db.formResponses = [];

  /* Monkey-patch load() para re-inicializar forms tras ser pisado por demoDB/JSON */
  var origLoad = window.load || function(){};
  window.load = function(){
    origLoad();
    if(!state.db) state.db = {};
    state.db.forms = state.db.forms || [];
    state.db.formResponses = state.db.formResponses || [];
    seedDemoForm();
  };
})();

function seedDemoForm(){
  if(!state.db.forms || state.db.forms.length) return;
  let demoCourse = state.db.courses?.find(c => c.name === 'Matemática' && c.grade === '1RO' && c.section === 'A');
  if(!demoCourse) return;
  state.db.forms.push({
    id: 'f_demo_1', teacherId: 1, courseId: demoCourse.id,
    grade: '1RO', section: 'A',
    title: 'Práctica: Ecuaciones básicas',
    description: 'Repaso de ecuaciones lineales simples para el examen del viernes.',
    createdAt: '2026-06-20', published: true, timeLimit: 15,
    startDate: '2026-06-20', startTime: '08:00', endDate: '2026-12-31', endTime: '23:59',
    questions: [
      { id: 'q_d1', type: 'multiple', text: '¿Cuál es el valor de x en 2x + 5 = 15?', options: ['5', '7', '10', '3'], correctIndex: 0 },
      { id: 'q_d2', type: 'truefalse', text: 'Una ecuación lineal siempre tiene una sola solución.', correctAnswer: false },
      { id: 'q_d3', type: 'short', text: 'Explica con tus palabras qué es una variable.' },
      { id: 'q_d4', type: 'checkbox', text: '¿Cuáles de los siguientes son números pares?', options: ['2', '3', '4', '7'], correctIndices: [0, 2] },
      { id: 'q_d5', type: 'dropdown', text: '¿Qué operación se usa para despejar x en x + 3 = 10?', options: ['Sumar 3', 'Restar 3', 'Multiplicar por 3', 'Dividir entre 3'], correctIndex: 1 },
    ]
  });
}

function addForm(f){
  if(!f.id) f.id = 'f_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  f.createdAt = f.createdAt || today();
  state.db.forms.push(f);
  save();
  return f;
}

function getCourseForms(cid){
  return state.db.forms.filter(f => f.courseId == cid)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getForm(id){
  return state.db.forms.find(f => f.id == id);
}

function deleteForm(id){
  state.db.forms = state.db.forms.filter(f => f.id != id);
  state.db.formResponses = state.db.formResponses.filter(r => r.formId != id);
  save();
}

function saveResponse(r){
  if(!r.id) r.id = 'r_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  r.submittedAt = r.submittedAt || today();
  let existing = state.db.formResponses.find(x => x.formId == r.formId && x.studentId == r.studentId);
  if(existing) Object.assign(existing, r);
  else state.db.formResponses.push(r);
  save();
  return r;
}

function getFormResponses(formId){
  return state.db.formResponses.filter(r => r.formId == formId);
}

function getStudentFormResponses(sid){
  return state.db.formResponses.filter(r => r.studentId == sid);
}

function getAvailableForms(sid){
  let courses = studentCourses(sid);
  let courseIds = courses.map(c => c.id);
  let now = new Date();
  return state.db.forms.filter(f => {
    if(!courseIds.includes(f.courseId)) return false;
    if(f.published === false) return false;
    if(f.startDate || f.endDate){
      let startOk = true, endOk = true;
      if(f.startDate){
        let sd = new Date(f.startDate+'T'+(f.startTime||'00:00'));
        startOk = now >= sd;
      }
      if(f.endDate){
        let ed = new Date(f.endDate+'T'+(f.endTime||'23:59'));
        endOk = now <= ed;
      }
      return startOk && endOk;
    }
    return true;
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getStudentFormResponse(formId, sid){
  return state.db.formResponses.find(r => r.formId == formId && r.studentId == sid);
}
