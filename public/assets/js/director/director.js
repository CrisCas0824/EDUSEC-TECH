/* ===== DIRECTOR MODULE ===== */

function showManagementDashboard(){
  if (typeof openPage === 'function'){
    openPage('gestion');
  } else {
    gestionPage();
  }
}
window.showManagementDashboard = showManagementDashboard;

function dashDirector(){
  let t=state.db.teachers.length, st=state.db.students.length, p=state.db.parents.length, co=state.db.courses.length;
  let allGrades=state.db.grades||[];
  let instAvg=allGrades.length?Math.round(allGrades.reduce((a,b)=>a+b.score,0)/allGrades.length):0;
  let alerts=allGrades.filter(g=>g.score<11).length;
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="section-title"><h2 class="director-section-title">Panel directivo</h2></div>
      <div class="page-body">
        <section class="kpi-row">
          ${kpi('Docentes',t,'','')}
          ${kpi('Alumnos',st,'','')}
          ${kpi('Padres',p,'','')}
          ${kpi('Cursos',co,'','')}
        </section>
        <section class="chart-row">
          <article class="card"><h3>Promedio institucional</h3><div class="scroll-content"><div class="val-lg">${instAvg}/20</div>${prog(instAvg*5)}</div></article>
          <article class="card"><h3>Alertas academicas</h3><div class="scroll-content"><div class="val-lg">${alerts}</div><p class="muted">Notas menores a 11</p></div></article>
        </section>
        <section class="chart-row">
          <article class="card"><h3>Rendimiento por grado</h3><div class="scroll-content">${institutionalChart()}</div></article>
          <article class="card"><h3>Acciones rapidas</h3><div class="scroll-content">
            <div class="actions-column">
              <button class="btn primary" onclick="openPage('gestion')">Gestion institucional</button>
              <button class="btn secondary" onclick="openPage('reportes')">Ver reportes</button>
              <button class="btn secondary" onclick="openPage('mensajes')">Enviar mensaje</button>
            </div>
          </div></article>
        </section>
      </div>
    </div>`;
}

/* ---- Gestion Page: All admin functions grouped ---- */
function gestionPage(){
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="section-title"><h2 class="director-section-title management-title">Gestión institucional</h2></div>
      <div class="page-body">
        <div class="auto">
          <article class="card" style="cursor:pointer" onclick="registerUserPage()">
            <h3>Registrar usuarios</h3>
            <p class="muted">Crear nuevas cuentas de docentes, alumnos o padres</p>
            <div class="mt-12"><span class="badge primary">Crear</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="manageTeachersPage()">
            <h3>Docentes</h3>
            <p class="muted">Administrar docentes registrados en la plataforma</p>
            <div class="mt-12"><span class="badge">Gestionar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="manageStudentsPage()">
            <h3>Alumnos</h3>
            <p class="muted">Ver y administrar todos los alumnos matriculados</p>
            <div class="mt-12"><span class="badge">Gestionar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="manageParentsPage()">
            <h3>Padres de familia</h3>
            <p class="muted">Administrar cuentas de padres y su vinculacion</p>
            <div class="mt-12"><span class="badge">Gestionar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="manageCoursesPage()">
            <h3>Cursos y secciones</h3>
            <p class="muted">Gestionar cursos, grados, secciones y asignaciones</p>
            <div class="mt-12"><span class="badge">Gestionar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="assignAccountsPage()">
            <h3>Asignar cuentas</h3>
            <p class="muted">Vincular cuentas de usuario con perfiles creados</p>
            <div class="mt-12"><span class="badge primary">Asignar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="schedulesPage()">
            <h3>Horarios</h3>
            <p class="muted">Configurar horarios semanales por grado y seccion</p>
            <div class="mt-12"><span class="badge">Configurar</span></div>
          </article>
          <article class="card" style="cursor:pointer" onclick="accountRecoveryPage()">
            <h3>Recuperación de cuentas</h3>
            <p class="muted">Restablecer contrasenas y activar/desactivar cuentas</p>
            <div class="mt-12"><span class="badge err">Seguridad</span></div>
          </article>
        </div>
      </div>
    </div>`;
}

function institutionalChart(){
  let gs=['1RO','2DO','3RO','4TO','5TO'];
  return verticalBars(gs.map(g=>{
    let ids=state.db.students.filter(s=>s.grade===g).map(s=>s.id);
    let gs=state.db.grades.filter(x=>ids.includes(x.studentId));
    let avg=gs.length?Math.round(gs.reduce((a,b)=>a+b.score,0)/gs.length*5):0;
    return [g,avg];
  }));
}

function buildRegisterFormHTML(role) {
  let title = role === 'docente' ? 'Registrar docente' : role === 'estudiante' ? 'Registrar alumno' : 'Registrar padre';
  let onSubmitFunc = role === 'docente' ? 'saveRegTeacher(event)' : role === 'estudiante' ? 'saveRegStudent(event)' : 'saveRegParent(event)';

  let fieldsHtml = '';
  if (role === 'docente') {
    fieldsHtml = `
      <label>Nombre completo <input id="regName" required></label>
      <label>Email <input id="regEmail" type="email" required></label>
      <label class="full">Grados y secciones por curso
      <div id="regBlocks">${renderCourseBlocksHtml([], 'regBlocks')}</div>
      ${renderCourseSelectHtml('regBlocks', [])}</label>
      <label>Contraseña <div class="password-wrap"><input id="regPass" type="password" required minlength="4"><button type="button" class="pw-toggle" onclick="togglePassword('regPass',this)" tabindex="-1"></button></div></label>
      <button class="btn primary full">Guardar docente</button>`;
  } else if (role === 'estudiante') {
    fieldsHtml = `
      <label>Nombre completo <input id="regName" required></label>
      <label>Email <input id="regEmail" type="email" required></label>
      <label>Grado <select id="regGrade">${grades.map(g => `<option>${g}</option>`).join('')}</select></label>
      <label>Sección <select id="regSection">${sections.map(s => `<option>${s}</option>`).join('')}</select></label>
      <label>Padre <select id="regParent"><option value="">Sin padre asignado</option>${state.db.parents.map(pa => `<option value="${pa.id}">${pa.name}</option>`).join('')}</select></label>
      <label>Contraseña <div class="password-wrap"><input id="regPass" type="password" required minlength="4"><button type="button" class="pw-toggle" onclick="togglePassword('regPass',this)" tabindex="-1"></button></div></label>
      <button class="btn primary full">Guardar alumno</button>`;
  } else {
    fieldsHtml = `
      <label>Nombre completo <input id="regName" required></label>
      <label>Email <input id="regEmail" type="email" required></label>
      <label>Contraseña <div class="password-wrap"><input id="regPass" type="password" required minlength="4"><button type="button" class="pw-toggle" onclick="togglePassword('regPass',this)" tabindex="-1"></button></div></label>
      <button class="btn primary full">Guardar padre</button>`;
  }

  return `
    <div class="form-card-header flex-between mb-8">
      <h3>${title}</h3>
      <button type="button" class="btn secondary" onclick="backToRoleSelection()">Cambiar rol</button>
    </div>
    <form id="regFormInner" class="form" onsubmit="${onSubmitFunc}">
      ${fieldsHtml}
    </form>`;
}

function registerUserPage(){
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div id="register-user-page">
        <div class="subview-header">
          <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
          <h2 class="subview-title register-page-title director-section-title">Registrar usuario</h2>
        </div>

        <div id="role-selection-container" class="roles-selection-grid role-cards-container roles-grid reg-grid">
          <div class="card reg-option role-card" onclick="openRegisterForm('docente')">
            <div class="reg-icon" style="font-size:2rem;margin-bottom:10px;">👨‍🏫</div>
            <h3>Docente</h3>
            <p class="muted">Registrar nuevo docente con asignación de cursos por grado y sección</p>
          </div>
          <div class="card reg-option role-card" onclick="openRegisterForm('estudiante')">
            <div class="reg-icon" style="font-size:2rem;margin-bottom:10px;">👨‍🎓</div>
            <h3>Alumno</h3>
            <p class="muted">Registrar nuevo alumno con grado, sección y padre de familia</p>
          </div>
          <div class="card reg-option role-card" onclick="openRegisterForm('padre')">
            <div class="reg-icon" style="font-size:2rem;margin-bottom:10px;">👨‍👩‍👧</div>
            <h3>Padre</h3>
            <p class="muted">Registrar nuevo padre de familia</p>
          </div>
        </div>

        <div id="form-container" class="register-card form-card-container register-user-form-wrapper" style="display: none;"></div>
      </div>
    </div>`;
}

window.openRegisterForm = function(role) {
  const rolesGrid = document.getElementById('role-selection-container');
  if (rolesGrid) {
    rolesGrid.style.setProperty('display', 'none', 'important');
  }

  const formWrapper = document.getElementById('form-container');
  if (formWrapper) {
    formWrapper.style.setProperty('display', 'block', 'important');
    formWrapper.innerHTML = buildRegisterFormHTML(role);
  }
};

window.backToRoleSelection = function() {
  const formWrapper = document.getElementById('form-container');
  if (formWrapper) {
    formWrapper.style.setProperty('display', 'none', 'important');
    formWrapper.innerHTML = '';
  }

  const rolesGrid = document.getElementById('role-selection-container');
  if (rolesGrid) {
    rolesGrid.style.setProperty('display', 'grid', 'important');
  }
};

window.switchRegTab = window.openRegisterForm;
window.showRegSelector = window.backToRoleSelection;

function saveRegTeacher(e){
  e.preventDefault();loading('Guardando...');
  let id=state.db.teachers.length+1;
  let name=regName.value.trim(), email=regEmail.value.trim().toLowerCase();
  if(checkEmailExists(email)){stopLoading();return toast('Ese email ya está registrado')}
  let assigns=collectCourseBlocks('regBlocks');
  if(!assigns.length){stopLoading();return toast('Asigna al menos un curso con grado y sección')}
  let conflict=checkAssignConflicts(0,assigns);
  if(conflict){stopLoading();return toast(conflict)}
  state.db.teachers.push({id,name,email,specialties:[...new Set(assigns.map(a=>a.courseName))],assignments:assigns});
  state.db.users.push({id,email,password:regPass.value,role:'docente',refId:id,active:true,securityAnswer:'Pérez'});
  save();stopLoading();toast('Docente registrado');openPage('docentes');
}

function saveRegStudent(e){
  e.preventDefault();loading('Guardando...');
  let id=state.db.students.length+1;
  let name=regName.value.trim(), email=regEmail.value.trim().toLowerCase();
  if(checkEmailExists(email)){stopLoading();return toast('Ese email ya está registrado')}
  let parentId=regParent.value?+regParent.value:null;
  state.db.students.push({id,name,email,parentId,grade:regGrade.value,section:regSection.value,stars:0,level:1});
  state.db.users.push({id,email,password:regPass.value,role:'estudiante',refId:id,active:true,securityAnswer:'Pérez'});
  save();stopLoading();toast('Alumno registrado');openPage('alumnos');
}

function saveRegParent(e){
  e.preventDefault();loading('Guardando...');
  let id=state.db.parents.length+1;
  let name=regName.value.trim(), email=regEmail.value.trim().toLowerCase();
  if(checkEmailExists(email)){stopLoading();return toast('Ese email ya está registrado')}
  state.db.parents.push({id,name,email});
  state.db.users.push({id,email,password:regPass.value,role:'padre',refId:id,active:true,securityAnswer:'Pérez'});
  save();stopLoading();toast('Padre registrado');openPage('padres');
}

function checkEmailExists(email,excludeId){
  return state.db.users.some(u=>u.email===email&&u.id!==excludeId);
}
function checkAssignConflicts(teacherId,assignments){
  for(let a of assignments){
    let t=state.db.teachers.find(t2=>t2.id!==teacherId&&(t2.assignments||[]).some(a2=>a2.courseName===a.courseName&&a2.grade===a.grade&&a2.section===a.section));
    if(t) return `El curso ${a.courseName} en ${a.grade} ${a.section} ya está asignado a ${t.name}`;
  }
  return null;
}
function renderCourseBlockHtml(courseName,checkedValSet,containerId){
  let grid=grades.map(g=>sections.map(s=>{let v=g+'|'+s;return`<label class="chip-option"><input type="checkbox" value="${v}" ${checkedValSet.has(v)?'checked':''}><span class="chip-label">${g} ${s}</span></label>`}).join('')).join('');
  return `<div class="course-block" data-course="${courseName}">
    <div class="course-block-header">
      <strong>${courseName}</strong>
      <button type="button" class="course-block-remove" onclick="removeCourseBlock('${containerId}','${courseName}')"> Eliminar curso</button>
    </div>
    <div class="checkbox-grid">${grid}</div>
  </div>`;
}
function renderCourseBlocksHtml(assignments,containerId){
  if(!assignments||!assignments.length)return'';
  let by={};assignments.forEach(a=>{if(!by[a.courseName])by[a.courseName]=new Set();by[a.courseName].add(a.grade+'|'+a.section)});
  return Object.keys(by).map(cn=>renderCourseBlockHtml(cn,by[cn],containerId)).join('');
}
function renderCourseSelectHtml(containerId,existingAssignments){
  let existing=new Set((existingAssignments||[]).map(a=>a.courseName));
  let av=courseNames.filter(cn=>!existing.has(cn));
  if(!av.length)return'';
  return `<div class="course-block-select-row">
    <select id="${containerId}Select" class="course-block-select">
      <option value="">— Seleccionar curso —</option>
      ${av.map(cn=>`<option value="${cn}">${cn}</option>`).join('')}
    </select>
    <button type="button" onclick="addCourseBlock('${containerId}')" class="btn secondary sm"> Agregar</button>
  </div>`;
}
function addCourseBlock(containerId){
  let sel=document.getElementById(containerId+'Select');
  if(!sel)return;
  let cn=sel.value;
  if(!cn)return toast('Selecciona un curso');
  let c=document.getElementById(containerId);
  if([...c.children].some(el=>el.dataset.course===cn))return toast('Curso ya agregado');
  c.insertAdjacentHTML('beforeend',renderCourseBlockHtml(cn,new Set(),containerId));
  let opt=sel.querySelector(`option[value="${cn}"]`);
  if(opt)opt.remove();
  sel.value='';
  if(sel.options.length<=1)sel.closest('div')?.remove();
}
function removeCourseBlock(containerId,courseName){
  let c=document.getElementById(containerId);
  let b=[...c.children].find(el=>el.dataset.course===courseName);
  if(b)b.remove();
  let sel=document.getElementById(containerId+'Select');
  if(sel){let o=document.createElement('option');o.value=courseName;o.textContent=courseName;sel.appendChild(o)}
  else{
    let existing=collectCourseBlocks(containerId);
    c.insertAdjacentHTML('afterend',renderCourseSelectHtml(containerId,existing));
  }
}
function collectCourseBlocks(containerId){
  let c=document.getElementById(containerId);if(!c)return[];
  return[...c.children].flatMap(b=>{
    let cn=b.dataset.course;
    return[...b.querySelectorAll('input[type="checkbox"]:checked')].map(cb=>{
      let p=cb.value.split('|');return{courseName:cn,grade:p[0],section:p[1]}
    });
  });
}
/* ===== GESTIÓN ===== */
function manageTeachersPage(){manageRolePage({role:'docente',arr:state.db.teachers,label2:'Especialidades',key2:'specialties',badges:true,filters:{}});}
function manageStudentsPage(){manageRolePage({role:'estudiante',arr:state.db.students,label2:'Grado',key2:'grade',filters:{grade:true,section:true}});}
function manageParentsPage(){parentsPage();}

function parentsPage(){
  let parents=state.db.parents;
  let rows=parents.map(p=>{
    let children=state.db.students.filter(s=>s.parentId===p.id);
    return `<tr>
      <td>${p.name}</td>
      <td>${p.email}</td>
      <td>${children.length}</td>
      <td><button class="btn secondary sm" onclick="parentChildrenModal(${p.id})">Ver hijos</button>
        <button class="btn secondary sm" onclick="parentDetailPage(${p.id})">Detalle</button>
        <button class="btn secondary sm" onclick="editRegUser('padre',${p.id})">Editar</button>
        <button class="btn err sm" onclick="deleteUser('padre',${p.id})">Eliminar</button>
      </td>
    </tr>`;
  }).join('');
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
          <h2 class="subview-title director-section-title" style="margin:0!important;">Padres de familia</h2>
          <button class="btn primary" onclick="openPage('registrar')">+ Nuevo</button>
        </div>
      </div>
      <div class="page-body">
        <article class="card"><div class="dir-table-wrap"><table class="table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Hijos</th><th>Acciones</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="4">Sin padres registrados</td></tr>'}</tbody>
        </table></div></article>
      </div>
    </div>`;
}

function parentChildrenModal(pid){
  let parent=state.db.parents.find(p=>p.id===pid);
  if(!parent)return;
  let children=state.db.students.filter(s=>s.parentId===pid);
  let listHtml=children.length?`<table class="table"><thead><tr><th>Nombre</th><th>Email</th><th>Grado</th><th>Sección</th></tr></thead>
    <tbody>${children.map(s=>`<tr><td>${s.name}</td><td>${s.email}</td><td>${s.grade}</td><td>${s.section}</td></tr>`).join('')}</tbody></table>`
    :'<p class="muted">Sin hijos registrados</p>';
  openModal(`<h3>Hijos de ${parent.name}</h3>
    <div>${listHtml}</div>
    <button class="btn primary full mt-12" onclick="showAddChildModal(${pid})">Agregar hijo</button>`);
}

function showAddChildModal(pid){
  openModal(`<h3>Agregar hijo</h3><form class="form" onsubmit="saveNewChild(${pid},event)">
    <label>Nombre completo <input id="childName" required></label>
    <label>Grado <select id="childGrade">${grades.map(g=>`<option>${g}</option>`).join('')}</select></label>
    <label>Sección <select id="childSection">${sections.map(s=>`<option>${s}</option>`).join('')}</select></label>
    <button class="btn primary full">Crear hijo</button>
  </form>`);
}

function saveNewChild(pid,e){
  e.preventDefault();
  loading('Guardando...');
  let id=state.db.students.length+1;
  let name=childName.value.trim();
  let grade=childGrade.value;
  let section=childSection.value;
  let base=name.toLowerCase().replace(/\s+/g,'.');
  let email=base+'.'+grade.toLowerCase()+'.'+section.toLowerCase()+'@edusec.edu';
  let counter=1;
  while(checkEmailExists(email)){
    email=base+'.'+counter+'@edusec.edu';
    counter++;
  }
  state.db.students.push({id,name,email,parentId:pid,grade,section,stars:0,level:1});
  state.db.users.push({id,email,password:'Temp1234',role:'estudiante',refId:id,active:true,securityAnswer:'Pérez'});
  save();stopLoading();toast('Hijo registrado');modal.classList.add('hidden');parentChildrenModal(pid);
}

function parentDetailPage(pid){
  let parent=state.db.parents.find(p=>p.id===pid);
  if(!parent)return;
  let children=state.db.students.filter(s=>s.parentId===pid);
  let childrenHtml=children.length?`<table class="table"><thead><tr><th>Nombre</th><th>Email</th><th>Grado</th><th>Sección</th></tr></thead>
    <tbody>${children.map(s=>`<tr><td>${s.name}</td><td>${s.email}</td><td>${s.grade}</td><td>${s.section}</td></tr>`).join('')}</tbody></table>`
    :'<p class="muted">Sin hijos registrados</p>';
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
          <h2 class="subview-title director-section-title" style="margin:0!important;">${parent.name}</h2>
          <button class="btn secondary" onclick="parentsPage()">← Volver a padres</button>
        </div>
      </div>
      <div class="page-body">
        <article class="card">
          <h3>Información del padre</h3>
          <p><b>Nombre:</b> ${parent.name}</p>
          <p><b>Email:</b> ${parent.email}</p>
        </article>
        <article class="card">
          <div class="flex-between mb-8"><h3>Hijos (${children.length})</h3>
            <button class="btn primary" onclick="showAddChildModal(${pid})">Agregar hijo</button></div>
          ${childrenHtml}
        </article>
      </div>
    </div>`;
}

function manageRolePage(opts){
  let {role,arr,label2,key2,badges,filters}=opts;
  let roleName=role==='docente'?'Docentes':role==='estudiante'?'Alumnos':'Padres';
  let filterGrade=filters?.grade?`<select class="filter-select" id="mgGrade" onchange="applyMgFilter()"><option value="">Todos</option>${grades.map(g=>`<option>${g}</option>`).join('')}</select>`:'';
  let filterSection=filters?.section?`<select class="filter-select" id="mgSection" onchange="applyMgFilter()"><option value="">Todas</option>${sections.map(s=>`<option>${s}</option>`).join('')}</select>`:'';
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
          <h2 class="subview-title director-section-title" style="margin:0!important;">${roleName}</h2>
          <button class="btn primary" onclick="openPage('registrar')">+ Nuevo</button>
        </div>
      </div>
      <div class="page-body">
        <div class="filter-bar">
          <input class="filter-input" id="mgSearch" placeholder="Buscar por nombre o email..." oninput="applyMgFilter()">
          ${filterGrade}${filterSection}
        </div>
        <article class="card"><div class="dir-table-wrap"><table id="mgTable" class="table">
          <thead><tr><th>Nombre</th><th>Email</th>${label2?`<th>${label2}</th>`:''}${role==='docente'?'<th>Grados asignados</th>':''}<th>Cuenta</th><th>Acciones</th></tr></thead>
          <tbody id="mgBody"></tbody>
        </table></div></article>
      </div>
    </div>`;
  window._mgOpts=opts;
  applyMgFilter();
}

function applyMgFilter(){
  let opts=window._mgOpts;
  if(!opts)return;
  let {role,arr,label2,key2,badges}=opts;
  let text=(document.getElementById('mgSearch')?.value||'').toLowerCase();
  let grade=document.getElementById('mgGrade')?.value||'';
  let section=document.getElementById('mgSection')?.value||'';
  let filtered=arr.filter(item=>{
    let m=item.name.toLowerCase().includes(text)||item.email.toLowerCase().includes(text);
    if(grade&&item.grade!==grade)return false;
    if(section&&item.section!==section)return false;
    return m;
  });
  let tbody=document.getElementById('mgBody');
  if(!tbody)return;
  tbody.innerHTML=filtered.map(item=>{
    let u=state.db.users.find(x=>x.role===role&&x.refId===item.id);
    let hasAccount=u?'Sí':'No';
    let active=u&&u.active?'':' (desactivada)';
    let val='';
    if(label2){
      if(badges){
        let specs=item[key2]||(item.specialty?[item.specialty]:[]);
        val='<div class="badge-wrap">'+specs.map(s=>`<span class="badge primary">${s}</span>`).join('')+'</div>';
      }else{
        val=item[key2]||'';
      }
    }
    let assignsHtml='';
    if(role==='docente'){
      let a=item.assignments||[];
      assignsHtml='<div class="badge-row">'+(a.map(x=>`<span class="badge ok">${x.courseName}: ${x.grade} ${x.section}</span>`).join('')||'<span class="badge err">Sin asignar</span>')+'</div>';
    }
    return `<tr>
      <td>${item.name}</td>
      <td>${item.email}</td>
      ${label2?`<td>${val}</td>`:''}
      ${role==='docente'?`<td><div class="badge-col">${assignsHtml}<button class="btn secondary sm mt-8" onclick="teacherAssignModal(${item.id})">Asignar grados</button></div></td>`:''}
      <td>${hasAccount}${active}</td>
      <td><div class="actions-wrap">
        <button class="btn secondary sm" onclick="editRegUser('${role}',${item.id})">Editar</button>
        ${u?`<button class="btn secondary sm" onclick="toggleUserAccount(${u.id})">${u.active?'Desactivar':'Activar'}</button>
        <button class="btn secondary sm" onclick="resetUserPass(${u.id})">Reset pass</button>`:''}
        <button class="btn err sm" onclick="deleteUser('${role}',${item.id})">Eliminar</button>
      </div></td>
    </tr>`;
  }).join('')||`<tr><td colspan="${4+(label2?1:0)+(role==='docente'?1:0)}">Sin resultados</td></tr>`;
}

function editRegUser(role,id){
  let item=role==='docente'?state.db.teachers:role==='estudiante'?state.db.students:state.db.parents;
  let obj=item.find(x=>x.id===id);
  if(!obj)return;
  openModal(`<h3>Editar ${role==='docente'?'docente':role==='estudiante'?'alumno':'padre'}</h3>
    <form id="editForm" class="form" onsubmit="saveEditUser('${role}',${id},event)">
      <label>Nombre <input id="editName" value="${obj.name}" required></label>
      <label>Email <input id="editEmail" value="${obj.email}" type="email" required></label>
      ${role==='docente'?`<label class="full">Grados y secciones por curso
      <div id="editBlocks">${renderCourseBlocksHtml(obj.assignments,'editBlocks')}</div>
      ${renderCourseSelectHtml('editBlocks',obj.assignments||[])}</label>`:''}
      ${role==='estudiante'?`<label>Grado <select id="editGrade">${grades.map(g=>`<option ${g===obj.grade?'selected':''}>${g}</option>`).join('')}</select></label>
      <label>Sección <select id="editSection">${sections.map(s=>`<option ${s===obj.section?'selected':''}>${s}</option>`).join('')}</select></label>`:''}
      <button class="btn primary full">Guardar cambios</button>
    </form>`);
}

function saveEditUser(role,id,e){
  e.preventDefault();
  let arr=role==='docente'?state.db.teachers:role==='estudiante'?state.db.students:state.db.parents;
  let obj=arr.find(x=>x.id===id);
  if(!obj)return;
  let u=state.db.users.find(x=>x.role===role&&x.refId===id);
  let email=editEmail.value.trim().toLowerCase();
  if(checkEmailExists(email,u?.id)){stopLoading();return toast('Ese email ya está registrado por otro usuario')}
  obj.name=editName.value.trim();obj.email=email;
  if(role==='docente'){
    let assigns=collectCourseBlocks('editBlocks');
    if(!assigns.length)return toast('Asigna al menos un curso con grado y sección');
    let conflict=checkAssignConflicts(id,assigns);
    if(conflict)return toast(conflict);
    obj.assignments=assigns;
    obj.specialties=[...new Set(assigns.map(a=>a.courseName))];
  }
  if(role==='estudiante'){obj.grade=editGrade.value;obj.section=editSection.value;}
  if(u) u.email=obj.email;
  save();toast('Actualizado');modal.classList.add('hidden');openPage(role==='docente'?'docentes':role==='estudiante'?'alumnos':'padres');
}

function toggleUserAccount(uid){
  let u=state.db.users.find(x=>x.id===uid);
  if(!u)return;
  u.active=!u.active;
  save();toast(u.active?'Cuenta activada':'Cuenta desactivada');
  openPage(state.user.role==='director'?(u.role==='docente'?'docentes':u.role==='estudiante'?'alumnos':'padres'):'dashboard');
}

function resetUserPass(uid){
  let u=state.db.users.find(x=>x.id===uid);
  if(!u)return;
  let temp='Temp'+String(Math.floor(1000+Math.random()*9000));
  u.password=temp;
  save();
  openModal(`<h3>Contraseña restablecida</h3><p>Nueva contraseña temporal para <b>${u.email}</b>:</p>
    <div class="pw-display">${temp}</div>
    <button class="btn primary full" onclick="copyText('${temp}')">Copiar</button>`);
}

function deleteUser(role,id){
  let arr=role==='docente'?state.db.teachers:role==='estudiante'?state.db.students:state.db.parents;
  let item=arr.find(x=>x.id===id);
  if(!item)return toast('No encontrado');
  if(state.user.refId===id&&state.user.role===role)
    return toast('No puedes eliminar tu propia cuenta');
  let msg=`¿Eliminar a ${item.name}? Esta acción no se puede deshacer.`;
  msg+=warnDependencies(role,id);
  if(!confirm(msg))return;
  let u=state.db.users.find(x=>x.role===role&&x.refId===id);
  let arrIdx=arr.indexOf(item);
  if(arrIdx>=0)arr.splice(arrIdx,1);
  if(u){let uIdx=state.db.users.indexOf(u);if(uIdx>=0)state.db.users.splice(uIdx,1);}
  cleanupDependencies(role,id);
  save();toast('Cuenta eliminada');
  openPage(role==='docente'?'docentes':role==='estudiante'?'alumnos':'padres');
}
function warnDependencies(role,id){
  if(role==='docente'){
    let cnt=(state.db.courses||[]).filter(c=>c.teacherId===id).length;
    return cnt?`\n\n[!] Tiene ${cnt} curso(s) asignado(s). Se desvincularán.`:'';
  }
  if(role==='estudiante'){
    let g=(state.db.grades||[]).filter(x=>x.studentId===id).length;
    let a=(state.db.attendance||[]).filter(x=>x.studentId===id).length;
    let s=(state.db.submissions||[]).filter(x=>x.studentId===id).length;
    let total=g+a+s;
    return total?`\n\n[!] Se eliminarán también ${total} registro(s) (${g} notas, ${a} asistencias, ${s} tareas).`:'';
  }
  if(role==='padre'){
    let cnt=(state.db.students||[]).filter(s=>s.parentId===id).length;
    return cnt?`\n\n[!] Tiene ${cnt} hijo(s) vinculados. Se eliminará la referencia.`:'';
  }
  return '';
}
function cleanupDependencies(role,id){
  if(role==='docente'){
    (state.db.courses||[]).forEach(c=>{if(c.teacherId===id)c.teacherId=null});
  }
  if(role==='estudiante'){
    let fields=['grades','attendance','submissions'];
    fields.forEach(f=>{let arr=state.db[f]||[];for(let i=arr.length-1;i>=0;i--){if(arr[i].studentId===id)arr.splice(i,1)}});
  }
  if(role==='padre'){
    (state.db.students||[]).forEach(s=>{if(s.parentId===id)s.parentId=null});
  }
}
function teacherAssignModal(tid){
  let t=state.db.teachers.find(x=>x.id===tid);
  if(!t)return;
  openModal(`<h3>Asignar grados por curso — ${t.name}</h3>
    <form onsubmit="saveTeacherAssign(${tid},event)" class="form">
      <label class="full">Grados y secciones por curso
      <div id="asgnBlocks">${renderCourseBlocksHtml(t.assignments,'asgnBlocks')}</div>
      ${renderCourseSelectHtml('asgnBlocks',t.assignments||[])}</label>
      <button class="btn primary full">Guardar</button>
    </form>`);
}
function saveTeacherAssign(tid,e){
  e.preventDefault();
  let t=state.db.teachers.find(x=>x.id===tid);
  if(!t)return;
  let assigns=collectCourseBlocks('asgnBlocks');
  let conflict=checkAssignConflicts(tid,assigns);
  if(conflict)return toast(conflict);
  t.assignments=assigns;
  t.specialties=[...new Set(assigns.map(a=>a.courseName))];
  save();toast('Asignaciones guardadas');modal.classList.add('hidden');openPage('docentes');
}
/* ===== CURSOS Y SECCIONES ===== */
function manageCoursesPage(){
  let rows=state.db.courses.map(c=>{
    let t=tn(c.teacherId);
    let count=state.db.students.filter(s=>s.grade===c.grade&&s.section===c.section).length;
    return `<tr>
      <td>${c.name}</td>
      <td>${c.grade}</td>
      <td>${c.section}</td>
      <td>${t}</td>
      <td>${count}</td>
      <td>
        <button class="btn secondary sm" onclick="assignTeacherToCourse(${c.id})">Asignar docente</button>
        <button class="btn secondary sm" onclick="viewCourseStudents(${c.id})">Ver alumnos</button>
      </td>
    </tr>`;
  }).join('');
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
          <h2 class="subview-title director-section-title" style="margin:0!important;">Cursos y secciones</h2>
          <button class="btn primary" onclick="showNewCourseModal()">+ Nuevo curso</button>
        </div>
      </div>
      <div class="page-body">
        <article class="card"><div class="dir-table-wrap"><table class="table">
          <thead><tr><th>Curso</th><th>Grado</th><th>Sección</th><th>Docente</th><th>Alumnos</th><th>Acciones</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="6">Sin cursos</td></tr>'}</tbody>
        </table></div></article>
      </div>
    </div>`;
}

function showNewCourseModal(){
  let studentChecks=state.db.students.map(s=>`<label style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)"><input type="checkbox" class="nc-student-check" value="${s.id}"><span>${s.name} (${s.grade} ${s.section})</span></label>`).join('');
  openModal(`<h3>Nuevo curso</h3><form id="newCourseForm" class="form" onsubmit="saveNewCourse(event)">
    <label>Nombre <select id="ncName">${courseNames.map(n=>`<option>${n}</option>`).join('')}</select></label>
    <label>Grado <select id="ncGrade">${grades.map(g=>`<option>${g}</option>`).join('')}</select></label>
    <label>Seccion <select id="ncSection">${sections.map(s=>`<option>${s}</option>`).join('')}</select></label>
    <label>Docente <select id="ncTeacher"><option value="">Sin asignar</option>${state.db.teachers.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <label>Hora inicio<input id="ncStart" type="time" value="08:00"></label>
      <label>Hora fin<input id="ncEnd" type="time" value="13:00"></label>
    </div>
    <div class="alert info" style="margin:8px 0"><b>Horario institucional:</b> Recreo fijo 10:00 - 10:20 AM &middot; Salida 1:00 PM (13:00).</div>
    <h4 style="margin:12px 0 4px">Alumnos a matricular</h4>
    <label style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:2px solid var(--line);font-weight:600"><input type="checkbox" id="ncSelectAll" onchange="document.querySelectorAll('.nc-student-check').forEach(c=>c.checked=this.checked)"><span>Seleccionar todos</span></label>
    <div style="max-height:200px;overflow-y:auto">${studentChecks}</div>
    <button class="btn primary full">Crear curso</button>
  </form>`);
}

function saveNewCourse(e){
  e.preventDefault();
  var name=ncName.value;
  var grade=ncGrade.value;
  var section=ncSection.value;
  var courseExists=state.db.courses.some(function(c){
    return c.name.toLowerCase()===name.toLowerCase()&&c.grade===grade&&c.section===section;
  });
  if(courseExists){
    toast('El curso '+name+' ya esta registrado para '+grade+' '+section+'.');
    return;
  }
  var id=state.db.courses.length+1;
  state.db.courses.push({id:id,name:name,grade:grade,section:section,teacherId:ncTeacher.value?+ncTeacher.value:null});
  state.db.schedules.push({courseId:id,grade:grade,section:section,start:ncStart.value,end:ncEnd.value,breakTime:'10:00',breakReturn:'10:20',exitTime:'13:00'});
  var checked=document.querySelectorAll('.nc-student-check:checked');
  var enrolled=0;
  checked.forEach(function(cb){
    var s=state.db.students.find(function(x){return x.id===+cb.value;});
    if(s){
      if(s.grade!==grade||s.section!==section){s.grade=grade;s.section=section;}
      enrolled++;
    }
  });
  save();toast('Curso creado. '+enrolled+' alumno(s) matriculado(s).');modal.classList.add('hidden');openPage('cursos');
}

function assignTeacherToCourse(cid){
  let c=state.db.courses.find(x=>x.id===cid);
  if(!c)return;
  var sch=state.db.schedules.find(function(x){return x.courseId===cid});
  openModal(`<h3>Asignar docente a ${c.name} ${c.grade} ${c.section}</h3>
    <form id="assignTeacherForm" class="form" onsubmit="saveAssignTeacher(${cid},event)">
      <label>Docente <select id="atTeacher">
        <option value="">Seleccionar</option>
        ${state.db.teachers.map(t=>`<option value="${t.id}" ${t.id===c.teacherId?'selected':''}>${t.name}</option>`).join('')}
      </select></label>
      <label>Hora de inicio<input id="atStart" type="time" value="${sch?sch.start||'08:00':'08:00'}"></label>
      <label>Hora de fin<input id="atEnd" type="time" value="${sch?sch.end||'09:00':'09:00'}"></label>
      <button class="btn primary full">Guardar</button>
    </form>`);
}

function saveAssignTeacher(cid,e){
  e.preventDefault();
  let c=state.db.courses.find(x=>x.id===cid);
  if(!c)return;
  c.teacherId=atTeacher.value?+atTeacher.value:null;
  var existingSch=state.db.schedules.find(function(x){return x.courseId===cid});
  var schData={
    courseId:cid,
    grade:c.grade,
    section:c.section,
    start:atStart.value,
    end:atEnd.value
  };
  if(existingSch){
    Object.assign(existingSch,schData);
  }else{
    state.db.schedules.push(schData);
  }
  save();toast('Docente y horario asignados');modal.classList.add('hidden');openPage('cursos');
}

function viewCourseStudents(cid){
  let c=state.db.courses.find(x=>x.id===cid);
  if(!c)return;
  let list=state.db.students.filter(s=>s.grade===c.grade&&s.section===c.section);
  openModal(`<h3>Alumnos de ${c.name} ${c.grade} ${c.section}</h3>
    <div class="dir-table-wrap"><table class="table"><thead><tr><th>#</th><th>Nombre</th><th>Email</th></tr></thead>
    <tbody>${list.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.email}</td></tr>`).join('')||'<tr><td colspan="3">Sin alumnos</td></tr>'}</tbody></table>`);
}

/* ===== ASIGNACIÓN DE CUENTAS ===== */
function assignAccountsPage(){
  let withoutAccount=(arr,role)=>{
    return arr.filter(item=>!state.db.users.some(u=>u.role===role&&u.refId===item.id));
  };
  let teachersNo=withoutAccount(state.db.teachers,'docente');
  let studentsNo=withoutAccount(state.db.students,'estudiante');
  let parentsNo=withoutAccount(state.db.parents,'padre');
  let listItems=(arr,role)=>{
    return arr.map(item=>`<div class="dir-list-item">
      <span>${item.name} (${item.email})</span>
      <button class="btn secondary sm" onclick="generateAccount('${role}',${item.id})">Generar cuenta</button>
    </div>`).join('');
  };
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <h2 class="subview-title director-section-title">Asignar cuentas</h2>
      </div>
      <div class="page-body">
        <article class="card"><h3>Docentes sin cuenta (${teachersNo.length})</h3>${teachersNo.length?listItems(teachersNo,'docente'):'<p class="muted">Todos tienen cuenta</p>'}</article>
        <article class="card"><h3>Alumnos sin cuenta (${studentsNo.length})</h3>${studentsNo.length?listItems(studentsNo,'estudiante'):'<p class="muted">Todos tienen cuenta</p>'}</article>
        <article class="card"><h3>Padres sin cuenta (${parentsNo.length})</h3>${parentsNo.length?listItems(parentsNo,'padre'):'<p class="muted">Todos tienen cuenta</p>'}
          ${(teachersNo.length+studentsNo.length+parentsNo.length)?`<button class="btn primary full" onclick="generateAllAccounts()">Generar cuentas masivas</button>`:''}</article>
      </div>
    </div>`;
}

function generateAccount(role,refId){
  let arr=role==='docente'?state.db.teachers:role==='estudiante'?state.db.students:state.db.parents;
  let item=arr.find(x=>x.id===refId);
  if(!item)return;
  let temp='Temp'+String(Math.floor(1000+Math.random()*9000));
  let maxId=Math.max(...state.db.users.map(u=>u.id),0)+1;
  state.db.users.push({id:maxId,email:item.email,password:temp,role,refId:item.id,active:true,securityAnswer:'Pérez'});
  save();
  openModal(`<h3>Cuenta generada</h3>
    <p>Usuario: <b>${item.email}</b></p>
    <p>Contraseña temporal: <b class="pw-temp">${temp}</b></p>
    <div class="actions-column mt-12"><button class="btn primary full" onclick="copyText('${temp}')">Copiar contraseña</button>
    <button class="btn secondary full" onclick="modal.classList.add('hidden');openPage('asignar')">Cerrar</button></div>`);
}

function generateAllAccounts(){
  loading('Generando cuentas...');
  let count=0;
  ['docente','estudiante','padre'].forEach(role=>{
    let arr=role==='docente'?state.db.teachers:role==='estudiante'?state.db.students:state.db.parents;
    arr.forEach(item=>{
      if(!state.db.users.some(u=>u.role===role&&u.refId===item.id)){
        let temp='Temp'+String(Math.floor(1000+Math.random()*9000));
        let maxId=Math.max(...state.db.users.map(u=>u.id),0)+1;
        state.db.users.push({id:maxId,email:item.email,password:temp,role,refId:item.id,active:true,securityAnswer:'Pérez'});
        count++;
      }
    });
  });
  save();stopLoading();toast(`Se generaron ${count} cuentas`);
  openPage('asignar');
}


/* ===== HORARIOS ===== */
function schedulesPage(){
  ensureUsersData();
  let selGrade='<select id="schGrade" onchange="renderSchedule()">'+grades.map(g=>'<option>'+g+'</option>').join('')+'</select>';
  let selSection='<select id="schSection" onchange="renderSchedule()">'+sections.map(s=>'<option>'+s+'</option>').join('')+'</select>';
  content.innerHTML='<div id="director-page" class="director-container management-wrapper director-section-container">'+
    '<div class="subview-header">'+
      '<button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;">'+
        '<h2 class="subview-title director-section-title" style="margin:0!important;">Horarios institucionales</h2>'+
        '<button class="btn secondary" onclick="reorganizeAllSchedules()">Reorganizar todos</button>'+
      '</div>'+
    '</div>'+
    '<div class="page-body">'+
      '<div class="dir-filter-bar">'+
        '<label>Grado '+selGrade+'</label>'+
        '<label>Seccion '+selSection+'</label>'+
      '</div>'+
      '<article class="card"><div id="scheduleGrid"></div></article>'+
      '<article class="card"><h3>Leyenda</h3><p class="muted">Turno manana: 08:00 - 13:00. Recreo institucional fijo: 10:00 - 10:20. Haz clic en cualquier celda para editar el curso y docente. Los conflictos de docente se resaltan en rojo.</p></article>'+
    '</div>'+
  '</div>';
  renderSchedule();
}

/* ===== RECUPERACIÓN DE CUENTAS ===== */
function accountRecoveryPage(){
  let users = state.db.users || [];
  let rows = users.map(u => {
    return `<tr>
      <td>${u.email}</td>
      <td><span class="badge ${u.role==='docente'?'primary':u.role==='estudiante'?'ok':'secondary'}">${u.role}</span></td>
      <td>${u.active ? 'Activa' : 'Desactivada'}</td>
      <td>
        <button class="btn secondary sm" onclick="toggleUserAccount(${u.id})">${u.active ? 'Desactivar' : 'Activar'}</button>
        <button class="btn primary sm" onclick="resetUserPass(${u.id})">Restablecer contraseña</button>
      </td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="subview-header">
        <button class="btn-back-to-management" onclick="showManagementDashboard()">&larr; Volver a Gestión</button>
        <h2 class="subview-title director-section-title">Recuperación de cuentas</h2>
      </div>
      <div class="page-body">
        <article class="card">
          <div class="dir-table-wrap">
            <table class="table">
              <thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="4">Sin usuarios</td></tr>'}</tbody>
            </table>
          </div>
        </article>
      </div>
    </div>`;
}

function renderSchedule(){
  var g=document.getElementById('schGrade')?.value||'1RO';
  var sec=document.getElementById('schSection')?.value||'A';
  var days=['Lun','Mar','Mie','Jue','Vie'];
  var allSlots=['08:00','09:00','10:20','11:40'];
  var tl={'08:00':'08:00 - 09:00','09:00':'09:00 - 10:00','10:20':'10:20 - 11:40','11:40':'11:40 - 13:00'};
  var grid=document.getElementById('scheduleGrid');
  if(!grid)return;
  var sch=state.db.schedules||[];
  var conflicts=detectTeacherConflicts();
  var lookup={};
  sch.forEach(function(x){
    if(x.grade===g&&x.section===sec){
      lookup[x.day+'-'+x.hour]=x;
    }
  });
  var conflictLookup={};
  conflicts.forEach(function(c){
    if(c.grade===g&&c.section===sec){
      conflictLookup[c.day+'-'+c.hour]=true;
    }
  });
  var skip={};
  var html='<table class="sch-table"><thead><tr><th>Hora</th>'+days.map(function(d){return '<th>'+d+'</th>';}).join('')+'</tr></thead><tbody>';
  for(var hi=0;hi<allSlots.length;hi++){
    var h=allSlots[hi];
    html+='<tr><td class="sch-time">'+tl[h]+'</td>';
    for(var di=0;di<days.length;di++){
      var d=days[di];
      var key=d+'-'+h;
      if(skip[key])continue;
      var entry=lookup[key];
      var isConf=conflictLookup[key];
      var merged=false;
      var nextH=allSlots[hi+1];
      if(nextH){
        var nextKey=d+'-'+nextH;
        var ne=lookup[nextKey];
        if(entry&&ne&&entry.courseId===ne.courseId){
          skip[nextKey]=true;
          merged=true;
        }
      }
      var rs=merged?' rowspan="2"':'';
      var cls=isConf?' sch-conflict':'';
      var click=' onclick="editScheduleSlot(\''+g+'\',\''+sec+'\',\''+d+'\',\''+h+'\')"';
      html+='<td class="'+cls+'"'+rs+click+'>';
      if(entry){
        var course=state.db.courses.find(function(c){return c.id===entry.courseId;});
        var name=course?course.name:'';
        var teacher='';
        if(course&&course.teacherId){
          var t=state.db.teachers.find(function(x){return x.id===course.teacherId;});
          if(t)teacher=t.name;
        }
        html+='<div class="sch-cell'+(isConf?' sch-conflict':'')+'">';
        html+='<div class="sch-course-name">'+name+'</div>';
        if(teacher){
          var tc=isConf?'color:#fff;font-weight:700':'';
          html+='<div class="sch-teacher-name"'+(tc?' style="'+tc+'"':'')+'>'+teacher+'</div>';
        }
        html+='</div>';
      }else{
        html+='<div class="sch-no-teacher"><span class="sch-no-teacher-label">Sin docente</span></div>';
      }
      html+='</td>';
    }
    html+='</tr>';
    if(h==='09:00'){
      html+='<tr class="sch-recreo"><td class="sch-time sch-recreo-time">10:00 - 10:20</td>';
      days.forEach(function(d){html+='<td class="sch-recreo-cell">RECREO INSTITUCIONAL</td>'});
      html+='</tr>';
    }
  }
  html+='<tr class="sch-salida"><td class="sch-time" style="background:var(--p);color:#fff;font-weight:700">13:00</td>';
  days.forEach(function(d){html+='<td style="background:var(--p);color:#fff;text-align:center;font-weight:700;font-size:.8rem">SALIDA</td>'});
  html+='</tr>';
  grid.innerHTML=html+'</tbody></table>';
}

function teacherSelectOptions(grade,section,cid){
  let courseName=cid?state.db.courses.find(c=>c.id===+cid)?.name:'';
  return (state.db.teachers||[]).filter(t=>{
    let asn=t.assignments||[];
    if(!courseName)return asn.some(a=>a.grade===grade&&a.section===section);
    return asn.some(a=>a.courseName===courseName&&a.grade===grade&&a.section===section);
  }).map(t=>{
    let curCourse=state.db.courses.find(c=>c.grade===grade&&c.section===section);
    let sel=(curCourse&&curCourse.teacherId===t.id)?'selected':'';
    return `<option value="${t.id}" ${sel}>${t.name}</option>`;
  }).join('');
}
function updateTeacherSelect(grade,section){
  let cid=document.getElementById('schCourse').value;
  let sel=document.getElementById('schTeacher');
  let html=teacherSelectOptions(grade,section,cid);
  sel.innerHTML='<option value="">— Sin docente —</option>'+html;
}
function editScheduleSlot(grade,section,day,hour){
  let sch=state.db.schedules||[];
  let entry=sch.find(x=>x.grade===grade&&x.section===section&&x.day===day&&x.hour===hour);
  let curCourse=state.db.courses.find(c=>c.grade===grade&&c.section===section);
  let available=state.db.courses.filter(c=>c.grade===grade&&c.section===section);
  let selCid=entry?entry.courseId:'';
  let teachersHtml=teacherSelectOptions(grade,section,selCid);
  openModal(`<h3>${day} ${hour} · ${grade} ${section}</h3>
    <form id="schForm" class="form" onsubmit="saveScheduleSlot('${grade}','${section}','${day}','${hour}',event)">
      <label>Curso <select id="schCourse" onchange="updateTeacherSelect('${grade}','${section}')">
        <option value="">— Vacío —</option>
        ${available.map(c=>`<option value="${c.id}" ${entry&&entry.courseId===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select></label>
      <label>Docente <select id="schTeacher">
        <option value="">— Sin docente —</option>
        ${teachersHtml}
      </select></label>
      <button class="btn primary full">Guardar</button>
    </form>`);
}

function saveScheduleSlot(grade,section,day,hour,e){
  e.preventDefault();
  state.db.schedules=state.db.schedules||[];
  let idx=state.db.schedules.findIndex(x=>x.grade===grade&&x.section===section&&x.day===day&&x.hour===hour);
  let cid=document.getElementById('schCourse').value;
  let tid=document.getElementById('schTeacher').value;
  if(cid&&tid){
    let conflict=state.db.schedules.find(x=>{
      if(x.grade===grade&&x.section===section&&x.day===day&&x.hour===hour)return false;
      if(x.day!==day||x.hour!==hour)return false;
      let c=state.db.courses.find(c2=>c2.id===x.courseId);
      return c&&c.teacherId===+tid;
    });
    if(conflict){
      let t=state.db.teachers.find(x2=>x2.id===+tid);
      return toast('Conflicto: '+(t?t.name:'El docente')+' ya dicta '+cn(conflict.courseId)+' en '+conflict.grade+' '+conflict.section+' '+day+' '+hour+'. Asigne otro docente.');
    }
  }
  if(idx>=0){
    if(cid)state.db.schedules[idx].courseId=+cid;
    else state.db.schedules.splice(idx,1);
  }else if(cid){
    state.db.schedules.push({grade:grade,section:section,day:day,hour:hour,courseId:+cid});
  }
  if(cid&&tid){
    let course=state.db.courses.find(c=>c.id===+cid);
    if(course)course.teacherId=+tid;
  }
  save();toast('Horario actualizado');modal.classList.add('hidden');renderSchedule();
}

function detectTeacherConflicts(){
  let sch=state.db.schedules||[];
  let conflicts=[];
  let days=['Lun','Mar','Mie','Jue','Vie'];
  let hours=['08:00','09:00','10:20','11:40'];
  days.forEach(function(d){
    hours.forEach(function(h){
      let entries=sch.filter(x=>x.day===d&&x.hour===h);
      let byTeacher={};
      entries.forEach(function(e){
        let course=state.db.courses.find(c=>c.id===e.courseId);
        if(course&&course.teacherId){
          let tid=String(course.teacherId);
          if(!byTeacher[tid])byTeacher[tid]=[];
          byTeacher[tid].push(e);
        }
      });
      Object.keys(byTeacher).forEach(function(tid){
        if(byTeacher[tid].length>1)conflicts.push.apply(conflicts,byTeacher[tid]);
      });
    });
  });
  return conflicts;
}
function reorganizeAllSchedules(){
  state.db.schedules=[];
  ensureScheduleData();
  toast('Horarios reorganizados correctamente');
  renderSchedule();
}

/* ===== RECUPERACIÓN DE CUENTAS ===== */
function accountRecoveryPage(){
  content.innerHTML=`
    <div class="section-title"><h2>Recuperación de cuentas</h2></div>
    <div class="page-body">
      <article class="card">
        <h3>Buscar usuario</h3>
        <form class="form" onsubmit="searchUserRecovery(event)">
          <label>Email <input id="recoveryEmail" type="email" required></label>
          <button class="btn primary">Buscar</button>
        </form>
        <div id="recoveryResult"></div>
      </article>
      <article class="card">
        <h3>Usuarios recientes</h3>
        <table class="table"><thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>${state.db.users.slice(-10).reverse().map(u=>{
          let name=u.role==='docente'?tn(u.refId):u.role==='estudiante'?sn(u.refId):state.db.parents.find(p=>p.id===u.refId)?.name||state.db.directors?.find(d=>d.id===u.refId)?.name||'—';
          return `<tr><td>${u.email}</td><td>${u.role}</td><td>${u.active?'<span class="badge ok">Activa</span>':'<span class="badge err">Desactivada</span>'}</td>
          <td><button class="btn secondary sm" onclick="directorResetPass(${u.id})">Reset pass</button></td></tr>`;
        }).join('')}</tbody></table>
      </article>
    </div>`;
}

function searchUserRecovery(e){
  e.preventDefault();
  let email=document.getElementById('recoveryEmail').value.trim().toLowerCase();
  let u=findUser(email);
  let r=document.getElementById('recoveryResult');
  if(!u){r.innerHTML='<p class="err">Usuario no encontrado</p>';return}
  let name=u.role==='docente'?tn(u.refId):u.role==='estudiante'?sn(u.refId):state.db.parents.find(p=>p.id===u.refId)?.name||state.db.directors?.find(d=>d.id===u.refId)?.name||'—';
  r.innerHTML=`<div class="dir-recovery-box">
    <p><b>${name}</b> · ${u.email} · ${u.role}</p>
    <p>Estado: ${u.active?'<span class="badge ok">Activa</span>':'<span class="badge err">Desactivada</span>'}</p>
    <button class="btn secondary" onclick="directorResetPass(${u.id})">Restablecer contraseña</button>
    <button class="btn secondary" onclick="toggleUserAccount(${u.id})">${u.active?'Desactivar cuenta':'Activar cuenta'}</button>
  </div>`;
}

function directorResetPass(uid){
  let u=state.db.users.find(x=>x.id===uid);
  if(!u)return;
  let temp='Temp'+String(Math.floor(1000+Math.random()*9000));
  u.password=temp;u.active=true;
  save();
  openModal(`<h3>Contraseña restablecida</h3>
    <p>Nueva contraseña para <b>${u.email}</b>:</p>
    <div class="pw-display">${temp}</div>
    <p class="muted">La cuenta ha sido reactivada.</p>
    <button class="btn primary full" onclick="copyText('${temp}')">Copiar</button>`);
}

/* ===== REPORTES INSTITUCIONALES ===== */
function directorReportsPage(){
  let gs=['1RO','2DO','3RO','4TO','5TO'];
  let gradeAvgs=gs.map(g=>{
    let ids=state.db.students.filter(s=>s.grade===g).map(s=>s.id);
    let gs=state.db.grades.filter(x=>ids.includes(x.studentId));
    let avg=gs.length?Math.round(gs.reduce((a,b)=>a+b.score,0)/gs.length*5):0;
    return [g,avg];
  });
  let allScores=state.db.grades.map(g=>g.score);
  let risk=allScores.filter(s=>s<11).length;
  let medium=allScores.filter(s=>s>=11&&s<=13).length;
  let stable=allScores.filter(s=>s>=14&&s<=15).length;
  let high=allScores.filter(s=>s>=16).length;
  let total=allScores.length||1;
  content.innerHTML=`
    <div class="section-title"><h2>Reportes institucionales</h2></div>
    <div class="page-body">
      <section class="chart-row">
        <article class="card"><h3>Rendimiento por grado</h3><div class="scroll-content">${verticalBars(gradeAvgs)}</div></article>
        <article class="card"><h3>Distribución de rendimiento</h3><div class="scroll-content">
          ${ringChart([['Riesgo (<11)',Math.round(risk/total*100)],['Medio (11-13)',Math.round(medium/total*100)],['Estable (14-15)',Math.round(stable/total*100)],['Alto (16+)',Math.round(high/total*100)]])}
        </div></article>
      </section>
      <section class="chart-row">
        <article class="card"><h3>Asistencia por grado</h3><div class="scroll-content">${ringChart(gs.map(g=>{
          let ids=state.db.students.filter(s=>s.grade===g).map(s=>s.id);
          let att=state.db.attendance.filter(x=>ids.includes(x.studentId));
          let pct=att.length?Math.round(att.filter(x=>x.status==='Presente').length/att.length*100):100;
          return [g,pct];
        }))}</div></article>
        <article class="card"><h3>Alumnos en riesgo por grado</h3><div class="scroll-content">${verticalBars(gs.map(g=>{
          let ids=state.db.students.filter(s=>s.grade===g).map(s=>s.id);
          let riskCount=state.db.grades.filter(x=>ids.includes(x.studentId)&&x.score<11).length;
          return [g,Math.min(100,Math.round(riskCount/Math.max(1,ids.length)*100))];
        }))}</div></article>
      </section>
      <div class="dir-export-bar">
        <button class="btn secondary" onclick="exportPDF('Reporte institucional')">Exportar PDF</button>
        <button class="btn secondary" onclick="exportCSV(['Grado','Rendimiento','Riesgo','Alumnos'],grades.map(g=>{let ids=state.db.students.filter(s=>s.grade===g).map(s=>s.id);let gs=state.db.grades.filter(x=>ids.includes(x.studentId));let avg=gs.length?Math.round(gs.reduce((a,b)=>a+b.score,0)/gs.length):0;let risk=gs.filter(x=>x.score<11).length;return[g,avg,risk,ids.length]}),'reporte_institucional')">Exportar Excel</button>
      </div>
    </div>`;
}

window._directorSelectedRecipients = [];
window._directorPendingUser = null;

function handleDirectorSearchInput(query){
  query = (query || '').toLowerCase().trim();
  let dropdown = document.getElementById('director-suggestions-dropdown');
  if(!dropdown) return;

  if(query.length < 1){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    window._directorPendingUser = null;
    return;
  }

  let matches = (state.db.users || []).filter(u => {
    if(state.user && String(u.id) === String(state.user.id) && u.role === state.user.role) return false;
    let name = '';
    if(u.role === 'docente'){
      let ref = (state.db.teachers || []).find(t => t.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'estudiante'){
      let ref = (state.db.students || []).find(s => s.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'padre'){
      let ref = (state.db.parents || []).find(p => p.id === u.refId);
      name = ref ? ref.name : '';
    } else if(u.role === 'director'){
      name = u.name || 'Director';
    }
    let email = u.email || '';
    return (name && name.toLowerCase().includes(query)) || (email && email.toLowerCase().includes(query));
  }).slice(0, 15);

  if(!matches.length){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    window._directorPendingUser = null;
    return;
  }

  dropdown.innerHTML = matches.map(u => {
    let name = '';
    if(u.role === 'docente'){
      let ref = (state.db.teachers || []).find(t => t.id === u.refId);
      name = ref ? ref.name : 'Docente';
    } else if(u.role === 'estudiante'){
      let ref = (state.db.students || []).find(s => s.id === u.refId);
      name = ref ? ref.name : 'Alumno';
    } else if(u.role === 'padre'){
      let ref = (state.db.parents || []).find(p => p.id === u.refId);
      name = ref ? ref.name : 'Padre';
    } else {
      name = u.name || 'Director';
    }

    let roleLabel = u.role === 'docente' ? 'Docente' : u.role === 'estudiante' ? 'Alumno' : u.role === 'padre' ? 'Padre' : 'Director';

    return `<div class="suggestion-item" onclick="selectDirectorRecipientSuggestion(${u.id}, '${name.replace(/'/g, "\\'")}', '${u.email}')">
      <div>
        <b>${name}</b> <small style="color:#64748b;margin-left:6px;">${u.email}</small>
      </div>
      <span class="user-role-tag">${roleLabel}</span>
    </div>`;
  }).join('');

  dropdown.style.display = 'block';
}
window.handleDirectorSearchInput = handleDirectorSearchInput;

function selectDirectorRecipientSuggestion(userId, userName, userEmail){
  let targetUser = (state.db.users || []).find(u => String(u.id) === String(userId));
  if(targetUser){
    if(!window._directorSelectedRecipients) window._directorSelectedRecipients = [];
    if(!window._directorSelectedRecipients.some(u => String(u.id) === String(targetUser.id))){
      window._directorSelectedRecipients.push(targetUser);
    } else {
      toast('El usuario ya ha sido agregado');
    }
  }

  let input = document.getElementById('director-user-search');
  if(input) input.value = '';

  let dropdown = document.getElementById('director-suggestions-dropdown');
  if(dropdown){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  renderDirectorSelectedChips();
}
window.selectDirectorRecipientSuggestion = selectDirectorRecipientSuggestion;

function removeDirectorSelectedRecipient(userId){
  if(!window._directorSelectedRecipients) return;
  window._directorSelectedRecipients = window._directorSelectedRecipients.filter(u => String(u.id) !== String(userId));
  renderDirectorSelectedChips();
}
window.removeDirectorSelectedRecipient = removeDirectorSelectedRecipient;

function clearAllDirectorRecipients(){
  window._directorSelectedRecipients = [];
  let selectEl = document.getElementById('dmTarget');
  if(selectEl) selectEl.value = '';
  toggleDmFilter();
  toast('Se han removido todos los destinatarios');
}
window.clearAllDirectorRecipients = clearAllDirectorRecipients;

function renderDirectorSelectedChips(){
  let container = document.getElementById('director-selected-chips');
  let cntEl = document.getElementById('dmTargetCount');
  let clearBtn = document.getElementById('btn-clear-all-director-chips');
  let list = window._directorSelectedRecipients || [];

  if(cntEl){
    cntEl.textContent = `(${list.length} destinatario(s) seleccionado(s))`;
  }

  if(clearBtn){
    if(list.length > 0){
      clearBtn.classList.remove('hidden');
      clearBtn.style.display = 'inline-flex';
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.style.display = 'none';
    }
  }

  if(!container) return;

  if(!list.length){
    container.innerHTML = '';
    return;
  }

  container.innerHTML = list.map(u => {
    let name = getUserDisplayName(u).split(' (')[0];
    return `<div class="recipient-chip-tag recipient-chip">
      <span>${name}</span>
      <span class="close-chip remove-chip-btn" onclick="removeDirectorSelectedRecipient(${u.id})">&times;</span>
    </div>`;
  }).join('');
}
window.renderDirectorSelectedChips = renderDirectorSelectedChips;

function toggleDmFilter(){
  let v = document.getElementById('dmTarget')?.value || '';
  let box = document.getElementById('dmFilterBox');
  let singleBox = document.getElementById('dmSingleUserBox');
  let cntEl = document.getElementById('dmTargetCount');

  if(box) box.classList.toggle('hidden', v !== 'filter');
  if(singleBox){
    if(v === 'single'){
      singleBox.classList.remove('hidden');
      singleBox.style.setProperty('display', 'block', 'important');
    } else {
      singleBox.classList.add('hidden');
      singleBox.style.setProperty('display', 'none', 'important');
    }
  }

  let users = state.db.users || [];
  let currentUserId = state.user ? state.user.id : null;

  if(!window._directorSelectedRecipients) window._directorSelectedRecipients = [];

  if(v === ''){
    window._directorSelectedRecipients = [];
    if(cntEl) cntEl.textContent = '(0 destinatarios)';
  } else if(v === 'all'){
    window._directorSelectedRecipients = users.filter(u => String(u.id) !== String(currentUserId));
    if(cntEl) cntEl.textContent = `(${window._directorSelectedRecipients.length} destinatarios)`;
  } else if(v === 'docentes'){
    window._directorSelectedRecipients = users.filter(u => u.role === 'docente');
    if(cntEl) cntEl.textContent = `(${window._directorSelectedRecipients.length} destinatarios)`;
  } else if(v === 'alumnos'){
    window._directorSelectedRecipients = users.filter(u => u.role === 'estudiante');
    if(cntEl) cntEl.textContent = `(${window._directorSelectedRecipients.length} destinatarios)`;
  } else if(v === 'padres'){
    window._directorSelectedRecipients = users.filter(u => u.role === 'padre');
    if(cntEl) cntEl.textContent = `(${window._directorSelectedRecipients.length} destinatarios)`;
  } else if(v === 'filter'){
    if(cntEl) cntEl.textContent = '';
    updateDmCount();
    return;
  } else if(v === 'single'){
    if(cntEl) cntEl.textContent = `(${window._directorSelectedRecipients.length} destinatarios)`;
  }

  renderDirectorSelectedChips();
}
window.toggleDmFilter = toggleDmFilter;

function getUserDisplayName(u){
  if(!u) return 'Usuario';
  let ref = null;
  if(u.role==='docente') ref = (state.db.teachers||[]).find(t=>t.id===u.refId);
  else if(u.role==='estudiante') ref = (state.db.students||[]).find(s=>s.id===u.refId);
  else if(u.role==='padre') ref = (state.db.parents||[]).find(p=>p.id===u.refId);
  else if(u.role==='director') return 'Director ' + (u.name || 'Institucional');
  
  if(ref && ref.name) return ref.name + ' (' + u.role + ') — ' + u.email;
  return (u.email || ('ID ' + u.id)) + ' (' + u.role + ')';
}

/* ===== MENSAJERÍA DEL DIRECTOR ===== */
function directorMessagesPage(){
  let totalRecipients = (state.db.users||[]).filter(u=>u.refId!==state.user.id||u.role!==state.user.role).length;
  content.innerHTML=`
    <div id="director-page" class="director-container management-wrapper director-section-container">
      <div class="section-title"><h2 class="director-section-title">Mensajes</h2></div>
      <div class="page-body">
        <div class="tabs">
          <button class="tab active" onclick="switchDmTab('compose')">Enviar mensaje</button>
          <button class="tab" onclick="switchDmTab('sent')">Enviados</button>
          <button class="tab" onclick="switchDmTab('inbox')">Bandeja de entrada</button>
        </div>
        <div id="dmCompose" class="dm-tab-content">
          <article class="card messages-form-card send-message-container" id="director-message-form">
            <h3>Enviar mensaje</h3>
            <form class="form" onsubmit="sendDirectorMessage(event)">
              <div class="recipient-selection-group full">
                <label class="full">Destinatarios
                  <select id="dmTarget" onchange="toggleDmFilter()">
                    <option value="" selected>-- Seleccionar opción de destinatarios --</option>
                    <option value="all">Todos los usuarios (${totalRecipients} destinatarios)</option>
                    <option value="docentes">Todos los docentes</option>
                    <option value="alumnos">Todos los alumnos</option>
                    <option value="padres">Todos los padres</option>
                    <option value="filter">Filtrar por grado y sección</option>
                    <option value="single">Buscar / Seleccionar usuario específico...</option>
                  </select>
                </label>

                <!-- Mini Formulario de Búsqueda Individual -->
                <div id="dmSingleUserBox" class="single-user-search-wrapper search-recipient-wrapper search-field-block hidden full" style="margin-top:12px;display:none;">
                  <label class="full">Buscar y seleccionar destinatarios</label>
                  <div class="single-search-row full" style="width:100% !important;">
                    <div class="search-input-wrapper autocomplete-container recipient-search-container full" style="width:100% !important;">
                      <input type="text" id="director-user-search" placeholder="Escribe el nombre o correo del destinatario..." autocomplete="off" class="form-input-wide form-input-custom search-input" oninput="handleDirectorSearchInput(this.value)">
                      <div id="director-suggestions-dropdown" class="suggestions-popover suggestions-dropdown-list" style="display:none;"></div>
                    </div>
                  </div>
                </div>

                <!-- Mini Formulario de Filtros (Rol, Grado, Sección) ARRIBA de los chips -->
                <div id="dmFilterBox" class="hidden full" style="margin-top:12px;">
                  <div class="flex-row">
                    <label class="flex-1">Rol <select id="dmFilterRole" onchange="updateDmCount()">
                      <option value="docente">Docentes</option>
                      <option value="estudiante">Alumnos</option>
                      <option value="padre">Padres de familia</option>
                    </select></label>
                    <label class="flex-1">Grado <select id="dmFilterGrade" onchange="updateDmCount()">
                      ${grades.map(g=>`<option>${g}</option>`).join('')}
                    </select></label>
                    <label class="flex-1">Sección <select id="dmFilterSection" onchange="updateDmCount()">
                      ${sections.map(s=>`<option>${s}</option>`).join('')}
                    </select></label>
                  </div>
                  <p class="muted recipient-count-badge" id="dmCount" style="margin-top:4px;">0 destinatarios</p>
                </div>

                <!-- Resumen de Destinatarios y Botón Quitar Todos -->
                <div class="chips-actions-bar" style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-top:14px;margin-bottom:6px;">
                  <span class="muted recipient-count-badge" id="dmTargetCount">(0 destinatarios)</span>
                  <button type="button" id="btn-clear-all-director-chips" class="btn-clear-chips-link hidden" onclick="clearAllDirectorRecipients()">&times; Quitar todos</button>
                </div>

                <!-- Chips / Etiquetas de personas agregadas DEBAJO del mini formulario -->
                <div id="director-selected-chips" class="selected-recipients-chips chips-list-below selected-chips-row recipient-chips-wrapper full" style="margin-top:6px;margin-bottom:16px;"></div>
              </div>

              <label class="full">Mensaje <textarea id="dmText" required oninput="updateDmChars()"></textarea><small class="muted" id="dmCharCount">0 caracteres</small></label>
              <div class="form-submit-footer-right form-submit-footer form-footer-actions">
                <button id="sendDirectorBtn" class="btn-send-main btn-submit-message btn primary">Enviar mensaje</button>
              </div>
            </form>
          </article>
        </div>
        <div id="dmSent" class="dm-tab-content hidden">
          <article class="card">
            <h3>Historial de mensajes enviados</h3>
            <div id="dmHistory">${directorMessageHistory()}</div>
          </article>
        </div>
        <div id="dmInbox" class="dm-tab-content hidden">
          <article class="card">
            <h3>Bandeja de entrada</h3>
            <div id="dmInboxList">${directorInboxHistory()}</div>
          </article>
        </div>
      </div>
    </div>`;
  window._directorSelectedRecipients = [];
  window._directorPendingUser = null;
  toggleDmFilter();
}
function switchDmTab(tab){
  document.querySelectorAll('.dm-tab-content').forEach(el=>el.classList.add('hidden'));
  document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('dm'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.remove('hidden');
  document.querySelector(`.tabs .tab:nth-child(${{compose:1,sent:2,inbox:3}[tab]})`).classList.add('active');
}

let _dmTimeout;
function updateDmCount(){
  clearTimeout(_dmTimeout);
  _dmTimeout=setTimeout(()=>{
    let role = document.getElementById('dmFilterRole')?.value || 'docente';
    let grade = document.getElementById('dmFilterGrade')?.value;
    let section = document.getElementById('dmFilterSection')?.value;
    let list = usersByFilter(role, grade, section);
    window._directorSelectedRecipients = list;
    let cntEl = document.getElementById('dmCount');
    if(cntEl) cntEl.textContent = `${list.length} destinatario(s)`;
    renderDirectorSelectedChips();
  },150);
}
function updateDmChars(){
  let len=document.getElementById('dmText').value.length;
  document.getElementById('dmCharCount').textContent=`${len} caracteres`;
}
function usersByFilter(role, grade, section){
  return (state.db.users || []).filter(u => {
    if(u.role !== role) return false;
    if(role === 'docente'){
      let t = (state.db.teachers || []).find(x => x.id === u.refId);
      if(!t) return false;
      if(t.grade && t.section && t.grade === grade && t.section === section) return true;
      return (state.db.courses || []).some(c => c.teacherId === t.id && c.grade === grade && c.section === section);
    } else if(role === 'estudiante'){
      let s = (state.db.students || []).find(x => x.id === u.refId);
      return s && s.grade === grade && s.section === section;
    } else if(role === 'padre'){
      let pId = u.refId;
      let children = (state.db.students || []).filter(s => String(s.parentId) === String(pId));
      return children.some(s => s.grade === grade && s.section === section);
    }
    return false;
  });
}
function sendDirectorMessage(e){
  e.preventDefault();
  let text=document.getElementById('dmText').value.trim();
  if(!text)return toast('Escribe el mensaje');
  let target=document.getElementById('dmTarget').value;
  let users=[];
  let singleName = '';

  if(target==='all'){
    users=state.db.users.filter(u=>u.refId!==state.user.id||u.role!==state.user.role);
  }else if(target==='single'){
    users = window._directorSelectedRecipients || [];
    if(!users.length) return toast('Por favor busca y agrega al menos un destinatario');
    singleName = users.length === 1 ? getUserDisplayName(users[0]).split(' (')[0] : '';
  }else if(target==='filter'){
    let role=document.getElementById('dmFilterRole').value;
    let grade=document.getElementById('dmFilterGrade').value;
    let section=document.getElementById('dmFilterSection').value;
    users=usersByFilter(role,grade,section);
  }else{
    let roleMap={docentes:'docente',padres:'padre',alumnos:'estudiante'};
    users=state.db.users.filter(u=>u.role===roleMap[target]);
  }

  if(!users.length) return toast('No se encontró ningún destinatario');

  let btn = document.getElementById('sendDirectorBtn');
  if(btn){ btn.disabled=true; btn.textContent='Enviando...'; }

  users.forEach(u=>sendDirectorMessageToUser(u,text));
  save();

  if(target==='single' && singleName){
    toast('Mensaje enviado correctamente a ' + singleName);
  } else {
    toast(`Mensaje enviado correctamente a ${users.length} destinatario(s)`);
  }
  directorMessagesPage();
}

function directorMessageHistory(){
  let sent=getDirectorSentMessages();
  let total=sent.length;
  return sent.map((m,i)=>{
    let replies=(m.replies||[]).length;
    let label=replies?`${replies} respuestas · `:'';
    let short=m.text.slice(0,60);
    return `<div class="dir-msg-item" onclick="toggleDmThread('${safeId(m.id)}',event)">
      <b title="${m.text.replace(/"/g,'&quot;')}">${short}${m.text.length>60?'...':''}</b>
      <p class="muted">${label}${m.toRole}s · ${m.time}</p>
      <div id="dmthread_${safeId(m.id)}" class="dir-msg-replies hidden">
        ${(m.replies||[]).map(r=>`<div class="chat-reply"><div class="chat-avatar">${r.fromRole==='docente'?'D':r.fromRole==='padre'?'P':'E'}</div><div class="chat-bubble"><b>${r.fromName}</b><p>${r.text}</p><small>${r.time}</small></div></div>`).join('')||'<p class="muted">Sin respuestas</p>'}
        <div class="chat-answer" style="margin-top:12px">
          <input id="sent_reply_${safeId(m.id)}" placeholder="Escribir respuesta">
          <button class="btn secondary" onclick="event.stopPropagation();sentReply('${safeId(m.id)}','${m.id}')">Responder</button>
        </div>
      </div>
    </div>`;
  }).join('')+(total>30?`<p class="muted">Mostrando 30 más recientes de ${total}</p>`:'')||'<p class="muted">No hay mensajes enviados.</p>';
}
function sentReply(tid,targetId){
  let input=document.getElementById("sent_reply_"+tid);
  let text=input?.value||"";
  if(!text.trim()){toast('Escribe una respuesta');return}
  if(!processReply(targetId,text))return;
  toast("Respuesta enviada");
  directorMessagesPage();
  switchDmTab('sent');
}
function inboxReply(tid,targetId){
  let input=document.getElementById("inbox_reply_"+tid);
  let text=input?.value||"";
  if(!text.trim()){toast('Escribe una respuesta');return}
  if(!processReply(targetId,text))return;
  toast("Respuesta enviada");
  directorMessagesPage();
}
function directorInboxHistory(){
  let inboxMsgs=getDirectorInbox();
  if(!inboxMsgs.length)return '<p class="muted">No hay mensajes recibidos.</p>';
  let threads={};
  inboxMsgs.forEach(m=>{
    let tid=m.threadId||m.id;
    if(!threads[tid])threads[tid]={id:tid,messages:[]};
    threads[tid].messages.push(m);
  });
  return Object.values(threads).map(t=>{
    let msgs=t.messages.sort((a,b)=>a.id>b.id?1:-1);
    let last=msgs[msgs.length-1];
    let tid=safeId(t.id);
    let firstMsg=msgs[0];
    let replyTargetId=firstMsg?firstMsg.id:t.id;
    return `<div class="dir-msg-item" onclick="toggleDmThread('${tid}',event)">
      <b>${last.fromName}</b>
      <p class="muted">${last.text.slice(0,60)}${last.text.length>60?'...':''}</p>
      <p class="muted">${last.time}</p>
      <div id="dmthread_${tid}" class="dir-msg-replies hidden">
        ${msgs.map(m=>`<div class="chat-reply"><div class="chat-avatar ${m.fromRole}">${m.fromRole==='docente'?'D':m.fromRole==='padre'?'P':'E'}</div><div class="chat-bubble"><b>${m.fromName}</b><p>${m.text}</p><small>${m.time}${m.courseId?` · ${cn(m.courseId)}`:''}</small></div></div>`).join('')}
        <div class="chat-answer" style="margin-top:12px">
          <input id="inbox_reply_${tid}" placeholder="Escribir respuesta">
          <button class="btn secondary" onclick="inboxReply('${tid}','${replyTargetId}')">Responder</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
