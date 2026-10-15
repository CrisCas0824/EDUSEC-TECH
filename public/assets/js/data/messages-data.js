function getMessages(){
  state.db.messages=state.db.messages||[];
  if(!state.db._msgWiped){
    state.db.messages=[];
    state.db._msgWiped=true;
    save();
  }
  return state.db.messages;
}
function getMessageById(id){
  return getMessages().find(m=>String(m.id)===String(id));
}
function _parentHasCourse(parentId,courseId){
  if(courseId==null)return true;
  return state.db.students.some(s=>s.parentId===parentId&&state.db.courses.some(c=>c.grade===s.grade&&c.section===s.section&&c.id==courseId));
}
function resolveEntity(role,refId){
  if(role==='docente') return state.db.teachers.find(t=>t.id===refId);
  if(role==='padre') return state.db.parents.find(p=>p.id===refId);
  if(role==='estudiante') return state.db.students.find(s=>s.id===refId);
  return state.db.directors?.find(d=>d.id===refId);
}
function getThreads(role,userId,search){
  let uid=String(userId);
  let msgs=getMessages().filter(m=>{
    let visible=(String(m.fromId)===uid&&m.fromRole===role)||(m.toRole===role&&String(m.toId)===uid);
    if(!visible)return false;
    if(role==='padre'&&m.courseId&&!_parentHasCourse(userId,m.courseId))return false;
    if(search){let q=search.toLowerCase();return m.text.toLowerCase().includes(q)||m.fromName.toLowerCase().includes(q)||(m.toName||'').toLowerCase().includes(q)}
    return true;
  });
  let threads={};
  msgs.forEach(m=>{
    let tid=m.threadId||String(m.id);
    if(!threads[tid])threads[tid]={id:tid,messages:[],participants:new Set()};
    threads[tid].messages.push(m);
    threads[tid].participants.add(m.fromName);
    threads[tid].participants.add(m.toName);
  });
  return Object.values(threads).map(t=>({...t,messages:t.messages.sort((a,b)=>String(a.id)>String(b.id)?1:-1),last:t.messages.reduce((a,b)=>String(a.id)>String(b.id)?a:b),unread:t.messages.filter(m=>m.read===false&&m.toRole===role&&String(m.toId)===uid).length})).sort((a,b)=>String(a.last.id)>String(b.last.id)?-1:1);
}
function getThreadMessages(threadId){
  let tid=String(threadId);
  let msgs=getMessages().filter(m=>String(m.threadId||m.id)===tid);
  let flat=[];
  msgs.sort((a,b)=>String(a.id)>String(b.id)?1:-1).forEach(m=>{
    flat.push(m);
    (m.replies||[]).forEach(r=>flat.push({...r,id:String(m.id)+'-r-'+flat.length,isReply:true}));
  });
  return flat;
}
function getDirectorInbox(){
  let direct=getMessages().filter(m=>m.toRole==='director');
  let replied=getMessages().filter(m=>m.fromRole==='director'&&m.replies?.length).flatMap(m=>m.replies.map(r=>({...r,id:String(m.id)+'-r-'+Math.random().toString(36).substring(2,6),threadId:String(m.threadId||m.id),toRole:'director',toName:state.user?.name||'Director',fromRole:r.fromRole,fromId:r.fromId,fromName:r.fromName,courseId:m.courseId})));
  return direct.concat(replied);
}
function getDirectorSentMessages(){
  return getMessages().filter(m=>m.fromRole==='director'&&String(m.fromId)===String(state.user.id)&&m.fromRole===state.user.role).slice(0,30);
}

function markThreadRead(threadId,role,userId){
  let tid=String(threadId);
  let uid=String(userId);
  getMessages().forEach(m=>{if(String(m.threadId||m.id)===tid&&m.toRole===role&&String(m.toId)===uid)m.read=true});
}
function getContactTeachers(role, userId, childId){
  let sid = (role === 'estudiante') ? userId : childId;
  if(!sid) return [];
  let courses = studentCourses(sid);
  let seen = new Set();
  return courses.map(c => ({
    teacherId: c.teacherId,
    teacherName: tn(c.teacherId),
    courseId: c.id,
    courseName: c.name,
    grade: c.grade,
    section: c.section
  })).filter(t => {
    if(seen.has(t.teacherId)) return false;
    seen.add(t.teacherId);
    return true;
  });
}

function addMessage(msg){
  msg.threadId=msg.threadId||Date.now()+'-'+Math.random().toString(36).substring(2,8);
  if(msg.read===undefined)msg.read=false;
  getMessages().unshift(msg);
}
function addReplyToMessage(id,reply){
  let m=getMessageById(id);
  if(!m)return;
  m.replies=m.replies||[];
  m.replies.push(reply);
}
