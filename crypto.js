import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Yapılandırman
const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- GLOBAL DEĞİŞKENLER ---
let USER = "", ROOM = "", SECRET = "", roomRef;
const encSel = new Set();
const decSel = new Set();

// --- KATMANLARI (BUTONLARI) OLUŞTURMA ---
function makeLayers(el, set) {
  for (let i = 1; i <= 10; i++) {
    const d = document.createElement("div");
    d.className = "layer";
    // Sadece L1, L2 yerine daha teknolojik görünüm
    d.innerHTML = `N-${i < 10 ? '0'+i : i}`; 
    d.onclick = () => {
      set.has(i) ? set.delete(i) : set.add(i);
      d.classList.toggle("active");
    };
    if(el) el.appendChild(d);
  }
}

// Sayfa yüklendiğinde katman butonlarını DOM'a bas
makeLayers(document.getElementById("encLayers"), encSel);
makeLayers(document.getElementById("decLayers"), decSel);

// --- ODAYA GİRİŞ ---
function enterRoom() {
  USER = document.getElementById("username").value.trim();
  ROOM = document.getElementById("room").value.trim();
  SECRET = document.getElementById("secretKey").value.trim();
  
  if (!USER || !ROOM || !SECRET) {
    // Daha havalı bir uyarı (basit alert yerine)
    const loginCard = document.getElementById("login");
    loginCard.style.boxShadow = "0 0 50px red";
    setTimeout(() => loginCard.style.boxShadow = "", 500);
    return;
  }

  document.getElementById("userNameDisplay").textContent = USER;
  document.getElementById("roomNameDisplay").textContent = ROOM;
  
  const loginDiv = document.getElementById("login");
  const chatDiv = document.getElementById("chat");

  // Geçiş Animasyonu
  loginDiv.style.transform = "scale(0.9) translateY(-100px)";
  loginDiv.style.opacity = "0";
  
  setTimeout(() => {
      loginDiv.classList.add("hidden");
      chatDiv.classList.remove("hidden");
  }, 300);


  // Firebase Dinleyicisi
  roomRef = ref(db, "rooms/" + ROOM);
  onChildAdded(roomRef, snap => {
    const d = snap.val();
    const div = document.createElement("div");
    div.className = "msg " + (d.user === USER ? "me" : "other");
    const t = new Date(d.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    div.innerHTML = `
        <div><b>[${d.user}]</b> <span style="opacity:.6;font-size:10px;">${t}</span></div>
        <div style="margin-top:5px; word-break:break-all; font-family:'source code pro', monospace;">${d.text}</div>
        <span class="copy-btn" title="Decrypt'e Kopyala">⚡</span>
    `;
    
    div.querySelector(".copy-btn").onclick = () => {
      document.getElementById("cipher").value = d.text;
      // Ufak bir görsel geri bildirim
      document.getElementById("cipher").focus();
    };
    
    const logDiv = document.getElementById("log");
    logDiv.appendChild(div);
    logDiv.scrollTop = logDiv.scrollHeight;
  });
}

// --- GÜÇLÜ AES-256 ŞİFRELEME (ÇOKLU KATMAN) ---
function applyStrongLayers(text, secret, selectedLayers) {
  let encrypted = text;
  let layers = [...selectedLayers].sort((a, b) => a - b);
  
  if (layers.length === 0) {
    return CryptoJS.AES.encrypt(encrypted, secret).toString();
  }

  layers.forEach(layer => {
    let layerSpecificKey = secret + "_LayerSalt_N" + layer;
    encrypted = CryptoJS.AES.encrypt(encrypted, layerSpecificKey).toString();
  });
  
  return encrypted;
}

// --- GÜÇLÜ AES-256 ŞİFRE ÇÖZME ---
function removeStrongLayers(ciphertext, secret, selectedLayers) {
  let decrypted = ciphertext;
  let layers = [...selectedLayers].sort((a, b) => b - a);
  
  try {
    if (layers.length === 0) {
       let bytes = CryptoJS.AES.decrypt(decrypted, secret);
       let result = bytes.toString(CryptoJS.enc.Utf8);
       if(!result) throw new Error();
       return result;
    }

    layers.forEach(layer => {
      let layerSpecificKey = secret + "_LayerSalt_N" + layer;
      let bytes = CryptoJS.AES.decrypt(decrypted, layerSpecificKey);
      decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if(!decrypted) throw new Error(); 
    });
    
    return decrypted;
  } catch (error) {
    return "ERR_DECRYPTION_FAILED // Invalid Key or Layer Sequence.";
  }
}

// --- MESAJ GÖNDER ---
function encryptAndSend() {
  const msgInput = document.getElementById("message");
  if (!msgInput.value.trim()) return;
  
  const encryptedText = applyStrongLayers(msgInput.value, SECRET, encSel);
  
  push(roomRef, { 
    user: USER, 
    text: encryptedText, 
    time: Date.now() 
  });
  
  msgInput.value = "";
}

// --- MESAJ ÇÖZ ---
function decryptMessage() {
  const cipherInput = document.getElementById("cipher").value.trim();
  const resultDiv = document.getElementById("result");
  
  if (!cipherInput) {
    resultDiv.innerHTML = "<span style='color:var(--neon-pink)'>ERR_EMPTY_INPUT // Please verify source data.</span>";
    return;
  }

  const decryptedText = removeStrongLayers(cipherInput, SECRET, decSel);
  
  if (decryptedText.includes("ERR_")) {
    resultDiv.style.color = "var(--neon-pink)"; 
    resultDiv.style.textShadow = "0 0 5px var(--neon-pink)";
  } else {
    resultDiv.style.color = "var(--neon-green)"; 
    resultDiv.style.textShadow = "0 0 5px var(--neon-green)";
  }
  
  resultDiv.textContent = "> " + decryptedText;
}

// Window objesine bağlama
window.enterRoom = enterRoom;
window.encryptAndSend = encryptAndSend;
window.decryptMessage = decryptMessage;
