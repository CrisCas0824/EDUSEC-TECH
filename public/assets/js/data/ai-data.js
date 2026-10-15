/* Recolecta y anonimiza datos del estudiante para la IA */
function prepareAiData(sid){
  let s=st(sid);
  if(!s)return null;
  let courses=studentCourses(sid);
  let courseData=courses.map(c=>{
    let g=state.db.grades.filter(x=>x.studentId==sid&&x.courseId==c.id);
    let avg=courseAvg(sid,c.id);
    let att=attPct(sid,c.id);
    let pendingCount=pending(sid).filter(a=>a.courseId==c.id).length;
    return {name:c.name,score:+avg.toFixed(1),attendance:att,pending:pendingCount,grades:g.map(x=>({bim:x.bim||'I',score:x.score}))};
  }).sort((a,b)=>a.score-b.score);
  let overallAvg=+avg(sid);
  let overallAtt=attPct(sid);
  let totalPending=pending(sid).length;
  let alertsCount=courseData.filter(c=>c.score<11).length;
  return {
    grade:s.grade,section:s.section,
    overallAvg,overallAtt,totalPending,alertsCount,
    courses:courseData,
  };
}
function buildAiPrompt(data){
  if(!data)return '';
  let lines=[`Analiza el siguiente perfil académico y genera consejos para los padres:\n`];
  lines.push(`Estudiante: Grado ${data.grade}, Sección ${data.section}`);
  lines.push(`Promedio general: ${data.overallAvg}/20`);
  lines.push(`Asistencia general: ${data.overallAtt}%`);
  lines.push(`Tareas pendientes: ${data.totalPending}`);
  lines.push(`Alertas: ${data.alertsCount} curso(s) con nota menor a 11\n`);
  lines.push(`Rendimiento por curso:`);
  data.courses.forEach(c=>{
    lines.push(`- ${c.name}: ${c.score}/20, Asistencia: ${c.attendance}%, Pendientes: ${c.pending}`);
  });
  return lines.join('\n');
}
