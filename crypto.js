/* =======================================================
   VOLKTRONIC CRYPTO ENGINE v4.0 - ENTERPRISE EDITION
   ======================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, push, set, remove, onChildAdded, onChildRemoved, onValue 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// GLOBAL DEĞİŞKENLER
let USER = "";
let ROOM = "";
let SECRET = "";
let SECURE_ROOM_PATH = ""; // PIN ile şifrelenmiş özel oda yolu
let roomMessagesRef;

let selectedImageBase64 = null; 
let selectedAudioBase64 = null;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

const encSel = new Set();
const decSel = new Set();

// --- 1. KATMAN OLUŞTURUCU ---
function makeLayers(element, setObj) {
    if (!element) return;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer";
        btn.innerHTML = i < 10 ? `0${i}` : i;
        
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


// --- 2. GÖRSEL DOSYASI OKUMA ---
document.getElementById("imageInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    const label = document.getElementById("imgLabel");
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
        alert("SİSTEM UYARISI: Maksimum 1.5MB yükleyebilirsiniz.");
        this.value = ""; return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        selectedAudioBase64 = null; // Sesi sıfırla çakışmasın
        label.textContent = "✅ Fotoğraf Hazır";
        label.style.borderColor = "var(--accent-green)";
        label.style.color = "var(--accent-green)";
    };
    reader.readAsDataURL(file);
});


// --- 3. SES KAYIT (AUDIO CRYPTO) MOTORU ---
async function toggleAudioRecord() {
    const micBtn = document.getElementById("micBtn");
    
    if (!isRecording) {
        // Kayda Başla
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    selectedAudioBase64 = reader.result;
                    selectedImageBase64 = null; // Resmi sıfırla
                    micBtn.textContent = "✅ Ses Hazır";
                    micBtn.classList.remove("active-recording");
                    micBtn.style.borderColor = "var(--accent-blue)";
                    micBtn.style.color = "var(--accent-blue)";
                };
            };
            
            mediaRecorder.start();
            isRecording = true;
            micBtn.textContent = "⏹️ Kaydı Bitir";
            micBtn.classList.add("active-recording");
            
        } catch (err) {
            alert("Mikrofon izni reddedildi veya donanım bulunamadı.");
        }
    } else {
        // Kaydı Durdur
        mediaRecorder.stop();
        isRecording = false;
    }
}
window.toggleAudioRecord = toggleAudioRecord; // HTML'den erişim


// --- 4. YAZIYOR SENSÖRÜ ---
let typingTimer;
document.getElementById("message").addEventListener("input", () => {
    if(!SECURE_ROOM_PATH || !USER) return;
    const typingRef = ref(db, "rooms/" + SECURE_ROOM_PATH + "/typing/" + USER);
    set(typingRef, Date.now()); 
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => remove(typingRef), 2000);
});


// --- 5. ODAYA GİRİŞ (PIN KODU GÜVENLİĞİ İLE) ---
function enterRoom() {
    USER = document.getElementById("username").value.trim();
    ROOM = document.getElementById("room").value.trim();
    const PIN = document.getElementById("roomPin").value.trim();
    SECRET = document.getElementById("secretKey").value.trim();

    if (!USER || !ROOM || !SECRET || !PIN) {
        alert("ERİŞİM REDDEDİLDİ: Lütfen PIN kodu dahil tüm bilgileri doldurun.");
        return;
    }

    // YENİ GÜVENLİK: Oda Adı + PIN birleşip MD5 ile şifreleniyor.
    // Böylece PIN bilmeyen biri asla aynı Firebase klasörüne bağlanamıyor.
    const roomHash = CryptoJS.MD5(ROOM + "_" + PIN).toString();
    SECURE_ROOM_PATH = ROOM + "_" + roomHash.substring(0, 10);

    document.getElementById("userNameDisplay").textContent = USER;
    document.getElementById("roomNameDisplay").textContent = ROOM;

    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    startFirebaseListeners();
}


// --- 6. FIREBASE DİNLEYİCİLERİ ---
function startFirebaseListeners() {
    const typingListRef = ref(db, "rooms/" + SECURE_ROOM_PATH + "/typing");
    onValue(typingListRef, (snap) => {
        const data = snap.val() || {};
        const activeWriters = Object.keys(data).filter(user => user !== USER);
        const indicator = document.getElementById("typing-indicator");
        if (activeWriters.length > 0) {
            indicator.textContent = `⚡ ${activeWriters.join(", ")} veri işliyor...`;
            indicator.style.opacity = "1";
        } else {
            indicator.style.opacity = "0";
        }
    });

    roomMessagesRef = ref(db, "rooms/" + SECURE_ROOM_PATH + "/messages");
    
    onChildAdded(roomMessagesRef, (snap) => {
        const data = snap.val() || {};
        const msgKey = snap.key;
        
        const safeUser = data.user || "BİLİNMEYEN";
        const safeText = data.text || "";
        const time = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

        const div = document.createElement("div");
        div.id = "msg-" + msgKey; 
        div.className = "msg-box msg " + (safeUser === USER ? "me" : "other");
        
        div.innerHTML = `
            <div class="msg-header">
                <strong>${safeUser}</strong>
                <span>${time}</span>
            </div>
            
            <div class="raw-data">${safeText}</div>
            
            <div class="action-row">
                <button class="action-btn" onclick="navigator.clipboard.writeText('${safeText}')">Kopyala</button>
                <button class="action-btn" onclick="document.getElementById('cipher').value='${safeText}'">Aktar</button>
                <button class="action-btn solve inline-decrypt-btn">Şifreyi Çöz</button>
            </div>
            <div class="decrypted-view" style="display:none;"></div>
        `;

        const decryptBtn = div.querySelector(".inline-decrypt-btn");
        decryptBtn.onclick = () => {
            const decrypted = removeStrongLayers(safeText, SECRET, decSel);
            const view = div.querySelector(".decrypted-view");
            const raw = div.querySelector(".raw-data");
            const actions = div.querySelector(".action-row");

            if (typeof decrypted === "string" && decrypted.includes("HATA:")) {
                alert("ÇÖZÜM BAŞARISIZ! Doğru katmanları seçtiğinizden emin olun.");
            } else {
                let htmlContent = "";
                
                // MEDYA PROTOKOLLERİ
                if (decrypted.startsWith("IMG||")) {
                    const parts = decrypted.split("||"); 
                    htmlContent = `<img src="${parts[1]}" style="max-width:100%; border-radius:8px; margin-bottom:8px;"><br>${parts[2] || ""}`;
                } 
                else if (decrypted.startsWith("AUDIO||")) {
                    const parts = decrypted.split("||");
                    htmlContent = `
                        <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:8px; display:flex; align-items:center; gap:10px;">
                            <span>🎵 Kripto Ses:</span>
                            <audio controls src="${parts[1]}" style="height:30px; outline:none;"></audio>
                        </div>
                        <div style="margin-top:8px">${parts[2] || ""}</div>
                    `;
                }
                else if (decrypted.startsWith("TXT||")) {
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

        const logDiv = document.getElementById("log");
        logDiv.appendChild(div);
        logDiv.scrollTop = logDiv.scrollHeight; 
    });

    onChildRemoved(roomMessagesRef, (snap) => {
        const el = document.getElementById("msg-" + snap.key);
        if (el) {
            el.innerHTML = `<div style="color:var(--accent-red); text-align:center; font-size:12px; font-weight:600;">[ VERİ KALICI OLARAK İMHA EDİLDİ ]</div>`;
            setTimeout(() => el.remove(), 1500);
        }
    });
}


// --- 7. İMHA SAYACI ---
function startBurnTimer(seconds, msgKey, element) {
    let timeLeft = seconds;
    const timerDisplay = document.createElement("div");
    timerDisplay.style.color = "var(--accent-red)";
    timerDisplay.style.fontSize = "11px";
    timerDisplay.style.fontWeight = "600";
    timerDisplay.style.marginTop = "12px";
    timerDisplay.style.textAlign = "right";
    
    element.appendChild(timerDisplay);

    const interval = setInterval(() => {
        timerDisplay.innerHTML = `⚠️ Sistemden siliniyor: 00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            remove(ref(db, "rooms/" + SECURE_ROOM_PATH + "/messages/" + msgKey));
        }
    }, 1000);
}


// --- 8. ŞİFRELEME MATEMATİĞİ ---
function applyStrongLayers(text, secret, selectedLayers) {
    let encrypted = text;
    let layers = [...selectedLayers].sort((a, b) => a - b);
    if (layers.length === 0) return CryptoJS.AES.encrypt(encrypted, secret).toString();

    layers.forEach(layer => {
        let layerSpecificKey = secret + "_Salt_L" + layer;
        encrypted = CryptoJS.AES.encrypt(encrypted, layerSpecificKey).toString();
    });
    return encrypted;
}


// --- 9. ŞİFRE ÇÖZME ---
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
            let layerSpecificKey = secret + "_Salt_L" + layer;
            let bytes = CryptoJS.AES.decrypt(decrypted, layerSpecificKey);
            decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error();
        });
        return decrypted;
    } catch (error) {
        return "HATA: Çözülemedi";
    }
}


// --- 10. GÖNDERME ---
function encryptAndSend() {
    const msgInput = document.getElementById("message");
    const burnTime = parseInt(document.getElementById("burnTimer").value);
    const textVal = msgInput.value.trim();

    if (!textVal && !selectedImageBase64 && !selectedAudioBase64) {
        alert("Lütfen metin, fotoğraf veya ses ekleyin."); return;
    }

    let payload = "";
    if (selectedAudioBase64) payload = "AUDIO||" + selectedAudioBase64 + "||" + textVal;
    else if (selectedImageBase64) payload = "IMG||" + selectedImageBase64 + "||" + textVal;
    else payload = "TXT||" + textVal;

    const encryptedPayload = applyStrongLayers(payload, SECRET, encSel);

    push(roomMessagesRef, { user: USER, text: encryptedPayload, time: Date.now(), burn: burnTime });

    // Temizlik
    msgInput.value = "";
    selectedImageBase64 = null;
    selectedAudioBase64 = null;
    
    const imgLbl = document.getElementById("imgLabel");
    imgLbl.textContent = "🖼️ Fotoğraf"; imgLbl.style = "";
    const micBtn = document.getElementById("micBtn");
    micBtn.textContent = "🎤 Ses Kaydet"; micBtn.style = "";
}


// --- 11. HARİCİ ÇÖZÜCÜ ---
function decryptExternal() {
    const cipherText = document.getElementById("cipher").value.trim();
    const resultDiv = document.getElementById("result");

    if (!cipherText) { resultDiv.textContent = "RAW kodunu yapıştırın."; return; }

    const plainText = removeStrongLayers(cipherText, SECRET, decSel);

    if (plainText.includes("HATA:")) {
        resultDiv.textContent = "BAŞARISIZ: Katman veya Şifre hatası.";
        resultDiv.style.color = "var(--accent-red)";
        resultDiv.style.borderColor = "var(--accent-red)";
    } else {
        let cleanText = plainText;
        if (cleanText.startsWith("IMG||")) cleanText = "[GÖRSEL BULUNUYOR - Ana ekrandan çözün]";
        else if (cleanText.startsWith("AUDIO||")) cleanText = "[SES KAYDI BULUNUYOR - Ana ekrandan çözün]";
        else if (cleanText.startsWith("TXT||")) cleanText = cleanText.replace("TXT||", "");
        
        resultDiv.textContent = cleanText;
        resultDiv.style.color = "var(--accent-green)";
        resultDiv.style.borderColor = "var(--accent-green)";
    }
}


// --- 12. PANİK PROTOKOLÜ ---
async function triggerPanic() {
    if (confirm("DİKKAT! Odayı kalıcı olarak silmek istediğinize emin misiniz?")) {
        try {
            await remove(ref(db, "rooms/" + SECURE_ROOM_PATH));
            document.body.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#000; color:red; flex-direction:column; font-family:Space Grotesk;"><h1>SİSTEM İMHA EDİLDİ</h1></div>`;
            setTimeout(() => location.reload(), 3000);
        } catch (e) {
            alert("Bağlantı hatası.");
        }
    }
}

window.enterRoom = enterRoom;
window.encryptAndSend = encryptAndSend;
window.decryptExternal = decryptExternal;
window.triggerPanic = triggerPanic;
