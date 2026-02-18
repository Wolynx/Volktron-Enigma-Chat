/* =======================================================
   VOLKTRONIC CRYPTO ENGINE - MOBİL DOM OPTİMİZASYONU
   ======================================================= */

let db;
try {
    const firebaseConfig = { databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/" };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch(e) {
    console.error("Firebase Hatası: ", e);
}

let USER = ""; let ROOM = ""; let SECRET = ""; let SECURE_ROOM_PATH = ""; 
let roomMessagesRef;
let selectedImageBase64 = null; let selectedAudioBase64 = null;
let isRecording = false; let mediaRecorder; let audioChunks = [];
const encSel = new Set(); const decSel = new Set();
let firebaseListenersActive = false;

window.openModal = function(id) { document.getElementById(id).classList.add('active'); }
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); }

window.switchMobileTab = function(panelId, btnId) {
    if(window.innerWidth > 1024) return; 
    if (document.activeElement) document.activeElement.blur(); 

    document.querySelectorAll('.workspace-panel').forEach(p => p.classList.remove('active-tab'));
    document.getElementById(panelId).classList.add('active-tab');
    
    document.querySelectorAll('.m-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');

    if(panelId === 'chat-panel') {
        const scrollContainer = document.getElementById("chat-scroll-container");
        if(scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
};

function makeLayers(element, setObj) {
    if (!element) return;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer"; btn.innerHTML = `<span>${i < 10 ? '0'+i : i}</span>`;
        btn.onclick = function() { 
            if (setObj.has(i)) setObj.delete(i); else setObj.add(i); 
            this.classList.toggle("active"); 
        };
        element.appendChild(btn);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    makeLayers(document.getElementById("encLayers"), encSel);
    makeLayers(document.getElementById("decLayers"), decSel);
});

document.getElementById("imageInput").addEventListener("change", function(e) {
    const file = e.target.files[0]; const label = document.getElementById("imgLabel");
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { alert("Maksimum 1.5MB"); this.value = ""; return; }
    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result; selectedAudioBase64 = null; 
        label.innerHTML = "Görsel ✓"; label.classList.add("active-state");
    };
    reader.readAsDataURL(file);
});

document.getElementById("micBtn").addEventListener('click', async function() {
    const micBtn = this;
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream); audioChunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader(); reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    selectedAudioBase64 = reader.result; selectedImageBase64 = null; 
                    micBtn.innerHTML = "Ses ✓"; micBtn.classList.remove("recording"); micBtn.classList.add("active-state");
                };
            };
            mediaRecorder.start(); isRecording = true;
            micBtn.innerHTML = "Kaydediliyor..."; micBtn.classList.add("recording");
        } catch (err) { alert("Mikrofon izni alınamadı."); }
    } else { mediaRecorder.stop(); isRecording = false; }
});

let typingTimer;
document.getElementById("message").addEventListener("input", () => {
    if(!SECURE_ROOM_PATH || !USER || !db) return;
    db.ref("rooms/" + SECURE_ROOM_PATH + "/typing/" + USER).set(Date.now()); 
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => db.ref("rooms/" + SECURE_ROOM_PATH + "/typing/" + USER).remove(), 2000);
});

document.getElementById('btn-login-trigger').addEventListener('click', enterRoom);
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !document.getElementById('login').classList.contains('hidden')) enterRoom();
});

function enterRoom() {
    USER = document.getElementById("username").value.trim();
    ROOM = document.getElementById("room").value.trim();
    const PIN = document.getElementById("roomPin").value.trim();
    SECRET = document.getElementById("secretKey").value.trim();

    if (!USER || !ROOM || !SECRET || !PIN) { alert("Bağlantı reddedildi: Kutu bırakmayın."); return; }
    if (!db) { alert("Sistem veritabanı bağlantısı kuramıyor."); return; }

    const roomHash = CryptoJS.MD5(ROOM + "_" + PIN).toString();
    SECURE_ROOM_PATH = ROOM + "_" + roomHash.substring(0, 10);

    document.getElementById("userNameDisplay").textContent = USER;
    document.getElementById("roomNameDisplay").textContent = ROOM;

    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    if (!firebaseListenersActive) { startFirebaseListeners(); firebaseListenersActive = true; }
}

function startFirebaseListeners() {
    const myPresenceRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").push();
    myPresenceRef.set(USER); myPresenceRef.onDisconnect().remove();

    db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").on('value', (snap) => {
        document.getElementById('onlineCountDisplay').innerText = Object.keys(snap.val() || {}).length;
    });

    db.ref("rooms/" + SECURE_ROOM_PATH + "/typing").on('value', (snap) => {
        const data = snap.val() || {}; const activeWriters = Object.keys(data).filter(user => user !== USER);
        const indicator = document.getElementById("typing-indicator");
        if (activeWriters.length > 0) { indicator.textContent = `${activeWriters.join(", ")} yazıyor...`; indicator.style.opacity = "1"; } 
        else { indicator.style.opacity = "0"; }
    });

    roomMessagesRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/messages");
    
    roomMessagesRef.on('child_added', (snap) => {
        const data = snap.val() || {}; const msgKey = snap.key;
        const safeUser = data.user || "Bilinmeyen"; const safeText = data.text || "";
        const time = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

        // KASMAYI ÖNLEYEN KISIM BURASI: Veri 100 karakterden uzunsa ekranda kırp.
        let displayRawText = safeText;
        if (safeText.length > 100) {
            displayRawText = safeText.substring(0, 80) + "...<br><br><span style='color:var(--accent-primary); font-size:11px;'>[Büyük veri gizlendi - Kasmaması için optimize edildi]</span>";
        }

        const div = document.createElement("div"); div.id = "msg-" + msgKey; 
        div.className = "msg-box msg " + (safeUser === USER ? "me" : "other");
        
        div.innerHTML = `
            <div class="msg-header"><strong>${safeUser}</strong><span>${time}</span></div>
            <div class="raw-data mono-font">${displayRawText}</div>
            <div class="action-row">
                <button class="action-btn copy-btn">Kopyala</button>
                <button class="action-btn pass-btn">Aktar</button>
                <button class="action-btn solve inline-decrypt-btn">Şifreyi Çöz</button>
            </div>
            <div class="decrypted-view" style="display:none;"></div>
        `;

        // Kopyalama ve Çözme işlemlerinde kırpılmış metni değil, ASIL VERİYİ (safeText) kullanıyoruz.
        div.querySelector(".copy-btn").onclick = () => navigator.clipboard.writeText(safeText);
        
        div.querySelector(".pass-btn").onclick = () => {
            document.getElementById('cipher').value = safeText;
            if(window.innerWidth<=1024) document.querySelector('.m-nav-btn[data-target="decoder-panel"]').click();
        };

        div.querySelector(".inline-decrypt-btn").onclick = () => {
            const decrypted = removeStrongLayers(safeText, SECRET, decSel);
            const view = div.querySelector(".decrypted-view"); const raw = div.querySelector(".raw-data"); const actions = div.querySelector(".action-row");

            if (decrypted.includes("HATA:")) { alert("Hata: Anahtar veya katman yanlış."); } 
            else {
                let htmlContent = "";
                if (decrypted.startsWith("IMG||")) {
                    const parts = decrypted.split("||"); 
                    htmlContent = `<img src="${parts[1]}" style="max-width:100%; max-height:280px; object-fit:contain; border-radius:8px; margin-bottom:12px; display:block;"><div>${parts[2] || ""}</div>`;
                } else if (decrypted.startsWith("AUDIO||")) {
                    const parts = decrypted.split("||");
                    htmlContent = `<audio controls src="${parts[1]}" style="height:35px; width:100%; margin-bottom:10px;"></audio><div>${parts[2] || ""}</div>`;
                } else if (decrypted.startsWith("TXT||")) { htmlContent = decrypted.replace("TXT||", ""); } 
                else { htmlContent = decrypted; }

                view.innerHTML = htmlContent; view.style.display = "block"; raw.style.display = "none"; actions.style.display = "none";
                if (data.burn && data.burn > 0) startBurnTimer(data.burn, msgKey, div);
            }
        };

        document.getElementById("log").appendChild(div);
        
        const scrollContainer = document.getElementById("chat-scroll-container");
        if(scrollContainer) {
            // Tarayıcıya nefes alması için ufak bir mola verip kaydırıyoruz
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 100);
        }
    });

    roomMessagesRef.on('child_removed', (snap) => {
        const el = document.getElementById("msg-" + snap.key);
        if (el) { el.innerHTML = `<div style="text-align:center; font-size:12px; color:gray; padding:10px;">Mesaj imha edildi.</div>`; setTimeout(() => el.remove(), 2000); }
    });
}

function startBurnTimer(seconds, msgKey, element) {
    let timeLeft = seconds; const timerDisplay = document.createElement("div");
    timerDisplay.style.color = "var(--danger)"; timerDisplay.style.fontSize = "12px"; timerDisplay.style.fontWeight = "600"; timerDisplay.style.marginTop = "10px"; timerDisplay.style.textAlign = "right";
    element.appendChild(timerDisplay);
    const interval = setInterval(() => {
        timerDisplay.innerHTML = `Siliniyor: ${timeLeft}s`; timeLeft--;
        if (timeLeft < 0) { clearInterval(interval); db.ref("rooms/" + SECURE_ROOM_PATH + "/messages/" + msgKey).remove(); }
    }, 1000);
}

function applyStrongLayers(text, secret, selectedLayers) {
    let encrypted = text; let layers = [...selectedLayers].sort((a, b) => a - b);
    if (layers.length === 0) return CryptoJS.AES.encrypt(encrypted, secret).toString();
    layers.forEach(layer => { encrypted = CryptoJS.AES.encrypt(encrypted, secret + "_Salt_L" + layer).toString(); });
    return encrypted;
}

function removeStrongLayers(ciphertext, secret, selectedLayers) {
    let decrypted = ciphertext; let layers = [...selectedLayers].sort((a, b) => b - a);
    try {
        if (layers.length === 0) {
            let bytes = CryptoJS.AES.decrypt(decrypted, secret);
            let result = bytes.toString(CryptoJS.enc.Utf8); if (!result) throw new Error(); return result;
        }
        layers.forEach(layer => {
            let bytes = CryptoJS.AES.decrypt(decrypted, secret + "_Salt_L" + layer);
            decrypted = bytes.toString(CryptoJS.enc.Utf8); if (!decrypted) throw new Error();
        });
        return decrypted;
    } catch (error) { return "HATA:"; }
}

document.getElementById('btn-send-trigger').addEventListener('click', () => {
    const msgInput = document.getElementById("message"); const burnTime = parseInt(document.getElementById("burnTimer").value); const textVal = msgInput.value.trim();
    if (!textVal && !selectedImageBase64 && !selectedAudioBase64) { alert("Veri girin."); return; }

    let payload = "";
    if (selectedAudioBase64) payload = "AUDIO||" + selectedAudioBase64 + "||" + textVal;
    else if (selectedImageBase64) payload = "IMG||" + selectedImageBase64 + "||" + textVal;
    else payload = "TXT||" + textVal;

    const encryptedPayload = applyStrongLayers(payload, SECRET, encSel);
    roomMessagesRef.push({ user: USER, text: encryptedPayload, time: Date.now(), burn: burnTime });

    msgInput.value = ""; selectedImageBase64 = null; selectedAudioBase64 = null;
    document.getElementById("imgLabel").innerHTML = "🖼️ Dosya"; document.getElementById("imgLabel").classList.remove("active-state");
    document.getElementById("micBtn").innerHTML = "🎤 Ses"; document.getElementById("micBtn").classList.remove("active-state");

    if(window.innerWidth <= 1024) document.querySelector('.m-nav-btn[data-target="chat-panel"]').click();
});

document.getElementById('btn-decrypt-trigger').addEventListener('click', () => {
    const cipherText = document.getElementById("cipher").value.trim(); const resultDiv = document.getElementById("result");
    if (!cipherText) { resultDiv.textContent = "RAW verisi bekleniyor..."; return; }
    const plainText = removeStrongLayers(cipherText, SECRET, decSel);

    if (plainText.includes("HATA:")) { resultDiv.innerHTML = "Hata: Anahtar veya katman yanlış."; resultDiv.style.color = "var(--danger)"; } 
    else {
        let cleanText = plainText;
        if (cleanText.startsWith("IMG||")) cleanText = "[Görsel formattır - Ağ Akışı panelinden çözünüz]";
        else if (cleanText.startsWith("AUDIO||")) cleanText = "[Ses formattır - Ağ Akışı panelinden çözünüz]";
        else if (cleanText.startsWith("TXT||")) cleanText = cleanText.replace("TXT||", "");
        resultDiv.textContent = cleanText; resultDiv.style.color = "var(--accent-primary)";
    }
});

document.getElementById('btn-panic-trigger').addEventListener('click', async () => {
    if (confirm("Veritabanı silinecek. Emin misiniz?")) {
        try {
            if(db) await db.ref("rooms/" + SECURE_ROOM_PATH).remove();
            document.body.innerHTML = `<h3 style="color:red; text-align:center; margin-top:50vh;">Sistem İmha Edildi.</h3>`;
            setTimeout(() => location.reload(), 2000);
        } catch (e) { alert("Hata."); }
    }
});
