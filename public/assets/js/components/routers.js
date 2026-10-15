/* ============================================
   ROUTERS.JS — Minimal routes per role
   Padre: Inicio | Mis Hijos | Mensajes
   Docente: Inicio | Mis Cursos | Mensajes
   Estudiante: Inicio | Mis Cursos | Mensajes
   Director: Inicio | Gestion | Mensajes | Reportes
   ============================================ */
function parentPage(p){
  if(p==='dashboard')dashParent();
  if(p==='disponibilidad')availabilityPage();
  if(p==='hijos')childrenPage();
  if(p==='calendario')calendarPage();
  if(p==='mensajes')parentMessagesPage();
  if(p==='notificaciones')notifsPage();
  if(p==='perfil')userProfilePage();
  if(p==='bitacora')userTimelinePage();
}

function studentPage(p){
  if(p==='dashboard')dashStudent();
  if(p==='disponibilidad')availabilityPage();
  if(p==='cursos')coursesPage(state.user.id);
  if(p==='horario')studentHorarioPage(state.user.id);
  if(p==='calendario')calendarPage();
  if(p==='mensajes')studentMessagesPage();
  if(p==='notificaciones')notifsPage();
  if(p==='perfil')userProfilePage();
  if(p==='bitacora')userTimelinePage();
}

function teacherPage(p){
  if(p==='dashboard')dashTeacher();
  if(p==='disponibilidad')availabilityPage();
  if(p==='misCursos')teacherCoursesPage();
  if(p==='horario')teacherHorarioPage();
  if(p==='calendario')calendarPage();
  if(p==='mensajes')teacherMessagesPage();
  if(p==='notificaciones')notifsPage();
  if(p==='perfil')userProfilePage();
  if(p==='bitacora')userTimelinePage();
}

function directorPage(p){
  if(p==='dashboard')dashDirector();
  if(p==='gestion')gestionPage();
  if(p==='calendario')calendarPage();
  if(p==='mensajes')directorMessagesPage();
  if(p==='reportes')directorReportsPage();
  if(p==='notificaciones')notifsPage();
  if(p==='perfil')userProfilePage();
  if(p==='bitacora')userTimelinePage();
}
