/* Capa UI — Formularios del estudiante */
function formatTimeLimit(minutes){
  if(!minutes || minutes <= 0) return '';
  let h = Math.floor(minutes / 60);
  let m = minutes % 60;
  if(h > 0 && m > 0) return h + 'h ' + m + 'min';
  if(h > 0) return h + 'h';
  return m + ' min';
}

function studentFormsPage(){
  cleanupFormTimer();
  window._formActive = false;
  let sid = state.user.id;
  let forms = getAvailableForms(sid);
  let now = new Date();
  let allForms = (state.db.forms||[]).filter(f => {
    let courses = studentCourses(sid);
    return courses.some(c => c.id == f.courseId) && f.published !== false;
  });
  let html = `<section class="section-title"><div><h2>Practicas</h2><p>Formularios de practica</p></div></section><div class="page-body"><article class="card">`;
  if(!allForms.length){
    html += `<div class="alert info"><b>Sin practicas</b><span>No hay formularios para tus cursos.</span></div>`;
  } else {
    html += `<div class="scroll-y">`;
    allForms.forEach(f => {
      let existing = getStudentFormResponse(f.id, sid);
      let courseName = cn(f.courseId);
      let timeLabel = f.timeLimit ? ' · ' + formatTimeLimit(f.timeLimit) : '';
      let availStatus = getFormAvailabilityLabel(f, now);
      let status = '';
      if(existing){
        status = `<span class="ok">Resuelto (${existing.autoCorrect||0}/${existing.autoTotal||0})</span>`;
      } else {
        status = availStatus;
      }
      let action = '';
      if(existing){
        action = `<button class="btn secondary" onclick="studentFormResult('${f.id}')">Ver resultado</button>`;
      } else if(availStatus.includes('ok')){
        action = `<button class="btn primary" onclick="studentSolveForm('${f.id}')">Resolver</button>`;
      } else {
        action = `<button class="btn secondary" disabled style="opacity:.5">No disponible</button>`;
      }
      html += `<div class="task clean-task" style="border-left:4px solid ${existing?'var(--ok)':availStatus.includes('ok')?'var(--p)':'var(--mut)'}"><div class="stack"><b>${f.title}</b><span class="muted">${courseName} · ${f.questions.length} preguntas${timeLabel}</span>${status}</div><div class="actions">${action}</div></div>`;
    });
    html += `</div>`;
  }
  html += `</article></div>`;
  content.innerHTML = html;
}

function getFormAvailabilityLabel(f, now){
  if(!f.startDate && !f.endDate) return `<span class="bad">Sin fecha</span>`;
  if(f.startDate){
    let sd = new Date(f.startDate+'T'+(f.startTime||'00:00'));
    if(now < sd) return `<span class="warn">Abre ${f.startDate} ${f.startTime||''}</span>`;
  }
  if(f.endDate){
    let ed = new Date(f.endDate+'T'+(f.endTime||'23:59'));
    if(now > ed) return `<span class="bad">Cerrado</span>`;
  }
  return `<span class="ok">Disponible</span>`;
}

function cleanupFormTimer(){
  if(window._formTimerInterval){
    clearInterval(window._formTimerInterval);
    window._formTimerInterval = null;
  }
  if(window._quizBeforeUnload){
    window.removeEventListener('beforeunload', window._quizBeforeUnload);
    window._quizBeforeUnload = null;
  }
}

function studentSolveForm(formId){
  let form = getForm(formId);
  if(!form) return;
  let existing = getStudentFormResponse(formId, state.user.id);
  if(existing) { studentFormResult(formId); return; }
  let now = new Date();
  if(form.startDate){
    let sd = new Date(form.startDate+'T'+(form.startTime||'00:00'));
    if(now < sd){ toast('El formulario aun no esta disponible'); return; }
  }
  if(form.endDate){
    let ed = new Date(form.endDate+'T'+(form.endTime||'23:59'));
    if(now > ed){ toast('El formulario ya cerro'); return; }
  }
  window._formId = formId;
  window._formAnswers = {};
  window._formQIdx = 0;
  window._formActive = true;
  if(form.timeLimit > 0){
    window._formStart = Date.now();
    window._formTimeLimit = form.timeLimit * 60 * 1000;
    window._formAutoSubmitting = false;
  } else {
    window._formStart = null;
    window._formTimeLimit = null;
  }
  cleanupFormTimer();
  window._quizBeforeUnload = function(e){
    if(window._formActive){e.preventDefault();e.returnValue='';}
  };
  window.addEventListener('beforeunload', window._quizBeforeUnload);
  renderSolveQuestion();
}

function confirmQuizExit(){
  if(!window._formActive) return studentFormsPage();
  openModal(
    '<div style="text-align:center">' +
    '<h2 style="margin-bottom:12px">Salir del cuestionario</h2>' +
    '<p style="color:var(--mut);margin-bottom:20px">Si sales, tu progreso no se guardara y el tiempo continuara corriendo. ¿Deseas salir?</p>' +
    '<div style="display:flex;gap:10px;justify-content:center">' +
    '<button class="btn secondary" onclick="modal.classList.add(\'hidden\')">Cancelar</button>' +
    '<button class="btn primary" onclick="forceExitQuiz()">Salir</button>' +
    '</div></div>'
  );
}

function forceExitQuiz(){
  cleanupFormTimer();
  window._formActive = false;
  modal.classList.add('hidden');
  studentFormsPage();
}

function renderSolveQuestion(){
  let form = getForm(window._formId);
  if(!form) return;
  let idx = window._formQIdx;
  let q = form.questions[idx];
  if(!q) return;
  let total = form.questions.length;
  let pct = Math.round(((idx+1)/total)*100);
  let navBtns = `<button class="btn secondary" onclick="solvePrevQuestion()" ${idx===0?'disabled':''}> Anterior</button> <button class="btn ${idx===total-1?'primary':'secondary'}" onclick="${idx===total-1?'confirmSubmitForm()':'solveNextQuestion()'}">${idx===total-1?' Entregar':'Siguiente '}</button>`;
  let answerHtml = renderSolveQuestionContent(q);
  let timerHtml = '';
  if(window._formTimeLimit){
    let remaining = window._formTimeLimit - (Date.now() - window._formStart);
    if(remaining < 0) remaining = 0;
    let mins = Math.floor(remaining / 60000);
    let secs = Math.floor((remaining % 60000) / 1000);
    let warnStyle = remaining <= 60000 ? 'color:var(--r)' : '';
    timerHtml = `<div id="formTimer" style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:8px;${warnStyle}"> ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>`;
  }
  let timeBadge = form.timeLimit ? `<span class="badge">${formatTimeLimit(form.timeLimit)}</span>` : '';
  let html = `<section class="section-title"><div><h2>${form.title} ${timeBadge}</h2><p>${cn(form.courseId)}</p></div><div class="hdr-actions"><button class="btn secondary" onclick="confirmQuizExit()">Salir</button></div></section><div class="page-body" style="max-width:700px;margin:0 auto">${timerHtml}<div style="height:6px;background:var(--soft);border-radius:999px;overflow:hidden;margin-bottom:16px"><div style="height:100%;width:${pct}%;background:var(--p);border-radius:999px;transition:width .3s"></div></div><div style="text-align:center;margin-bottom:16px;font-size:.85rem;color:var(--mut)">Pregunta ${idx+1} de ${total}</div><article class="card"><h3 style="margin-bottom:16px">${idx+1}. ${q.text}</h3>${answerHtml}</article><div style="display:flex;justify-content:space-between;margin-top:16px">${navBtns}</div></div>`;
  content.innerHTML = html;
  if(window._formTimeLimit && !window._formTimerInterval){
    window._formTimerInterval = setInterval(updateFormTimer, 1000);
  }
}

function updateFormTimer(){
  let el = document.getElementById('formTimer');
  if(!el){
    if(window._formActive) autoSubmitForm();
    return;
  }
  let remaining = window._formTimeLimit - (Date.now() - window._formStart);
  if(remaining <= 0){
    el.textContent = '00:00';
    autoSubmitForm();
    return;
  }
  let mins = Math.floor(remaining / 60000);
  let secs = Math.floor((remaining % 60000) / 1000);
  el.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  if(remaining <= 60000) el.style.color = 'var(--r)';
}

function autoSubmitForm(){
  if(window._formAutoSubmitting) return;
  window._formAutoSubmitting = true;
  cleanupFormTimer();
  window._formActive = false;
  toast('Tiempo agotado. Cuestionario enviado automaticamente.');
  submitFormAnswers(true);
}

function confirmSubmitForm(){
  openModal(
    '<div style="text-align:center">' +
    '<h2 style="margin-bottom:12px">Entregar cuestionario</h2>' +
    '<p style="color:var(--mut);margin-bottom:20px">¿Estas seguro de entregar? No podras modificar tus respuestas despues.</p>' +
    '<div style="display:flex;gap:10px;justify-content:center">' +
    '<button class="btn secondary" onclick="modal.classList.add(\'hidden\')">Cancelar</button>' +
    '<button class="btn primary" onclick="modal.classList.add(\'hidden\');submitFormAnswers(false)">Entregar</button>' +
    '</div></div>'
  );
}

function renderSolveQuestionContent(q){
  let saved = window._formAnswers[q.id];
  if(q.type === 'multiple' || q.type === 'dropdown'){
    return `<div class="q-opts">${(q.options||[]).map((opt, i) =>
      `<label class="opt-row" style="cursor:pointer;padding:8px;border-radius:8px;border:1px solid var(--line);margin:4px 0;display:flex;align-items:center;gap:8px"><input type="radio" name="q_${q.id}" value="${i}" ${saved==i?'checked':''} onchange="window._formAnswers['${q.id}']=${i}"><span>${escapeHtml(opt)}</span></label>`
    ).join('')}</div>`;
  } else if(q.type === 'checkbox'){
    let savedArr = saved || [];
    return `<div class="q-opts">${(q.options||[]).map((opt, i) =>
      `<label class="opt-row" style="cursor:pointer;padding:8px;border-radius:8px;border:1px solid var(--line);margin:4px 0;display:flex;align-items:center;gap:8px"><input type="checkbox" value="${i}" ${savedArr.includes(i)?'checked':''} onchange="toggleCheckboxAnswer('${q.id}',${i},this.checked)"><span>${escapeHtml(opt)}</span></label>`
    ).join('')}</div>`;
  } else if(q.type === 'truefalse'){
    return `<div class="q-opts"><label class="opt-row" style="cursor:pointer;padding:8px;border-radius:8px;border:1px solid var(--line);margin:4px 0;display:flex;align-items:center;gap:8px"><input type="radio" name="q_${q.id}" value="true" ${saved===true?'checked':''} onchange="window._formAnswers['${q.id}']=true"><span>Verdadero</span></label><label class="opt-row" style="cursor:pointer;padding:8px;border-radius:8px;border:1px solid var(--line);margin:4px 0;display:flex;align-items:center;gap:8px"><input type="radio" name="q_${q.id}" value="false" ${saved===false?'checked':''} onchange="window._formAnswers['${q.id}']=false"><span>Falso</span></label></div>`;
  } else {
    return `<textarea style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;resize:vertical;min-height:80px" placeholder="Escribe tu respuesta..." onchange="window._formAnswers['${q.id}']={text:this.value}">${saved?.text||''}</textarea>`;
  }
}

function toggleCheckboxAnswer(qId, val, checked){
  if(!window._formAnswers[qId]) window._formAnswers[qId] = [];
  if(checked) window._formAnswers[qId].push(val);
  else window._formAnswers[qId] = window._formAnswers[qId].filter(v => v !== val);
}

function solveNextQuestion(){
  if(window._formQIdx < getForm(window._formId).questions.length - 1){
    window._formQIdx++;
    renderSolveQuestion();
  }
}

function solvePrevQuestion(){
  if(window._formQIdx > 0){
    window._formQIdx--;
    renderSolveQuestion();
  }
}

function submitFormAnswers(auto){
  cleanupFormTimer();
  window._formActive = false;
  let form = getForm(window._formId);
  if(!form) return;
  let answers = form.questions.map(q => {
    let val = window._formAnswers[q.id];
    if(val === undefined || val === null) return { qId: q.id };
    if(q.type === 'multiple' || q.type === 'dropdown') return { qId: q.id, value: val };
    if(q.type === 'checkbox') return { qId: q.id, value: val };
    if(q.type === 'truefalse') return { qId: q.id, value: val };
    if(q.type === 'short' || q.type === 'paragraph') return { qId: q.id, text: val?.text || '' };
    return { qId: q.id };
  });
  let result = submitFormResponse(form.id, answers);
  if(result){
    result.startedAt = result.startedAt || new Date().toISOString();
    result.completed = true;
    save();
    studentFormResult(form.id);
  }
}

function studentFormResult(formId){
  cleanupFormTimer();
  let form = getForm(formId);
  let r = getStudentFormResponse(formId, state.user.id);
  if(!form || !r) { studentFormsPage(); return; }
  let html = `<section class="section-title"><div><h2>${form.title}</h2><p>Resultado</p></div><div class="hdr-actions"><button class="btn secondary" onclick="studentFormsPage()">Volver</button></div></section><div class="page-body" style="max-width:700px;margin:0 auto">`;
  let autoScore = r.hasManual ? `${r.autoCorrect||0}/${r.autoTotal||0} automáticas` : `${r.autoCorrect||0}/${r.autoTotal||0}`;
  html += `<article class="card" style="text-align:center;padding:24px"><div style="font-size:2.5rem;font-weight:700;color:${r.autoCorrect==r.autoTotal?'var(--ok)':'var(--warn)'}">${r.autoCorrect||0}/${r.autoTotal||0}</div><div style="color:var(--mut)">${autoScore}</div>`;
  if(r.hasManual) html += `<div style="margin-top:8px;color:var(--mut)">${r.reviewed ? `Manual: ${r.manualCorrect||0}/${r.manualTotal||0}` : 'Respuestas abiertas pendientes de revisión'}</div>`;
  html += `</article>`;
  form.questions.forEach((q, i) => {
    let a = r.answers?.find(x => x.qId == q.id);
    let userAnswer = '';
    let isCorrect = null;
    if(q.type === 'multiple' || q.type === 'dropdown'){
      let val = a?.value;
      userAnswer = q.options[val] || 'Sin respuesta';
      isCorrect = val == q.correctIndex;
    } else if(q.type === 'checkbox'){
      let val = a?.value || [];
      userAnswer = val.map(v => q.options[v]).filter(Boolean).join(', ') || 'Sin respuesta';
      isCorrect = JSON.stringify(val.slice().sort()) === JSON.stringify((q.correctIndices||[]).slice().sort());
    } else if(q.type === 'truefalse'){
      userAnswer = a?.value === true ? 'Verdadero' : (a?.value === false ? 'Falso' : 'Sin respuesta');
      isCorrect = a?.value === q.correctAnswer;
    } else {
      userAnswer = a?.text || 'Sin respuesta';
    }
    let icon = isCorrect === true ? '' : (isCorrect === false ? '' : '');
    let correctAnswer = '';
    if(isCorrect === false){
      if(q.type === 'multiple' || q.type === 'dropdown') correctAnswer = `<span style="color:var(--ok);font-size:.85rem">Respuesta correcta: ${q.options[q.correctIndex]}</span>`;
      else if(q.type === 'truefalse') correctAnswer = `<span style="color:var(--ok);font-size:.85rem">Respuesta correcta: ${q.correctAnswer?'Verdadero':'Falso'}</span>`;
    }
    html += `<article class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><b>${i+1}. ${q.text}</b></div><div>${icon}</div></div><div style="margin:8px 0 0 24px"><div style="background:var(--soft);padding:8px 12px;border-radius:8px">${escapeHtml(userAnswer)}</div>${correctAnswer}</div></article>`;
  });
  html += `</div>`;
  content.innerHTML = html;
}
