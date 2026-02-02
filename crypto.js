// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "BURAYA_WEB_API_KEY",
  authDomain: "volktron-chat.firebaseapp.com",
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com",
  projectId: "volktron-chat"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= ORİJİNAL KODUN =================
let USER="", ROOM="";
const encSel=new Set(), decSel=new Set();

window.enterRoom = function(){
  USER=username.value.trim();
  ROOM=room.value.trim();
  if(!USER||!ROOM) return alert("Kullanıcı adı ve oda gerekli");
  userName.textContent=USER;
  roomName.textContent=ROOM;
  login.classList.add("hidden");
  chat.classList.remove("hidden");
  listenMessages();
}

window.changeRoom = function(){
  chat.classList.add("hidden");
  login.classList.remove("hidden");
  room.value="";
}

function makeLayers(el,set){
  for(let i=1;i<=10;i++){
    const d=document.createElement("div");
    d.className="layer";
    d.textContent="Katman "+i;
    d.onclick=()=>{
      set.has(i)?set.delete(i):set.add(i);
      d.classList.toggle("active");
    };
    el.appendChild(d);
  }
}
makeLayers(encLayers,encSel);
makeLayers(decLayers,decSel);

function applyLayers(t,l){
  let o=t;
  [...l].sort((a,b)=>a-b).forEach(k=>{
    o=[...o].map(c=>String.fromCharCode(c.charCodeAt(0)+k)).join("");
  });
  return o;
}

function removeLayers(t,l){
  let o=t;
  [...l].sort((a,b)=>b-a).forEach(k=>{
    o=[...o].map(c=>String.fromCharCode(c.charCodeAt(0)-k)).join("");
  });
  return o;
}

// ================= SEND =================
window.encrypt = function(){
  if(!message.value)return;
  const encrypted = applyLayers(message.value,encSel);

  push(ref(db, `rooms/${ROOM}/messages`), {
    user: USER,
    text: encrypted,
    time: Date.now()
  });

  message.value="";
}

// ================= RECEIVE =================
function listenMessages(){
  onValue(ref(db, `rooms/${ROOM}/messages`), snap=>{
    log.innerHTML="";
    const data=snap.val();
    if(!data)return;
    Object.values(data).forEach(m=>{
      log.innerHTML+=`<div><b>${m.user}:</b> ${m.text}</div>`;
    });
  });
}

// ================= DECRYPT =================
window.decrypt = function(){
  if(!cipher.value)return;
  result.textContent="Çözüm: "+removeLayers(cipher.value,decSel);
}
