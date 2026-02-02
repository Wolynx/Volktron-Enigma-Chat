// 🔥 Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🔧 Firebase config (BURAYI KENDİ PROJENDEN ALDIN)
const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let USER="", ROOM="";
const encSel=new Set(), decSel=new Set();

// UI
window.enterRoom = () => {
  USER=username.value.trim();
  ROOM=room.value.trim();
  if(!USER||!ROOM) return alert("Kullanıcı adı ve oda gerekli");
  userName.textContent=USER;
  roomName.textContent=ROOM;
  login.classList.add("hidden");
  chat.classList.remove("hidden");

  const roomRef = ref(db, "rooms/"+ROOM);
  onChildAdded(roomRef, snap=>{
    const m=snap.val();
    log.innerHTML+=`<div><b>${m.user}:</b> ${m.text}</div>`;
  });
};

window.changeRoom = () => {
  location.reload();
};

// Katman butonları
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

// Şifreleme
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

// Mesaj gönder
window.sendMessage = () => {
  if(!message.value) return;
  const enc = applyLayers(message.value, encSel);
  push(ref(db,"rooms/"+ROOM),{
    user:USER,
    text:enc,
    time:Date.now()
  });
  message.value="";
};

// Çöz
window.decrypt = () => {
  if(!cipher.value) return;
  result.textContent="Çözüm: "+removeLayers(cipher.value,decSel);
};
