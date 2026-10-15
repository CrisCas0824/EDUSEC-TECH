/* ============================================
   FORMS-INTEGRATION.JS — Updated for TopNav
   Injects Formularios button into teacher courses
   and Practicas button into student dashboard
   ============================================ */
(function(){
  function injectTeacherFormBtns(){
    return;
  }

  function injectStudentFormsBtn(){
    if(!state.user || state.user.role !== 'estudiante') return;
    var contentEl = document.getElementById('content');
    if(!contentEl) return;
    var dashTitle = contentEl.querySelector('.section-title h2');
    if(!dashTitle || dashTitle.textContent.trim() !== 'Panel del estudiante') return;
    var existingBtn = contentEl.querySelector('.student-forms-btn');
    if(existingBtn) return;
    var quickActions = contentEl.querySelector('.actions');
    if(!quickActions) return;
    var btn = document.createElement('button');
    btn.className = 'btn secondary student-forms-btn';
    btn.textContent = 'Practicas / Formularios';
    btn.onclick = function(){ studentFormsPage(); };
    quickActions.appendChild(btn);
  }

  function injectAll(){
    injectTeacherFormBtns();
    injectStudentFormsBtn();
  }

  /* Monkey-patch openPage para inyectar despues de cada navegacion */
  var origOpenPage = window.openPage;
  if(origOpenPage){
    window.openPage = function(page){
      origOpenPage(page);
      setTimeout(injectAll, 80);
      setTimeout(injectAll, 300);
    };
  }

  /* MutationObserver como respaldo */
  function observe(){
    var target = document.getElementById('content');
    if(target){
      var obs = new MutationObserver(function(){
        injectTeacherFormBtns();
        injectStudentFormsBtn();
        setTimeout(injectAll, 100);
      });
      obs.observe(target, { childList: true, subtree: true });
    }
    setTimeout(injectAll, 200);
    setTimeout(injectAll, 600);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe);
  else observe();
})();
