/* ============================================
   AVAILABILITY.JS - Módulo "Hora Docente Disponible" (Versión 4.0)
   ============================================ */

function ensureAvailabilitySeedData() {
  if (!state.db) state.db = {};
  if (!state.db.teacherAvailability) {
    state.db.teacherAvailability = [
      {
        id: "avail-001",
        teacherId: "docente-1",
        teacherName: "Prof. Carlos Ruiz",
        day: "Lunes",
        startHour: "16:00",
        endHour: "17:30",
        mode: "Virtual (Google Meet / Chat)",
        status: "Libre",
        notes: "Atención abierta para consultas generales y rendimiento académico."
      },
      {
        id: "avail-002",
        teacherId: "docente-2",
        teacherName: "Prof. Elena Mendoza",
        day: "Miércoles",
        startHour: "15:30",
        endHour: "17:00",
        mode: "Presencial (Oficina de Coordinación)",
        status: "Libre",
        notes: "Orientación a padres de familia y seguimiento escolar."
      },
      {
        id: "avail-003",
        teacherId: "docente-3",
        teacherName: "Prof. Roberto Gómez",
        day: "Viernes",
        startHour: "16:00",
        endHour: "18:00",
        mode: "Virtual (Plataforma EduSec)",
        status: "Solo Cita Previa",
        notes: "Atención previa coordinación para informes y evaluaciones."
      }
    ];
  }
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  var parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  var h = parseInt(parts[0], 10);
  var m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  var hStr = h12 < 10 ? '0' + h12 : '' + h12;
  return hStr + ':' + m + ' ' + ampm;
}

function availabilityPage() {
  ensureAvailabilitySeedData();
  var role = (state.user && state.user.role) ? state.user.role : 'padre';

  if (role === 'docente') {
    renderTeacherAvailabilityManager();
  } else if (role === 'padre') {
    renderParentAvailabilityViewer();
  } else if (role === 'estudiante') {
    renderParentAvailabilityViewer();
  }
}

var editingAvailId = null;

/* ============================================
   VISTA DEL DOCENTE: Formulario con <input type="time">
   ============================================ */
function renderTeacherAvailabilityManager() {
  ensureAvailabilitySeedData();
  var myAvails = (state.db.teacherAvailability || []).filter(function(a) {
    return a.teacherId === state.user.id || (state.user.name && a.teacherName.indexOf(state.user.name.split(' ')[0]) !== -1);
  });

  var editingItem = editingAvailId ? state.db.teacherAvailability.find(function(x) { return x.id === editingAvailId; }) : null;

  // Encabezado con amplio margen superior para no chocar con la barra azul
  var html = '<div class="section-title" style="margin-top:28px; padding-top:16px;"><h2>Hora Docente Disponible</h2><p class="muted">Configura y publica tus horas de atención a los padres de familia en tiempo real.</p></div>';
  html += '<div class="page-body" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">';

  // Formulario de Agregar / Editar
  html += '<article class="card" style="padding:24px;">';
  var formTitle = editingItem ? '✏️ Editar Hora Disponible' : '+ Publicar Nueva Hora Disponible';
  var btnText = editingItem ? '💾 Guardar Cambios' : '+ Publicar Hora Disponible';
  
  html += '<h3 style="margin-top:0; color:var(--p); font-size:1.2rem; margin-bottom:16px;">' + formTitle + '</h3>';
  html += '<form id="formAddAvail" onsubmit="saveTeacherAvailability(event)" style="display:grid; gap:14px;">';

  html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">';
  html += '<label><b>Día de Atención:</b>';
  html += '<select id="availDay" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">';
  var days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  for (var i = 0; i < days.length; i++) {
    var selDay = (editingItem && editingItem.day === days[i]) ? ' selected' : '';
    html += '<option value="' + days[i] + '"' + selDay + '>' + days[i] + '</option>';
  }
  html += '</select></label>';

  html += '<label><b>Estado de Atención:</b>';
  html += '<select id="availStatus" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">';
  var stLibre = (editingItem && editingItem.status === 'Libre') ? ' selected' : '';
  var stCita = (editingItem && editingItem.status === 'Solo Cita Previa') ? ' selected' : '';
  var stOcupado = (editingItem && editingItem.status === 'Ocupado') ? ' selected' : '';
  html += '<option value="Libre"' + stLibre + '>🟢 Libre (Atención Abierta)</option>';
  html += '<option value="Solo Cita Previa"' + stCita + '>🟡 Solo Cita Previa</option>';
  html += '<option value="Ocupado"' + stOcupado + '>🔴 Ocupado / Fuera de Hora</option>';
  html += '</select></label>';
  html += '</div>';

  // INPUTS DE TIPO HORA NATIVOS (como en la tercera imagen)
  var startVal = editingItem ? (editingItem.startHour || '16:00') : '16:00';
  var endVal = editingItem ? (editingItem.endHour || '17:30') : '17:30';

  html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">';
  html += '<label><b>Hora Inicio:</b><input type="time" id="availStart" value="' + startVal + '" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem;"></label>';
  html += '<label><b>Hora Fin:</b><input type="time" id="availEnd" value="' + endVal + '" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem;"></label>';
  html += '</div>';

  html += '<label><b>Modalidad / Lugar:</b>';
  html += '<select id="availMode" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">';
  var modes = ['Virtual (Google Meet / Chat EduSec)', 'Presencial (Oficina de Coordinación)', 'Llamada Telefónica Institucional'];
  for (var m = 0; m < modes.length; m++) {
    var selMode = (editingItem && editingItem.mode === modes[m]) ? ' selected' : '';
    html += '<option value="' + modes[m] + '"' + selMode + '>' + modes[m] + '</option>';
  }
  html += '</select></label>';

  var notesVal = editingItem ? (editingItem.notes || '') : '';
  html += '<label><b>Indicaciones para los Padres:</b>';
  html += '<textarea id="availNotes" placeholder="Ej: Atenderé consultas generales sobre el avance escolar." style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; min-height:70px;">' + notesVal + '</textarea></label>';

  html += '<button type="submit" class="btn primary" style="padding:12px; font-weight:bold; width:100%; font-size:1rem; margin-top:6px;">' + btnText + '</button>';
  if (editingItem) {
    html += '<button type="button" onclick="cancelEditTeacherAvailability()" class="btn secondary" style="width:100%; margin-top:8px;">Cancelar Edición</button>';
  }
  html += '</form></article>';

  // Lista de horas agregadas por el docente
  html += '<article class="card" style="padding:24px;">';
  html += '<h3 style="margin-top:0; color:var(--p); font-size:1.2rem; margin-bottom:16px;">Mis Horas Disponibles Publicadas</h3>';
  if (myAvails.length === 0) {
    html += '<p class="muted" style="text-align:center; padding:30px;">Aún no has registrado ninguna hora disponible. Utiliza el formulario de la izquierda para publicar tu horario de atención a padres.</p>';
  } else {
    html += '<div style="display:grid; gap:12px;">';
    for (var k = 0; k < myAvails.length; k++) {
      var a = myAvails[k];
      var badgeBg = a.status === 'Libre' ? '#dcfce7' : (a.status === 'Solo Cita Previa' ? '#fef9c3' : '#fee2e2');
      var badgeColor = a.status === 'Libre' ? '#166534' : (a.status === 'Solo Cita Previa' ? '#854d0e' : '#991b1b');
      var formattedRange = formatTimeDisplay(a.startHour) + ' - ' + formatTimeDisplay(a.endHour);
      
      html += '<div style="padding:16px; border:1.5px solid #e2e8f0; border-radius:12px; background:#fafafa; display:flex; justify-content:space-between; align-items:center;">';
      html += '<div>';
      html += '<div style="font-weight:bold; font-size:1.05rem; color:#0f172a;">📅 ' + a.day + ' (' + formattedRange + ')</div>';
      html += '<div style="font-size:0.85rem; color:#64748b; margin-top:4px;">📍 ' + a.mode + '</div>';
      if (a.notes) html += '<div style="font-size:0.85rem; color:#334155; margin-top:4px; font-style:italic;">"' + a.notes + '"</div>';
      html += '<span style="display:inline-block; margin-top:8px; padding:4px 10px; border-radius:20px; font-size:0.78rem; font-weight:bold; background:' + badgeBg + '; color:' + badgeColor + ';">' + a.status + '</span>';
      html += '</div>';

      html += '<div style="display:flex; gap:8px;">';
      html += '<button onclick="startEditTeacherAvailability(' + JSON.stringify(a.id) + ')" class="btn primary" style="padding:6px 12px; font-size:0.85rem;">Editar</button>';
      html += '<button onclick="deleteTeacherAvailability(' + JSON.stringify(a.id) + ')" class="btn secondary" style="color:#ef4444; border-color:#fca5a5; padding:6px 12px; font-size:0.85rem;">Eliminar</button>';
      html += '</div>';

      html += '</div>';
    }
    html += '</div>';
  }
  html += '</article></div>';

  var container = document.getElementById('content') || document.querySelector('main') || document.body;
  container.innerHTML = html;
}

function startEditTeacherAvailability(id) {
  editingAvailId = id;
  renderTeacherAvailabilityManager();
}

function cancelEditTeacherAvailability() {
  editingAvailId = null;
  renderTeacherAvailabilityManager();
}

function saveTeacherAvailability(e) {
  e.preventDefault();
  ensureAvailabilitySeedData();

  if (editingAvailId) {
    var item = state.db.teacherAvailability.find(function(x) { return x.id === editingAvailId; });
    if (item) {
      item.day = document.getElementById('availDay').value;
      item.startHour = document.getElementById('availStart').value;
      item.endHour = document.getElementById('availEnd').value;
      item.mode = document.getElementById('availMode').value;
      item.status = document.getElementById('availStatus').value;
      item.notes = document.getElementById('availNotes').value.trim();
    }
    editingAvailId = null;
    if (typeof toast === 'function') toast('¡Hora disponible actualizada con éxito!');
  } else {
    var newAvail = {
      id: "avail-" + Date.now(),
      teacherId: (state.user && state.user.id) ? state.user.id : "docente-1",
      teacherName: (state.user && state.user.name) ? state.user.name : "Prof. Carlos Ruiz",
      day: document.getElementById('availDay').value,
      startHour: document.getElementById('availStart').value,
      endHour: document.getElementById('availEnd').value,
      mode: document.getElementById('availMode').value,
      status: document.getElementById('availStatus').value,
      notes: document.getElementById('availNotes').value.trim()
    };
    state.db.teacherAvailability.push(newAvail);
    if (typeof toast === 'function') toast('¡Hora disponible publicada con éxito!');
  }

  renderTeacherAvailabilityManager();
}

function deleteTeacherAvailability(id) {
  ensureAvailabilitySeedData();
  state.db.teacherAvailability = state.db.teacherAvailability.filter(function(a) { return a.id !== id; });
  if (editingAvailId === id) editingAvailId = null;
  if (typeof toast === 'function') toast('Hora disponible eliminada.');
  renderTeacherAvailabilityManager();
}

/* ============================================
   VISTA DEL PADRE: Consultar Horas de Profesores
   ============================================ */
function renderParentAvailabilityViewer() {
  ensureAvailabilitySeedData();
  
  // Encabezado con amplio margen superior para no chocar con la barra azul
  var html = '<div class="section-title" style="margin-top:28px; padding-top:16px;"><h2>Hora Docente Disponible</h2><p class="muted">Consulta las ventanas de atención y disponibilidad en tiempo real de los profesores de tus hijos.</p></div>';

  html += '<div class="page-body">';
  var avails = state.db.teacherAvailability || [];

  if (avails.length === 0) {
    html += '<article class="card" style="padding:40px; text-align:center;"><p class="muted">No hay horas docentes disponibles registradas por el momento.</p></article>';
  } else {
    html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">';
    for (var j = 0; j < avails.length; j++) {
      var a = avails[j];
      var badgeBg = a.status === 'Libre' ? '#dcfce7' : (a.status === 'Solo Cita Previa' ? '#fef9c3' : '#fee2e2');
      var badgeColor = a.status === 'Libre' ? '#166534' : (a.status === 'Solo Cita Previa' ? '#854d0e' : '#991b1b');
      var icon = a.status === 'Libre' ? '🟢' : (a.status === 'Solo Cita Previa' ? '🟡' : '🔴');
      var formattedRange = formatTimeDisplay(a.startHour) + ' - ' + formatTimeDisplay(a.endHour);

      html += '<article class="card" style="padding:20px; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between;">';
      html += '<div>';
      html += '<div style="display:flex; justify-content:space-between; align-items:flex-start;">';
      html += '<div><h3 style="margin:0; font-size:1.15rem; color:#0f172a;">' + a.teacherName + '</h3>';
      if (a.courseName) html += '<span style="font-size:0.88rem; font-weight:bold; color:var(--p);">' + a.courseName + '</span>';
      html += '</div>';
      html += '<span style="padding:5px 12px; border-radius:20px; font-size:0.8rem; font-weight:bold; background:' + badgeBg + '; color:' + badgeColor + ';">' + icon + ' ' + a.status + '</span>';
      html += '</div>';

      html += '<div style="margin-top:16px; padding:12px; background:#f8fafc; border-radius:8px;">';
      html += '<div style="font-weight:bold; font-size:0.95rem; color:#1e293b;">📅 ' + a.day + ' &bull; ' + formattedRange + '</div>';
      html += '<div style="font-size:0.85rem; color:#64748b; margin-top:4px;">📍 ' + a.mode + '</div>';
      if (a.notes) html += '<div style="font-size:0.85rem; color:#334155; margin-top:6px; font-style:italic;">"' + a.notes + '"</div>';
      html += '</div>';
      html += '</div>';

      html += '<button onclick="openMessageWithTeacher(' + JSON.stringify(a.teacherId) + ')" class="btn primary" style="width:100%; margin-top:16px; font-weight:bold;">Contactar en Hora Disponible</button>';
      html += '</article>';
    }
    html += '</div>';
  }

  html += '</div>';
  var container = document.getElementById('content') || document.querySelector('main') || document.body;
  container.innerHTML = html;
}

function openMessageWithTeacher(teacherId) {
  if (typeof openPage === 'function') {
    openPage('mensajes');
  }
}
