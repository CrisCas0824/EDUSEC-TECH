function getRoleKey(role){return role==='padre'?'parentId':role==='estudiante'?'studentId':'teacherId'}

function canReply(m){
  if(!state.user) return false;
  let uid = String(state.user.id);
  let urole = state.user.role;
  let sId = String(m.senderId || m.fromId || "");
  let rId = String(m.recipientId || m.toId || "");
  let sRole = m.fromRole;
  let rRole = m.toRole;

  if (sId === uid && sRole === urole) return true;
  if (rId === uid && rRole === urole) return true;
  if (sId === uid || rId === uid) return true;
  if (urole === 'director') return true;
  return false;
}

function createMessage(fromRole,fromId,fromName,toRole,toId,toName,courseId,text){
  let msg={
    id: Date.now()+Math.random(),
    senderId: fromId,
    recipientId: toId,
    fromRole,
    fromId,
    fromName,
    toRole,
    toId,
    toName,
    courseId,
    text,
    time: new Date().toLocaleString(),
    replies: [],
    read: false
  };
  addMessage(msg);
  return msg;
}

function createTeacherMessage(toRole,toId,toName,courseId,text){
  let msg=createMessage('docente',state.user.id,state.user.name,toRole,toId,toName,courseId,text);
  addN({toRole,[toRole==='padre'?'parentId':'studentId']:toId,title:`Mensaje del docente - ${cn(courseId)}`,text,link:'mensajes'});
}

function sendDirectorMessageToUser(u,text){
  let entity=resolveEntity(u.role,u.refId);
  createMessage('director',state.user.id,state.user.name,u.role,u.refId,entity?.name||u.email,null,text);
  addN({toRole:u.role,[getRoleKey(u.role)]:u.refId,title:'Mensaje del director',text,link:'mensajes'});
}

function processReply(messageId,text){
  let m=getMessageById(messageId);
  if(!m)return false;
  if(!canReply(m)){toast('No tienes permiso para responder este mensaje');return false}
  if(!text.trim()){toast('Escribe una respuesta');return false}
  addReplyToMessage(messageId,{
    senderId: state.user.id,
    fromRole: state.user.role,
    fromId: state.user.id,
    fromName: state.user.name,
    text: text.trim(),
    time: new Date().toLocaleString()
  });
  if(m.fromRole==='director'){
    addN({toRole:'director',directorId:m.fromId,title:`Respuesta de ${state.user.name}`,text:text.trim(),link:'mensajes',refType:'message',messageId:m.id});
  }else if(state.user.role==='docente'){
    addN({toRole:m.toRole,[m.toRole==='padre'?'parentId':'studentId']:m.toId,title:'Respuesta del docente',text:text.trim(),link:'mensajes',refType:'message',messageId:m.id,courseId:m.courseId});
  }else{
    addN({toRole:'docente',teacherId:m.fromId,title:`Respuesta de ${state.user.name}`,text:text.trim(),link:'mensajes',refType:'message',messageId:m.id,courseId:m.courseId});
  }
  save();
  return true;
}
function sendParentMessages(courseId,text,type,studentId){
  let c=state.db.courses.find(x=>x.id==courseId);
  if(!text.trim()){toast('Escribe el mensaje');return false}
  if(type==='all'){
    [...new Set(studentsOfCourse(c).map(s=>s.parentId))].forEach(pid=>createTeacherMessage('padre',pid,state.db.parents.find(p=>p.id===pid)?.name||'Padre',c.id,text.trim()));
  }else{
    let stu=st(+studentId);
    createTeacherMessage('padre',stu.parentId,state.db.parents.find(p=>p.id===stu.parentId)?.name||'Padre',c.id,text.trim());
  }
  save();
  return true;
}
function sendStudentMessages(courseId,text,type,studentId){
  let c=state.db.courses.find(x=>x.id==courseId);
  if(!text.trim()){toast('Escribe el mensaje');return false}
  if(type==='all'){
    studentsOfCourse(c).forEach(stu=>createTeacherMessage('estudiante',stu.id,stu.name,c.id,text.trim()));
  }else{
    let stu=st(+studentId);
    createTeacherMessage('estudiante',stu.id,stu.name,c.id,text.trim());
  }
  save();
  return true;
}

function sendParentToTeacher(parentId, childId, teacherId, courseId, text){
  let valid = getContactTeachers('padre', parentId, childId).some(t => t.teacherId == teacherId && t.courseId == courseId);
  if(!valid){toast('No puedes enviar mensaje a este docente');return null}
  let msg = createMessage('padre', parentId, state.user.name, 'docente', teacherId, tn(teacherId), courseId, text.trim());
  addN({toRole:'docente', teacherId, title:'Mensaje de '+state.user.name, text:text.trim(), link:'mensajes', refType:'message', messageId:msg.id, courseId});
  save();
  return msg;
}

function sendStudentToTeacher(studentId, teacherId, courseId, text){
  let valid = getContactTeachers('estudiante', studentId).some(t => t.teacherId == teacherId && t.courseId == courseId);
  if(!valid){toast('No puedes enviar mensaje a este docente');return null}
  let msg = createMessage('estudiante', studentId, state.user.name, 'docente', teacherId, tn(teacherId), courseId, text.trim());
  addN({toRole:'docente', teacherId, title:'Mensaje de '+state.user.name, text:text.trim(), link:'mensajes', refType:'message', messageId:msg.id, courseId});
  save();
  return msg;
}
