function studentHorarioPage(sid){
  var s=st(sid);
  if(!s){openPage('dashboard');return;}
  var entries=(state.db.schedules||[]).filter(function(x){return x.grade===s.grade&&x.section===s.section}).map(function(x){return{day:x.day,hour:x.hour,courseId:x.courseId}});
  content.innerHTML='<div class="section-title"><h2>Mi horario</h2><p>'+s.grade+' '+s.section+'</p></div><div class="page-body"><article class="card"><h3>Horario semanal</h3>'+(entries.length?renderScheduleGrid(entries):'<p class="muted" style="padding:16px 0;text-align:center">Sin horario registrado.</p>')+'</article></div>';
}