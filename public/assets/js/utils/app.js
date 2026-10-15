/* ============================================
   APP.JS — Core Auth, Navigation, TopNav Logic
   ============================================ */
function I(){return ''}
function copyText(t){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>toast('Copiado')).catch(()=>fallbackCopy(t));else fallbackCopy(t)}
function fallbackCopy(t){var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Copiado')}catch(e){toast('No se pudo copiar')}document.body.removeChild(ta)}
document.addEventListener('DOMContentLoaded',()=>{
  try{load();}catch(e){console.error('load() error:',e);state.db=state.db||{};}
  $$('.quick button').forEach(b=>b.onclick=()=>{email.value=b.dataset.e;password.value='123456'});
  loginForm.onsubmit=login;
  forgotLink.onclick=showForgotModal;
  bell.onclick=function(e){
    e.stopPropagation();
    if(drawer.classList.contains('hidden')){openDrawer();}else{drawer.classList.add('hidden');}
  };
  setupTopNav();
  setupProfileDropdown();
});

/* ---- LOGIN ---- */
function login(e){
  e.preventDefault();
  loading('Verificando credenciales...');
  let emailStr=email.value.trim().toLowerCase();
  let lu=loginUser(emailStr,password.value);
  if(lu==='inactive'){stopLoading();return toast('Cuenta desactivada. Contacta al director.')}
  if(!lu){
    let pu=parseUser(emailStr);
    if(pu&&password.value==='123456'){
      ensureUsersData();
      let fu=findUser(emailStr);
      if(fu){state.user=pu;stopLoading();finishLogin(pu);return}
    }
    stopLoading();
    return toast('Usuario o contrasena incorrectos');
  }
  let userObj=resolveUserObject(lu);
  if(!userObj){stopLoading();return toast('Error al cargar usuario')}
  state.user=userObj;
  stopLoading();
  finishLogin(userObj);
}

function resolveUserObject(lu){
  let pu=parseUser(lu.email);
  if(pu)return pu;
  let name='',short='',roleName='',_grade='',_section='';
  if(lu.role==='docente'){let t=state.db.teachers.find(x=>x.id===lu.refId);if(!t)return null;name=t.name;roleName='Docente';short='D'+lu.refId}
  else if(lu.role==='estudiante'){let s=st(lu.refId);if(!s)return null;name=s.name;roleName='Estudiante';short='E'+lu.refId;_grade=s.grade;_section=s.section}
  else if(lu.role==='padre'){let p=state.db.parents.find(x=>x.id===lu.refId);if(!p)return null;name=p.name;roleName='Padre de familia';short='P'+lu.refId}
  else if(lu.role==='director'){let d=state.db.directors?.find(x=>x.id===lu.refId);name=d?d.name:'Director';roleName='Director';short='DIR'}
  let obj={role:lu.role,id:lu.refId,email:lu.email,name,short,roleName};
  if(lu.role==='estudiante'){obj.grade=_grade;obj.section=_section;}
  return obj;
}

function finishLogin(u){
  drawer.classList.add('hidden');
  modal.classList.add('hidden');
  state.childId=getChildren()[0]?.id||u.id;
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  roleLabel.textContent=u.roleName;
  uname.textContent=u.name;
  umail.textContent=u.email;
  avatar.textContent=u.short;
  cleanupFormTimer();
  window._formId=null;window._formAnswers=null;window._formQIdx=null;
  window._formStart=null;window._formTimeLimit=null;window._formAutoSubmitting=null;
  window._formCid=null;window._formQuestions=null;window._editingFormId=null;
  buildNav();
  openPage('dashboard');
}

function togglePassword(id,btn){
  let inp=document.getElementById(id);
  if(inp.type==='password'){inp.type='text';btn.innerHTML='&#9675;'}
  else{inp.type='password';btn.innerHTML='&#9673;'}
}

/* ---- TOPNAV NAVIGATION ---- */
function buildNav(){
  var tn=document.getElementById('topNav');
  if(!tn)return;
  tn.innerHTML=menus[state.user.role].map(m=>
    '<button data-page="'+m[0]+'" onclick="openPage(\''+m[0]+'\')">'+m[1]+'</button>'
  ).join('');
  closeMobileNav();
}

function openPage(p){
  state.page=p;
  $$('.topnav-center button').forEach(b=>b.classList.toggle('active',b.dataset.page===p));
  let m=menus[state.user.role].find(x=>x[0]===p);
  if(m){
    let titleEl=document.getElementById('title');
    let crumbEl=document.getElementById('crumb');
    let cleanTitle=m[1].replace(/[📊👨‍👩‍👧📚✅📋💬📅⭐🕒📑🔔🏫👥📝📦➕🎓🔗🕐🔐]/g,'').trim();
    if(titleEl)titleEl.textContent=cleanTitle;
    if(crumbEl)crumbEl.textContent=state.user.roleName+' / '+cleanTitle;
  }
  if(state.user.role==='padre')parentPage(p);
  if(state.user.role==='docente')teacherPage(p);
  if(state.user.role==='estudiante')studentPage(p);
  if(state.user.role==='director')directorPage(p);
  updateNotif();
  markLoginState();
  closeMobileNav();
}

/* ---- NOTIFICATIONS ---- */
function visibleNotifs(){
  return state.db.notifications.filter(n=>
    n.toRole===state.user.role&&
    (state.user.role==='padre'?n.parentId===state.user.id:
     state.user.role==='estudiante'?n.studentId===state.user.id:
     state.user.role==='director'?n.directorId===state.user.id:
     n.teacherId===state.user.id)
  );
}
function updateNotif(){
  var unreadCount = visibleNotifs().filter(n=>!n.read && !n.isRead).length;
  var badges = document.querySelectorAll('#ncount, #unread-count, .notification-badge, .notif-badge');
  badges.forEach(b => {
    b.textContent = unreadCount;
    if(unreadCount === 0){
      b.style.display = 'none';
    } else {
      b.style.display = 'inline-block';
    }
  });
}

/* ---- MOBILE NAV ---- */
function setupTopNav(){
  var btn=document.getElementById('topnavHamburger');
  if(!btn)return;
  btn.onclick=function(e){
    e.preventDefault();
    var tn=document.getElementById('topNav');
    if(tn)tn.classList.toggle('mobile-open');
  };
  document.addEventListener('click',function(e){
    var tn=document.getElementById('topNav');
    var hb=document.getElementById('topnavHamburger');
    if(tn&&hb&&!tn.contains(e.target)&&!hb.contains(e.target)){
      tn.classList.remove('mobile-open');
    }
  });
}
function closeMobileNav(){
  var tn=document.getElementById('topNav');
  if(tn)tn.classList.remove('mobile-open');
}
document.addEventListener('DOMContentLoaded',setupTopNav);

/* ---- PROFILE DROPDOWN ---- */
function setupProfileDropdown(){
  var wrap=document.getElementById('avatarWrap');
  var btn=document.getElementById('avatarBtn');
  var dd=document.getElementById('profileDropdown');
  if(!btn||!dd||!wrap)return;
  btn.onclick=function(e){
    e.stopPropagation();
    dd.classList.toggle('hidden');
    wrap.classList.toggle('open');
  };
  document.addEventListener('click',function(e){
    if(!wrap.contains(e.target)){
      dd.classList.add('hidden');
      wrap.classList.remove('open');
    }
  });
  var logoutBtn=document.getElementById('logout');
  if(logoutBtn){
    logoutBtn.onclick=function(){
      if(!confirm('Cerrar sesion?'))return;
      state.user=null;
      dd.classList.add('hidden');
      wrap.classList.remove('open');
      forceLogoutVisualState();
    };
  }
  var resetBtn=document.getElementById('resetBtn');
  if(resetBtn){
    resetBtn.onclick=function(){
      if(!confirm('Restaurar datos por defecto? Se perderan todos los cambios.'))return;
      localStorage.removeItem(STORE);
      load();
      toast('Datos restaurados');
      dd.classList.add('hidden');
      wrap.classList.remove('open');
      if(state.user)openPage('dashboard');
    };
  }
}
document.addEventListener('DOMContentLoaded',setupProfileDropdown);

/* ---- MODAL ---- */
function moodleToggle(trigger,id){
  trigger.classList.toggle('collapsed');
  var el=document.getElementById(id);
  if(el)el.classList.toggle('hidden');
}
function showForgotModal(){
  openModal(
    '<h3>Recuperar contrasena</h3>'+
    '<p class="muted">Ingresa tu correo institucional.</p>'+
    '<form id="forgotForm" class="form">'+
      '<label class="full">Email<input id="forgotEmail" type="email" required></label>'+
      '<button class="btn primary full">Buscar cuenta</button>'+
    '</form>'+
    '<div id="forgotResult"></div>'
  );
  forgotForm.onsubmit=function(e){
    e.preventDefault();
    var fu=findUser(forgotEmail.value.trim().toLowerCase());
    var r=document.getElementById('forgotResult');
    if(!fu){r.innerHTML='<p class="err">No encontramos una cuenta con ese email.</p>';return}
    r.innerHTML=
      '<p>Pregunta de seguridad: <b>Nombre de tu docente favorito?</b></p>'+
      '<form id="securityForm" class="form">'+
        '<label class="full">Respuesta<input id="securityAnswer" required></label>'+
        '<button class="btn primary full">Verificar</button>'+
      '</form>'+
      '<div id="securityResult"></div>';
    securityForm.onsubmit=function(ev){
      ev.preventDefault();
      var sr=document.getElementById('securityResult');
      if(securityAnswer.value.trim().toLowerCase()!==fu.securityAnswer.toLowerCase()){
        sr.innerHTML='<p class="err">Respuesta incorrecta.</p>';return;
      }
      sr.innerHTML=
        '<p class="ok">Identidad verificada. Ingresa tu nueva contrasena.</p>'+
        '<form id="resetPassForm" class="form">'+
          '<label class="full">Nueva contrasena<div class="password-wrap"><input id="newPass" type="password" required minlength="4"><button type="button" class="pw-toggle" onclick="togglePassword(\'newPass\',this)" tabindex="-1">&#9673;</button></div></label>'+
          '<label class="full">Confirmar<div class="password-wrap"><input id="confirmPass" type="password" required minlength="4"><button type="button" class="pw-toggle" onclick="togglePassword(\'confirmPass\',this)" tabindex="-1">&#9673;</button></div></label>'+
          '<button class="btn primary full">Cambiar contrasena</button>'+
        '</form>';
      resetPassForm.onsubmit=function(ev2){
        ev2.preventDefault();
        if(newPass.value!==confirmPass.value)return toast('Las contrasenas no coinciden');
        if(newPass.value.trim().length<4)return toast('La contrasena debe tener al menos 4 caracteres');
        fu.password=newPass.value.trim();
        save();
        toast('Contrasena actualizada');
        modal.classList.add('hidden');
      };
    };
  };
}

/* ---- LOGIN STATE ---- */
function markLoginState(){
  var appEl=document.getElementById('app');
  if(appEl&&!appEl.classList.contains('hidden')){
    document.body.classList.add('logged-in');
  }else{
    document.body.classList.remove('logged-in');
  }
}

function forceLogoutVisualState(){
  var appEl=document.getElementById('app');
  var loginEl=document.getElementById('login');
  document.body.classList.remove('logged-in');
  if(typeof drawer!=='undefined')drawer.classList.add('hidden');
  if(typeof modal!=='undefined')modal.classList.add('hidden');
  if(appEl)appEl.classList.add('hidden');
  if(loginEl)loginEl.classList.remove('hidden');
  closeMobileNav();
}

/* ---- KEYBOARD SHORTCUTS ---- */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    if(!modal.classList.contains('hidden'))modal.classList.add('hidden');
    if(typeof drawer!=='undefined'&&!drawer.classList.contains('hidden'))drawer.classList.add('hidden');
    var dd=document.getElementById('profileDropdown');
    var aw=document.getElementById('avatarWrap');
    if(dd)dd.classList.add('hidden');
    if(aw)aw.classList.remove('open');
    closeMobileNav();
  }
});

document.addEventListener('DOMContentLoaded',markLoginState);
setTimeout(markLoginState,100);
setTimeout(markLoginState,500);
