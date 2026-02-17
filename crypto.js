<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Volktronic E2EE Chat</title>

<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { deriveKey, encryptMessage, decryptMessage } from "./crypto.js";

const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let USER="", ROOM="", KEY, roomRef;

window.enterRoom = async () => {
  USER = username.value.trim();
  ROOM = room.value.trim();
  const SECRET = secret.value.trim();

  if(!USER || !ROOM || !SECRET) {
    alert("Eksik bilgi");
    return;
  }

  KEY = await deriveKey(SECRET);

  login.style.display="none";
  chat.style.display="block";
  userName.textContent=USER;
  roomName.textContent=ROOM;

  roomRef = ref(db,"rooms/"+ROOM);

  onChildAdded(roomRef, async snap => {
    const d = snap.val();
    try{
      const text = await decryptMessage(KEY, d.cipher, d.iv);
      addMsg(d.user, text);
    }catch{
      addMsg("⚠️", "Anahtar uyuşmuyor");
    }
  });
};

window.sendMsg = async () => {
  if(!message.value) return;

  const enc = await encryptMessage(KEY, message.value);

  push(roomRef,{
    user: USER,
    cipher: enc.cipher,
    iv: enc.iv,
    time: Date.now()
  });

  message.value="";
};

function addMsg(user,text){
  const div=document.createElement("div");
  div.innerHTML="<b>"+user+":</b> "+text;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
}
</script>

<style>
body{background:#020617;color:#fff;font-family:sans-serif}
input,textarea,button{width:100%;margin:5px;padding:10px}
#chat{display:none}
#log{height:200px;overflow:auto;border:1px solid #333;padding:5px}
</style>
</head>

<body>

<div id="login">
  <input id="username" placeholder="Kullanıcı">
  <input id="room" placeholder="Oda">
  <input id="secret" placeholder="Gizli Kod">
  <button onclick="enterRoom()">Giriş</button>
</div>

<div id="chat">
  <h3>Oda: <span id="roomName"></span> | 👤 <span id="userName"></span></h3>
  <textarea id="message"></textarea>
  <button onclick="sendMsg()">Gönder</button>
  <div id="log"></div>
</div>

</body>
</html>
