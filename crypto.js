/* ================= STATE ================= */
let USER="", ROOM="", roomRef;
const encSel=new Set(), decSel=new Set();
const db = firebase.database();

/* ================= SIMPLE CRYPTO =================
   (Stabil, demo seviyesi – sonra AES'e yükseltiriz) */
function xorCrypt(text,key){
  return [...text].map((c,i)=>
    String.fromCharCode(
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    )
  ).join("");
}

/* ================= UI ================= */
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

/* ================= LOGIN ================= */
function enterRoom(){
  USER = username.value.trim();
  ROOM = room.value.trim();
  if(!USER || !ROOM || !secret.value){
    alert("Eksik bilgi");
    return;
  }

  login.classList.add("hidden");
  chat.classList.remove("hidden");
  userName.textContent = USER;
  roomName.textContent = ROOM;

  roomRef = db.ref("rooms/" + ROOM);
  roomRef.on("child_added", snap => {
    const d = snap.val();
    const div = document.createElement("div");
    div.className = "msg " + (d.user === USER ? "me":"other");
    div.innerHTML = "<b>"+d.user+"</b><br>" +
      xorCrypt(d.text, secret.value);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  });
}

/* ================= SEND ================= */
function sendMsg(){
  if(!message.value) return;
  const enc = xorCrypt(message.value, secret.value);
  roomRef.push({
    user: USER,
    text: enc,
    time: Date.now()
  });
  message.value="";
}

/* ================= MANUAL DECRYPT ================= */
function manualDecrypt(){
  result.textContent =
    "Çözüm: " + xorCrypt(cipher.value, secret.value);
}
