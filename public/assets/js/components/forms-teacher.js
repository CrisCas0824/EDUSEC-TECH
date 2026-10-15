/* Capa UI · Formularios del docente */
function teacherFormsPage(cid){
  let c = state.db.courses.find(x => x.id == cid);
  if(!c) return;
  let forms = getCourseForms(cid);
  let html = `<section class="section-title"><div><h2>Formularios</h2><p>${c.name} · ${c.grade} ${c.section}</p></div><div class="hdr-actions"><button class="btn secondary" onclick="teacherCourseDetail(${cid})">Volver</button><button class="btn primary" onclick="teacherCreateForm(${cid})"> Nuevo formulario</button></div></section><div class="page-body"><article class="card">`;
  if(!forms.length){
    html += `<div class="alert info"><b>Sin formularios</b><span>Aún no has creado formularios para este curso.</span></div>`;
  } else {
    html += `<div class="scroll-y">`;
    forms.forEach(f => {
      let respCount = getFormResponses(f.id).length;
      let qCount = f.questions.length;
      html += `<div class="task clean-task" style="border-left:4px solid var(--p)"><div class="stack"><b>${f.title}</b><span class="muted">${qCount} preguntas · ${respCount} respuestas ·  ${f.createdAt}</span></div><div class="actions"><button class="btn secondary" onclick="teacherFormResponses('${f.id}')">Ver respuestas</button><button class="btn secondary" onclick="teacherEditForm('${f.id}')">Editar</button><button class="btn secondary" style="color:var(--r)" onclick="if(confirm('·Eliminar formulario?')){deleteForm('${f.id}');teacherFormsPage(${cid})}"></button></div></div>`;
    });
    html += `</div>`;
  }
  html += `</article></div>`;
  content.innerHTML = html;
}

function teacherCreateForm(cid){
  let c = state.db.courses.find(x => x.id == cid);
  if(!c) return;
  let todayVal = today();
  let html = `<section class="section-title"><div><h2>Nuevo formulario</h2><p>${c.name} &middot; ${c.grade} ${c.section}</p></div></section><div class="page-body" id="formEditor"><article class="card"><div class="form"><label class="full"><b>Titulo</b><input id="formTitle" placeholder="Ej: Practica pre-examen" autofocus></label><label class="full"><b>Descripcion</b><textarea id="formDesc" placeholder="Instrucciones para los alumnos" rows="2"></textarea></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label>Apertura (fecha)<input id="formStartDate" type="date" value="${todayVal}"></label><label>Apertura (hora)<input id="formStartTime" type="time" value="08:00"></label><label>Cierre (fecha)<input id="formEndDate" type="date" value="${todayVal}"></label><label>Cierre (hora)<input id="formEndTime" type="time" value="23:59"></label></div><label class="full"><b>Tiempo limite</b><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:6px"><div style="display:flex;align-items:center;gap:6px"><input id="formTimeHours" type="number" min="0" max="24" value="0" style="width:70px" class="search-input" disabled> <span class="muted">horas</span></div><div style="display:flex;align-items:center;gap:6px"><input id="formTimeMins" type="number" min="0" max="59" value="20" style="width:70px" class="search-input" disabled> <span class="muted">minutos</span></div><label style="display:flex;align-items:center;gap:6px;font-size:.85rem;cursor:pointer;margin-left:12px"><input type="checkbox" id="formNoLimit" checked onchange="let dis=this.checked;document.getElementById('formTimeHours').disabled=dis;document.getElementById('formTimeMins').disabled=dis;"><span>Sin limite</span></label></div></label></div></article><div id="formQuestions"></div><article class="card"><button class="btn secondary" onclick="addFormQuestion()"> Agregar pregunta</button></article><article class="card" style="display:flex;gap:10px;justify-content:flex-end;align-items:center"><button class="btn secondary sm" onclick="teacherCourseDetail(${cid})">Cancelar</button><button class="btn secondary sm" onclick="teacherPreviewForm()">Vista previa</button><button class="btn primary sm" onclick="teacherSaveForm(${cid})">Guardar</button></article></div>`;
  content.innerHTML = html;
  window._formCid = cid;
  window._formQuestions = [];
  addFormQuestion();
}

function toggleTimeLimitInputs(){
  let noLimit = document.getElementById('formNoLimit')?.checked;
  let h = document.getElementById('formTimeHours');
  let m = document.getElementById('formTimeMins');
  if(h) h.disabled = noLimit;
  if(m) m.disabled = noLimit;
}

function calcFormTimeLimit(){
  let noLimit = document.getElementById('formNoLimit')?.checked;
  if(noLimit) return 0;
  let h = parseInt(document.getElementById('formTimeHours')?.value) || 0;
  let m = parseInt(document.getElementById('formTimeMins')?.value) || 0;
  return (h * 60) + m;
}

function addFormQuestion(type){
  type = type || 'multiple';
  let container = document.getElementById('formQuestions');
  if(!container) return;
  let idx = window._formQuestions.length;
  let types = [['multiple','Opción múltiple'],['checkbox','Casillas'],['truefalse','Verdadero/Falso'],['dropdown','Lista'],['short','Respuesta corta'],['paragraph','Párrafo']];
  let qTypes = types.map(t => `<option value="${t[0]}" ${t[0]===type?'selected':''}>${t[1]}</option>`).join('');
  let html = `<article class="card form-question" data-qidx="${idx}"><div class="form"><label class="full" style="display:flex;gap:8px;align-items:flex-start"><b style="min-width:24px">${idx+1}.</b><input class="q-text" placeholder="Escribe la pregunta" style="flex:1"></label><label class="full" style="max-width:200px"><b>Tipo</b><select class="q-type" onchange="changeQuestionType(this)">${qTypes}</select></label></div><div class="q-options"></div><div class="form-actions" style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn secondary" style="color:var(--r);padding:4px 12px;font-size:.8rem" onclick="removeFormQuestion(this)"> Eliminar</button></div></article>`;
  container.insertAdjacentHTML('beforeend', html);
  window._formQuestions.push({ type });
  let lastCard = container.lastElementChild;
  changeQuestionType(lastCard.querySelector('.q-type'));
}

function changeQuestionType(sel){
  let card = sel.closest('.form-question');
  let idx = +card.dataset.qidx;
  let type = sel.value;
  window._formQuestions[idx] = window._formQuestions[idx] || {};
  window._formQuestions[idx].type = type;
  let optContainer = card.querySelector('.q-options');
  if(type === 'multiple' || type === 'dropdown'){
    optContainer.innerHTML = `<div class="q-opts" style="margin-left:32px"><div class="opt-row"><input type="${type==='multiple'?'radio':'radio'}" name="corr_${idx}" class="q-corr" value="0"><input class="q-opt" placeholder="Opción 1" style="flex:1;margin:2px 0"><button class="btn secondary" style="padding:2px 8px;font-size:.7rem" onclick="this.closest('.opt-row').remove()"></button></div><div class="opt-row"><input type="${type==='multiple'?'radio':'radio'}" name="corr_${idx}" class="q-corr" value="1"><input class="q-opt" placeholder="Opción 2" style="flex:1;margin:2px 0"><button class="btn secondary" style="padding:2px 8px;font-size:.7rem" onclick="this.closest('.opt-row').remove()"></button></div></div><button class="btn secondary" style="margin-left:32px;padding:4px 12px;font-size:.8rem" onclick="addOption(this, '${type}', ${idx})"> Agregar opción</button>`;
  } else if(type === 'checkbox'){
    optContainer.innerHTML = `<div class="q-opts" style="margin-left:32px"><div class="opt-row"><input type="checkbox" class="q-corr" value="0"><input class="q-opt" placeholder="Opción 1" style="flex:1;margin:2px 0"><button class="btn secondary" style="padding:2px 8px;font-size:.7rem" onclick="this.closest('.opt-row').remove()"></button></div><div class="opt-row"><input type="checkbox" class="q-corr" value="1"><input class="q-opt" placeholder="Opción 2" style="flex:1;margin:2px 0"><button class="btn secondary" style="padding:2px 8px;font-size:.7rem" onclick="this.closest('.opt-row').remove()"></button></div></div><button class="btn secondary" style="margin-left:32px;padding:4px 12px;font-size:.8rem" onclick="addOption(this, 'checkbox', ${idx})"> Agregar opción</button>`;
  } else if(type === 'truefalse'){
    optContainer.innerHTML = `<div class="q-opts" style="margin-left:32px;margin-top:8px"><label style="display:flex;align-items:center;gap:8px"><input type="radio" name="tf_${idx}" class="q-corr" value="true"> Verdadero</label><label style="display:flex;align-items:center;gap:8px"><input type="radio" name="tf_${idx}" class="q-corr" value="false"> Falso</label></div>`;
  } else {
    optContainer.innerHTML = `<div class="muted" style="margin-left:32px;font-size:.85rem">Respuesta abierta · se califica manualmente</div>`;
  }
}

function addOption(btn, type, idx){
  let opts = btn.closest('.form-question').querySelector('.q-opts');
  let optIdx = opts.children.length;
  let inputType = type === 'checkbox' ? 'checkbox' : 'radio';
  let row = document.createElement('div');
  row.className = 'opt-row';
  row.innerHTML = `<input type="${inputType}" name="${inputType==='checkbox'?'corr_cb_'+idx:'corr_'+idx}" class="q-corr" value="${optIdx}"><input class="q-opt" placeholder="Opción ${optIdx+1}" style="flex:1;margin:2px 0"><button class="btn secondary" style="padding:2px 8px;font-size:.7rem" onclick="this.closest('.opt-row').remove()"></button>`;
  opts.appendChild(row);
}

function removeFormQuestion(btn){
  let card = btn.closest('.form-question');
  let idx = +card.dataset.qidx;
  card.remove();
  window._formQuestions.splice(idx, 1);
  document.querySelectorAll('.form-question').forEach((el, i) => {
    el.dataset.qidx = i;
    let label = el.querySelector('.q-text');
    if(label) label.previousElementSibling.textContent = (i+1)+'.';
  });
}

function teacherSaveForm(cid){
  let title = document.getElementById('formTitle');
  if(!title || !title.value.trim()) { toast('Escribe un título'); title?.focus(); return; }
  let questions = [];
  let cards = document.querySelectorAll('.form-question');
  for(let card of cards){
    let text = card.querySelector('.q-text')?.value?.trim();
    if(!text) continue;
    let type = card.querySelector('.q-type')?.value;
    let q = { id: 'q_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), text, type };
    if(type === 'multiple'|| type === 'dropdown'){
      let opts = card.querySelectorAll('.q-opt');
      q.options = Array.from(opts).map(i => i.value.trim()).filter(v => v);
      let corr = card.querySelector('input[name="corr_'+card.dataset.qidx+'"]:checked');
      q.correctIndex = corr ? +corr.value : 0;
    } else if(type === 'checkbox'){
      let opts = card.querySelectorAll('.q-opt');
      q.options = Array.from(opts).map(i => i.value.trim()).filter(v => v);
      let corr = card.querySelectorAll('.q-corr:checked');
      q.correctIndices = Array.from(corr).map(c => +c.value);
    } else if(type === 'truefalse'){
      let corr = card.querySelector('input[name="tf_'+card.dataset.qidx+'"]:checked');
      q.correctAnswer = corr ? corr.value === 'true' : true;
    }
    if(q.options && q.options.length < 2 && type !== 'truefalse' && type !== 'short' && type !== 'paragraph') continue;
    questions.push(q);
  }
  if(!questions.length) { toast('Agrega al menos una pregunta válida'); return; }
  let timeLimit = calcFormTimeLimit();
  let startDate = document.getElementById('formStartDate')?.value || '';
  let startTime = document.getElementById('formStartTime')?.value || '';
  let endDate = document.getElementById('formEndDate')?.value || '';
  let endTime = document.getElementById('formEndTime')?.value || '';
  createForm({ courseId: cid, title: title.value.trim(), description: document.getElementById('formDesc')?.value || '', published: true, timeLimit, startDate, startTime, endDate, endTime, questions });
  teacherFormsPage(cid);
}

function teacherEditForm(formId){
  let form = getForm(formId);
  if(!form) return;
  let c = state.db.courses.find(x => x.id == form.courseId);
  window._formCid = form.courseId;
  window._formQuestions = [];
  window._editingFormId = formId;
  let tl = form.timeLimit || 0;
  let hasLimit = tl > 0;
  let tHours = Math.floor(tl / 60);
  let tMins = tl % 60;
  let sDate = form.startDate || '';
  let sTime = form.startTime || '08:00';
  let eDate = form.endDate || '';
  let eTime = form.endTime || '23:59';
  let html = `<section class="section-title"><div><h2>Editar formulario</h2><p>${c.name} &middot; ${c.grade} ${c.section}</p></div></section><div class="page-body" id="formEditor"><article class="card"><div class="form"><label class="full"><b>Titulo</b><input id="formTitle" value="${escapeHtml(form.title)}" autofocus></label><label class="full"><b>Descripcion</b><textarea id="formDesc" rows="2">${escapeHtml(form.description||'')}</textarea></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label>Apertura (fecha)<input id="formStartDate" type="date" value="${sDate}"></label><label>Apertura (hora)<input id="formStartTime" type="time" value="${sTime}"></label><label>Cierre (fecha)<input id="formEndDate" type="date" value="${eDate}"></label><label>Cierre (hora)<input id="formEndTime" type="time" value="${eTime}"></label></div><label class="full"><b>Tiempo limite</b><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:6px"><div style="display:flex;align-items:center;gap:6px"><input id="formTimeHours" type="number" min="0" max="24" value="${tHours}" style="width:70px" class="search-input" ${!hasLimit?'disabled':''}> <span class="muted">horas</span></div><div style="display:flex;align-items:center;gap:6px"><input id="formTimeMins" type="number" min="0" max="59" value="${tMins}" style="width:70px" class="search-input" ${!hasLimit?'disabled':''}> <span class="muted">minutos</span></div><label style="display:flex;align-items:center;gap:6px;font-size:.85rem;cursor:pointer;margin-left:12px"><input type="checkbox" id="formNoLimit" onchange="let dis=this.checked;document.getElementById('formTimeHours').disabled=dis;document.getElementById('formTimeMins').disabled=dis;" ${!hasLimit?'checked':''}><span>Sin limite</span></label></div></label></div></article><div id="formQuestions"></div><article class="card"><button class="btn secondary" onclick="addFormQuestion()"> Agregar pregunta</button></article><article class="card" style="display:flex;gap:10px;justify-content:flex-end;align-items:center"><button class="btn secondary sm" onclick="teacherCourseDetail(${form.courseId})">Cancelar</button><button class="btn secondary sm" onclick="teacherPreviewForm()">Vista previa</button><button class="btn primary sm" onclick="teacherUpdateForm()">Guardar cambios</button></article></div>`;
  content.innerHTML = html;
  form.questions.forEach(q => addFormQuestion(q.type));
  setTimeout(() => {
    let cards = document.querySelectorAll('.form-question');
    form.questions.forEach((q, i) => {
      let card = cards[i];
      if(!card) return;
      card.querySelector('.q-text').value = q.text;
      if(q.type === 'multiple' || q.type === 'dropdown'){
        let opts = card.querySelectorAll('.q-opt');
        (q.options || []).forEach((v, j) => { if(opts[j]) opts[j].value = v; });
        let corr = card.querySelector(`input[value="${q.correctIndex}"]`);
        if(corr) corr.checked = true;
      } else if(q.type === 'checkbox'){
        let opts = card.querySelectorAll('.q-opt');
        (q.options || []).forEach((v, j) => { if(opts[j]) opts[j].value = v; });
        (q.correctIndices || []).forEach(idx => {
          let cb = card.querySelector(`input.q-corr[value="${idx}"]`);
          if(cb) cb.checked = true;
        });
      } else if(q.type === 'truefalse'){
        let corr = card.querySelector(`input.q-corr[value="${q.correctAnswer}"]`);
        if(corr) corr.checked = true;
      }
    });
  }, 50);
}

function teacherUpdateForm(){
  let formId = window._editingFormId;
  let form = getForm(formId);
  if(!form) return;
  let title = document.getElementById('formTitle');
  if(!title || !title.value.trim()) { toast('Escribe un título'); return; }
  let questions = [];
  let cards = document.querySelectorAll('.form-question');
  for(let card of cards){
    let text = card.querySelector('.q-text')?.value?.trim();
    if(!text) continue;
    let type = card.querySelector('.q-type')?.value;
    let q = { id: 'q_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), text, type };
    if(type === 'multiple'|| type === 'dropdown'){
      let opts = card.querySelectorAll('.q-opt');
      q.options = Array.from(opts).map(i => i.value.trim()).filter(v => v);
      let corr = card.querySelector('input[name="corr_'+card.dataset.qidx+'"]:checked');
      q.correctIndex = corr ? +corr.value : 0;
    } else if(type === 'checkbox'){
      let opts = card.querySelectorAll('.q-opt');
      q.options = Array.from(opts).map(i => i.value.trim()).filter(v => v);
      let corr = card.querySelectorAll('.q-corr:checked');
      q.correctIndices = Array.from(corr).map(c => +c.value);
    } else if(type === 'truefalse'){
      let corr = card.querySelector('input[name="tf_'+card.dataset.qidx+'"]:checked');
      q.correctAnswer = corr ? corr.value === 'true' : true;
    }
    if(q.options && q.options.length < 2 && type !== 'truefalse' && type !== 'short' && type !== 'paragraph') continue;
    questions.push(q);
  }
  if(!questions.length) { toast('Agrega al menos una pregunta válida'); return; }
  form.title = title.value.trim();
  form.description = (document.getElementById('formDesc')?.value || '').trim();
  form.questions = questions;
  form.timeLimit = calcFormTimeLimit();
  form.startDate = document.getElementById('formStartDate')?.value || '';
  form.startTime = document.getElementById('formStartTime')?.value || '';
  form.endDate = document.getElementById('formEndDate')?.value || '';
  form.endTime = document.getElementById('formEndTime')?.value || '';
  save();
  toast('Formulario actualizado');
  teacherFormsPage(form.courseId);
}

function teacherFormResponses(formId){
  let form = getForm(formId);
  if(!form) return;
  let responses = getFormResponses(formId);
  let c = state.db.courses.find(x => x.id == form.courseId);
  let stats = getFormStats(formId);
  let html = `<section class="section-title"><div><h2>${form.title}</h2><p>${responses.length} respuestas</p></div><div class="hdr-actions"><button class="btn secondary" onclick="teacherFormsPage(${form.courseId})">Volver</button></div></section><div class="page-body">`;
  if(!responses.length){
    html += `<article class="card"><div class="alert info"><b>Sin respuestas</b><span>Los alumnos aún no han respondido este formulario.</span></div></article>`;
  } else {
    if(stats){
      html += `<article class="card"><h3>Resumen por pregunta</h3>`;
      stats.questionStats.forEach(qs => {
        if(qs.total > 0){
          let pct = Math.round((qs.correct/qs.total)*100);
          html += `<div style="margin:8px 0"><b>${qs.text}</b><div style="display:flex;gap:8px;align-items:center;margin:4px 0"><div style="flex:1;height:20px;background:var(--soft);border-radius:999px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--p);border-radius:999px"></div></div><span style="font-size:.85rem;min-width:60px;text-align:right">${qs.correct}/${qs.total} (${pct}%)</span></div></div>`;
        }
      });
      html += `</article>`;
    }
    html += `<article class="card"><h3>Por alumno</h3><table class="table"><tr><th>Alumno</th><th>Auto</th><th>Manual</th><th>Estado</th><th>Acción</th></tr>`;
    responses.forEach(r => {
      let s = st(r.studentId);
      let autoStr = `${r.autoCorrect||0}/${r.autoTotal||0}`;
      let manualStr = r.hasManual ? `${r.reviewed ? r.manualCorrect+'/'+r.manualTotal : ''}` : '·';
      let status = r.reviewed ? '' : (r.hasManual ? ' Pendiente' : '');
      html += `<tr><td>${s?s.name:'?'}</td><td>${autoStr}</td><td>${manualStr}</td><td>${status}</td><td><button class="btn secondary" onclick="teacherStudentResponse('${formId}',${r.studentId})">Ver</button></td></tr>`;
    });
    html += `</table></article>`;
  }
  html += `</div>`;
  content.innerHTML = html;
}

function teacherStudentResponse(formId, sid){
  let form = getForm(formId);
  if(!form) return;
  let r = getStudentFormResponse(formId, sid);
  let s = st(sid);
  let html = `<section class="section-title"><div><h2>${s?s.name:'?'}</h2><p>${form.title}</p></div><div class="hdr-actions"><button class="btn secondary" onclick="teacherFormResponses('${formId}')">Volver</button></div></section><div class="page-body">`;
  let manualValues = {};
  form.questions.forEach((q, i) => {
    let a = r?.answers?.find(x => x.qId == q.id);
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
    html += `<article class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><b>${i+1}. ${q.text}</b></div><div>${icon}</div></div><div style="margin:8px 0 0 24px">`;
    if(userAnswer) html += `<div style="background:var(--soft);padding:8px 12px;border-radius:8px">${escapeHtml(userAnswer)}</div>`;
    if(q.type === 'short' || q.type === 'paragraph'){
      let isManualCorrect = r?.manualGrades?.[q.id];
      html += `<div style="margin-top:8px;display:flex;gap:12px;align-items:center"><span>Calificar:</span><label><input type="radio" name="mg_${q.id}" value="true" ${isManualCorrect===true?'checked':''} onchange="manualGradeResponse('${formId}',${sid},'${q.id}',true)"> Correcto</label><label><input type="radio" name="mg_${q.id}" value="false" ${isManualCorrect===false?'checked':''} onchange="manualGradeResponse('${formId}',${sid},'${q.id}',false)"> Incorrecto</label></div>`;
    }
    html += `</div></article>`;
  });
  html += `</div>`;
  content.innerHTML = html;
}

function teacherPreviewForm(){
  let questions = [];
  let cards = document.querySelectorAll('.form-question');
  for(let card of cards){
    let text = card.querySelector('.q-text')?.value?.trim();
    if(!text) continue;
    questions.push({ text, type: card.querySelector('.q-type')?.value });
  }
  if(!questions.length) { toast('Agrega al menos una pregunta'); return; }
  let html = `<section class="section-title"><div><h2>Vista previa</h2></div><div class="hdr-actions"><button class="btn secondary" onclick="document.getElementById('previewModal').remove()">Cerrar</button></div></section><div class="page-body">`;
  questions.forEach((q, i) => {
    html += `<article class="card"><b>${i+1}. ${q.text}</b>`;
    if(q.type === 'multiple' || q.type === 'dropdown'){
      html += `<div style="margin:8px 0 0 24px"><div class="opt-row"><input type="radio" disabled> Opción 1</div><div class="opt-row"><input type="radio" disabled> Opción 2</div></div>`;
    } else if(q.type === 'checkbox'){
      html += `<div style="margin:8px 0 0 24px"><div class="opt-row"><input type="checkbox" disabled> Opción 1</div><div class="opt-row"><input type="checkbox" disabled> Opción 2</div></div>`;
    } else if(q.type === 'truefalse'){
      html += `<div style="margin:8px 0 0 24px"><div class="opt-row"><input type="radio" disabled> Verdadero</div><div class="opt-row"><input type="radio" disabled> Falso</div></div>`;
    } else {
      html += `<div style="margin:8px 0 0 24px"><textarea disabled style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;resize:none;background:var(--soft)" rows="2"></textarea></div>`;
    }
    html += `</article>`;
  });
  html += `</div>`;
  openModal(html);
}
