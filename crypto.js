/* =======================================================
   VOLKTRONIC CRYPTO ENGINE v9.5 - MOBILE FINAL FIX
   ======================================================= */

const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let USER = "";
let ROOM = "";
let SECRET = "";
let SECURE_ROOM_PATH = ""; 
let roomMessagesRef;

let selectedImageBase64 = null; 
let selectedAudioBase64 = null;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

const encSel = new Set();
const decSel = new Set();

function makeLayers(element, setObj) {
    if (!element) return;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer";
        btn.innerHTML = `<span>${i < 10 ? '0'+i : i}</span>`;
        btn.onclick = () => {
            if (setObj.has(i)) setObj.delete(i);
            else setObj.add(i);
            btn.classList.toggle("active");
        };
        element.appendChild(btn);
    }
}
makeLayers(document.getElementById("encLayers"), encSel);
makeLayers(document.getElementById("decLayers"), decSel);

document.getElementById("imageInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    const label = document.getElementById("imgLabel");
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
        alert("1.5MB Sınırı!");
        this.value = ""; return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        selectedAudioBase64 = null; 
        label.innerHTML = "Resim ✓";
        label.classList.add("active-state");
    };
    reader.readAsDataURL(file);
});

async function toggleAudioRecord() {
    const micBtn = document.getElementById("micBtn");
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    selectedAudioBase64 = reader.result;
                    selectedImageBase64 = null; 
                    micBtn.innerHTML = "Ses ✓";
                    micBtn.classList.remove("recording");
                    micBtn.classList.add("active-state");
                };
            };
            mediaRecorder.start();
            isRecording = true;
            micBtn.innerHTML = "Kayıt...";
            micBtn.classList.add("recording");
        } catch (err) { alert("Mikrofon izni yok."); }
    } else {
        mediaRecorder.stop();
        isRecording = false;
    }
}
window.toggleAudioRecord = toggleAudioRecord;

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !document.getElementById('login').classList.contains('hidden')) {
        enterRoom();
    }
});

function enterRoom() {
    USER = document.getElementById("username").value.trim();
    ROOM = document.getElementById("room").value.trim();
    const PIN = document.getElementById("roomPin").value.trim();
    SECRET = document.getElementById("secretKey").value.trim();

    if (!USER || !ROOM || !SECRET || !PIN) {
        alert("Eksik bilgi!"); return;
    }

    const roomHash = CryptoJS.MD5(ROOM + "_" + PIN).toString();
    SECURE_ROOM_PATH = ROOM + "_" + roomHash.substring(0, 10);

    document.getElementById("userNameDisplay").textContent = USER;
    document.getElementById("roomNameDisplay").textContent = ROOM;

    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    if (!window.fbListenersLoaded) {
        startFirebaseListeners();
        window.fbListenersLoaded = true;
    }
}

function startFirebaseListeners() {
    const myPresenceRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").push();
    myPresenceRef.set(USER);
    myPresenceRef.onDisconnect().remove();

    db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").on('value', (snap) => {
        const data = snap.val() || {};
        document.getElementById('onlineCountDisplay').innerText = Object.keys(data).length;
    });

    const globalPresenceRef = db.ref("global_presence").push();
    globalPresenceRef.set(USER);
    globalPresenceRef.onDisconnect().remove();

    db.ref("global_presence").on('value', (snap) => {
        const data = snap.val() || {};
        document.getElementById('platformCountDisplay').innerText = Object.keys(data).length;
    });

    roomMessagesRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/messages");
    
    roomMessagesRef.on('child_added', (snap) => {
        const data = snap.val() || {};
        const msgKey = snap.key;
        const safeUser = data.user || "Bilinmeyen";
        const safeText = data.text || "";
        const time = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

        const div = document.createElement("div");
        div.id = "msg-" + msgKey; 
        div.className = "msg-box msg " + (safeUser === USER ? "me" : "other");
        
        div.innerHTML = `
            <div class="msg-header"><strong>${safeUser}</strong><span>${time}</span></div>
            <div class="raw-data">${safeText}</div>
            <div class="action-row">
                <button class="action-btn" onclick="navigator.clipboard.writeText('${safeText}')">Kopyala</button>
                <button class="action-btn" onclick="document.getElementById('cipher').value='${safeText}'; if(window.innerWidth<=1024) window.switchMobileTab('decoder-panel', 'm-btn-dec');">Aktar</button>
                <button class="action-btn solve inline-decrypt-btn">Çöz</button>
            </div>
            <div class="decrypted-view" style="display:none;"></div>
        `;

        div.querySelector(".inline-decrypt-btn").onclick = () => {
            const decrypted = removeStrongLayers(safeText, SECRET, decSel);
            const view = div.querySelector(".decrypted-view");
            const raw = div.querySelector(".raw-data");
            const actions = div.querySelector(".action-row");

            if (typeof decrypted === "string" && decrypted.includes("HATA:")) {
                alert("Hatalı Katman/Anahtar");
            } else {
                let htmlContent = "";
                if (decrypted.startsWith("IMG||")) {
                    const parts = decrypted.split("||"); 
                    htmlContent = `<img src="${parts[1]}" style="max-width:100%; max-height:200px; object-fit:contain; display:block;"><div style="margin-top:8px;">${parts[2] || ""}</div>`;
                } else if (decrypted.startsWith("AUDIO||")) {
                    const parts = decrypted.split("||");
                    htmlContent = `<audio controls src="${parts[1]}" style="width:100%;"></audio><div>${parts[2] || ""}</div>`;
                } else if (decrypted.startsWith("TXT||")) {
                    htmlContent = decrypted.replace("TXT||", "");
                } else {
                    htmlContent = decrypted;
                }

                view.innerHTML = htmlContent;
                view.style.display = "block";
                raw.style.display = "none";
                actions.style.display = "none";

                if (data.burn && data.burn > 0) startBurnTimer(data.burn, msgKey, div);
            }
        };

        document.getElementById("log").appendChild(div);
        
        const scrollContainer = document.getElementById("chat-scroll-container");
        if(scrollContainer) {
            setTimeout(() => { scrollContainer.scrollTop = scrollContainer.scrollHeight; }, 100);
        }
    });

    roomMessagesRef.on('child_removed', (snap) => {
        const el = document.getElementById("msg-" + snap.key);
        if (el) {
            el.innerHTML = `<div style="text-align:center; font-size:12px; color:#a0b0c0;">Mesaj imha edildi.</div>`;
            setTimeout(() => el.remove(), 2000);
        }
    });
}

function startBurnTimer(seconds, msgKey, element) {
    let timeLeft = seconds;
    const timerDisplay = document.createElement("div");
    timerDisplay.style.color = "#ef4444"; timerDisplay.style.fontSize = "11px"; timerDisplay.style.marginTop = "10px"; timerDisplay.style.textAlign = "right";
    element.appendChild(timerDisplay);

    const interval = setInterval(() => {
        timerDisplay.innerHTML = `Siliniyor: ${timeLeft}s`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(interval);
            db.ref("rooms/" + SECURE_ROOM_PATH + "/messages/" + msgKey).remove();
        }
    }, 1000);
}

function applyStrongLayers(text, secret, selectedLayers) {
    let encrypted = text;
    let layers = [...selectedLayers].sort((a, b) => a - b);
    if (layers.length === 0) return CryptoJS.AES.encrypt(encrypted, secret).toString();
    layers.forEach(layer => {
        encrypted = CryptoJS.AES.encrypt(encrypted, secret + "_Salt_L" + layer).toString();
    });
    return encrypted;
}

function removeStrongLayers(ciphertext, secret, selectedLayers) {
    let decrypted = ciphertext;
    let layers = [...selectedLayers].sort((a, b) => b - a);
    try {
        if (layers.length === 0) {
            let bytes = CryptoJS.AES.decrypt(decrypted, secret);
            let result = bytes.toString(CryptoJS.enc.Utf8);
            if (!result) throw new Error(); return result;
        }
        layers.forEach(layer => {
            let bytes = CryptoJS.AES.decrypt(decrypted, secret + "_Salt_L" + layer);
            decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error();
        });
        return decrypted;
    } catch (error) { return "HATA:"; }
}

function encryptAndSend() {
    const msgInput = document.getElementById("message");
    const textVal = msgInput.value.trim();
    if (!textVal && !selectedImageBase64 && !selectedAudioBase64) return;

    let payload = selectedAudioBase64 ? "AUDIO||" + selectedAudioBase64 + "||" + textVal : 
                  selectedImageBase64 ? "IMG||" + selectedImageBase64 + "||" + textVal : "TXT||" + textVal;

    const encryptedPayload = applyStrongLayers(payload, SECRET, encSel);
    
    roomMessagesRef.push({ 
        user: USER, 
        text: encryptedPayload, 
        time: Date.now(), 
        burn: parseInt(document.getElementById("burnTimer").value) 
    });

    msgInput.value = "";
    selectedImageBase64 = null; selectedAudioBase64 = null;
    document.getElementById("imgLabel").innerHTML = "Resim"; document.getElementById("imgLabel").classList.remove("active-state");
    document.getElementById("micBtn").innerHTML = "Ses"; document.getElementById("micBtn").classList.remove("active-state");

    // KLAVYE KİLİDİ ÇÖZÜMÜ: Mesaj gönderildiğinde mobilde klavyeyi kapatır
    if(window.innerWidth <= 1024) {
        msgInput.blur(); // <-- En önemli satır! Klavyeyi güvenlice aşağı indirir.
        window.switchMobileTab('chat-panel', 'm-btn-chat');
    }
}

function decryptExternal() {
    const cipherText = document.getElementById("cipher").value.trim();
    if (!cipherText) return;
    const plainText = removeStrongLayers(cipherText, SECRET, decSel);
    const resultDiv = document.getElementById("result");

    if (plainText.includes("HATA:")) {
        resultDiv.innerHTML = "Hata: Yanlış Anahtar veya Katman"; resultDiv.style.color = "#ef4444";
    } else {
        let clean = plainText;
        if (clean.startsWith("IMG||")) clean = "[Görsel - Ağ Akışı panelinden çözün]";
        else if (clean.startsWith("AUDIO||")) clean = "[Ses - Ağ Akışı panelinden çözün]";
        else clean = clean.replace("TXT||", "");
        resultDiv.textContent = clean; resultDiv.style.color = "#10b981";
    }
}

async function triggerPanic() {
    if (confirm("DİKKAT: Oda silinecek!")) {
        await db.ref("rooms/" + SECURE_ROOM_PATH).remove();
        document.body.innerHTML = `<h2 style="color:white; text-align:center; margin-top:50vh;">İmha Edildi</h2>`;
        setTimeout(() => location.reload(), 2000);
    }
}

window.enterRoom = enterRoom; window.encryptAndSend = encryptAndSend;
window.decryptExternal = decryptExternal; window.triggerPanic = triggerPanic;
