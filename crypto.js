/* =======================================================
   VOLKTRONIC CRYPTO ENGINE - ASYNC & FIREBASE V10
   ======================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set, 
    remove, 
    onChildAdded, 
    onChildRemoved, 
    onValue 
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
let roomMessagesRef;
let selectedImageBase64 = null; 

// Katmanları Tutan Kümeler
const encSel = new Set();
const decSel = new Set();

// --- 1. KATMAN (LAYER) OLUŞTURUCU ---
function makeLayers(element, setObj) {
    if (!element) return;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer";
        btn.innerHTML = `L-${i < 10 ? '0' + i : i}`;
        
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


// --- 2. GÖRSEL DOSYASI OKUMA (BASE64) ---
document.getElementById("imageInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    const btn = document.querySelector(".file-upload-label");
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
        alert("UYARI: Maksimum 1.5MB yükleyebilirsiniz.");
        this.value = ""; return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        btn.textContent = "✅ GÖRSEL HAZIR";
        btn.style.background = "var(--neon-blue)";
        btn.style.color = "#000";
    };
    reader.readAsDataURL(file);
});


// --- 3. YAZIYOR SENSÖRÜ ---
let typingTimer;
document.getElementById("message").addEventListener("input", () => {
    if(!ROOM || !USER) return;
    const typingRef = ref(db, "rooms/" + ROOM + "/typing/" + USER);
    set(typingRef, Date.now()); 
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => remove(typingRef), 2000);
});


// --- 4. ODAYA GİRİŞ ---
function enterRoom() {
    USER = document.getElementById("username").value.trim();
    ROOM = document.getElementById("room").value.trim();
    SECRET = document.getElementById("secretKey").value.trim();

    if (!USER || !ROOM || !SECRET) {
        alert("Lütfen tüm alanları (Kullanıcı Adı, Oda ve Şifreli Kod) doldurun.");
        return;
    }

    document.getElementById("userNameDisplay").textContent = USER;
    document.getElementById("roomNameDisplay").textContent = ROOM;

    const loginDiv = document.getElementById("login");
    const chatDiv = document.getElementById("chat");

    loginDiv.style.opacity = "0";
    loginDiv.style.transform = "scale(0.9)";
    setTimeout(() => {
        loginDiv.classList.add("hidden");
        chatDiv.classList.remove("hidden");
    }, 500);

    startFirebaseListeners();
}


// --- 5. FIREBASE MESAJ DİNLEYİCİSİ ---
function startFirebaseListeners() {
    // Yazıyor kısmı dinleyicisi
    const typingListRef = ref(db, "rooms/" + ROOM + "/typing");
    onValue(typingListRef, (snap) => {
        const data = snap.val() || {};
        const activeWriters = Object.keys(data).filter(user => user !== USER);
        const indicator = document.getElementById("typing-indicator");
        if (activeWriters.length > 0) {
            indicator.textContent = `⚡ Ajan ${activeWriters.join(", ")} veri şifreliyor...`;
            indicator.style.opacity = "1";
        } else {
            indicator.style.opacity = "0";
        }
    });

    // MESAJLAR
    roomMessagesRef = ref(db, "rooms/" + ROOM + "/messages");
    
    onChildAdded(roomMessagesRef, (snap) => {
        const data = snap.val() || {};
        const msgKey = snap.key;
        
        const safeUser = data.user || "BİLİNMEYEN";
        const safeText = data.text || "HATA_VERI_YOK";
        const time = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

        const div = document.createElement("div");
        div.id = "msg-" + msgKey; 
        div.className = "msg " + (safeUser === USER ? "me" : "other");
        
        div.innerHTML = `
            <div class="msg-header">
                <b>[${safeUser}]</b> 
                <span>${time}</span>
            </div>
            
            <div class="msg-content">
                <textarea readonly class="raw-cipher-box">${safeText}</textarea>
                
                <div class="msg-action-row">
                    <button class="action-btn btn-copy">📋 KOPYALA</button>
                    <button class="action-btn btn-transfer">➡️ SAĞ PANELE AKTAR</button>
                    <button class="action-btn btn-decrypt">🔓 DİREKT ÇÖZ</button>
                </div>

                <div class="decrypted-content" style="display:none;"></div>
            </div>
        `;

        // BUTON 1: KOPYALA İŞLEMİ
        const copyBtn = div.querySelector(".btn-copy");
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(safeText).then(() => {
                copyBtn.textContent = "✅ KOPYALANDI";
                copyBtn.style.background = "#fff";
                copyBtn.style.color = "#000";
                setTimeout(() => {
                    copyBtn.textContent = "📋 KOPYALA";
                    copyBtn.style.background = "";
                    copyBtn.style.color = "";
                }, 1500);
            }).catch(() => alert("Kopyalama başarısız, metni manuel seçin."));
        };

        // BUTON 2: SAĞ PANELE AKTAR İŞLEMİ
        const transferBtn = div.querySelector(".btn-transfer");
        transferBtn.onclick = () => {
            const rightPanelCipher = document.getElementById("cipher");
            rightPanelCipher.value = safeText;
            
            rightPanelCipher.style.boxShadow = "0 0 20px var(--neon-blue)";
            setTimeout(() => { rightPanelCipher.style.boxShadow = "none"; }, 1000);
            
            transferBtn.textContent = "✅ AKTARILDI";
            setTimeout(() => { transferBtn.textContent = "➡️ SAĞ PANELE AKTAR"; }, 1500);
        };

        // BUTON 3: DİREKT ÇÖZ (INLINE DECRYPT)
        const decryptBtn = div.querySelector(".btn-decrypt");
        decryptBtn.onclick = () => {
            const decrypted = removeStrongLayers(safeText, SECRET, decSel);
            const contentDiv = div.querySelector(".decrypted-content");
            const rawBox = div.querySelector(".raw-cipher-box");
            const actionRow = div.querySelector(".msg-action-row");

            if (typeof decrypted === "string" && decrypted.includes("HATA:")) {
                alert("ŞİFRE ÇÖZÜLEMEDİ!\n\nSağ paneldeki 'Harici Çözücü' bölümünden gönderenle AYNI KATMANLARI seçtiğinize emin olun.");
            } else {
                let htmlContent = "";
                if (decrypted.startsWith("IMG||")) {
                    const parts = decrypted.split("||"); 
                    htmlContent = `<img src="${parts[1]}" style="max-width:100%; border-radius:8px; margin-bottom:10px;"><br><div>${parts[2] || ""}</div>`;
                } else if (decrypted.startsWith("TXT||")) {
                    htmlContent = decrypted.replace("TXT||", "");
                } else {
                    htmlContent = decrypted;
                }

                contentDiv.innerHTML = htmlContent;
                contentDiv.style.display = "block";
                
                rawBox.style.display = "none";
                actionRow.style.display = "none";

                if (data.burn && data.burn > 0) {
                    startBurnTimer(data.burn, msgKey, div);
                }
            }
        };

        const logDiv = document.getElementById("log");
        logDiv.appendChild(div);
        logDiv.scrollTop = logDiv.scrollHeight; 
    });

    onChildRemoved(roomMessagesRef, (snap) => {
        const el = document.getElementById("msg-" + snap.key);
        if (el) {
            el.innerHTML = `<div style="color:red; text-align:center; font-weight:bold; padding:10px; border:1px solid red; border-radius:8px;">🚫 SİSTEM: VERİ İMHA EDİLDİ</div>`;
            setTimeout(() => el.remove(), 2000);
        }
    });
}


// --- 6. İMHA SAYACI (BURN TIMER) ---
function startBurnTimer(seconds, msgKey, element) {
    let timeLeft = seconds;
    const timerDisplay = document.createElement("div");
    timerDisplay.style.color = "var(--neon-pink)";
    timerDisplay.style.fontWeight = "bold";
    timerDisplay.style.fontSize = "13px";
    timerDisplay.style.marginTop = "15px";
    timerDisplay.style.textAlign = "right";
    
    element.appendChild(timerDisplay);

    const interval = setInterval(() => {
        timerDisplay.innerHTML = `🔥 KENDİNİ İMHA EDİYOR: ${timeLeft}sn`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            remove(ref(db, "rooms/" + ROOM + "/messages/" + msgKey));
        }
    }, 1000);
}


// --- 7. ŞİFRELEME (AES + LAYER) ---
function applyStrongLayers(text, secret, selectedLayers) {
    let encrypted = text;
    let layers = [...selectedLayers].sort((a, b) => a - b);
    if (layers.length === 0) return CryptoJS.AES.encrypt(encrypted, secret).toString();

    layers.forEach(layer => {
        let layerSpecificKey = secret + "_LayerSalt_L" + layer;
        encrypted = CryptoJS.AES.encrypt(encrypted, layerSpecificKey).toString();
    });
    return encrypted;
}


// --- 8. ŞİFRE ÇÖZME ---
function removeStrongLayers(ciphertext, secret, selectedLayers) {
    let decrypted = ciphertext;
    let layers = [...selectedLayers].sort((a, b) => b - a);
    
    try {
        if (layers.length === 0) {
            let bytes = CryptoJS.AES.decrypt(decrypted, secret);
            let result = bytes.toString(CryptoJS.enc.Utf8);
            if (!result) throw new Error();
            return result;
        }

        layers.forEach(layer => {
            let layerSpecificKey = secret + "_LayerSalt_L" + layer;
            let bytes = CryptoJS.AES.decrypt(decrypted, layerSpecificKey);
            decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error();
        });
        return decrypted;
    } catch (error) {
        return "HATA: Çözülemedi";
    }
}


// --- 9. MESAJ GÖNDERME ---
function encryptAndSend() {
    const msgInput = document.getElementById("message");
    const burnSelect = document.getElementById("burnTimer");
    const textVal = msgInput.value.trim();
    const burnTime = parseInt(burnSelect.value);

    if (!textVal && !selectedImageBase64) {
        alert("Lütfen gönderilecek bir mesaj veya resim ekleyin.");
        return;
    }

    let payload = selectedImageBase64 ? "IMG||" + selectedImageBase64 + "||" + textVal : "TXT||" + textVal;
    const encryptedPayload = applyStrongLayers(payload, SECRET, encSel);

    push(roomMessagesRef, {
        user: USER,
        text: encryptedPayload,
        time: Date.now(),
        burn: burnTime 
    });

    msgInput.value = "";
    selectedImageBase64 = null;
    const btn = document.querySelector(".file-upload-label");
    btn.textContent = "📷 FOTOĞRAF";
    btn.style.background = ""; btn.style.color = "";
}


// --- 10. HARİCİ MANUEL ÇÖZÜCÜ ---
function decryptExternal() {
    const cipherText = document.getElementById("cipher").value.trim();
    const resultDiv = document.getElementById("result");

    if (!cipherText) {
        resultDiv.textContent = "Lütfen çözülecek RAW kodunu yukarıya yapıştırın.";
        resultDiv.style.color = "var(--neon-pink)";
        return;
    }

    const plainText = removeStrongLayers(cipherText, SECRET, decSel);

    if (plainText.includes("HATA:")) {
        resultDiv.innerHTML = "<b>BAŞARISIZ!</b><br>Gizli şifre veya seçilen Katmanlar (L-01, L-02 vb.) gönderenle eşleşmiyor.";
        resultDiv.style.color = "var(--neon-red)";
        resultDiv.style.borderColor = "var(--neon-red)";
    } else {
        let cleanText = plainText;
        if (cleanText.startsWith("IMG||")) cleanText = "[BU BİR GÖRSELDİR - Lütfen mesajın altındaki DİREKT ÇÖZ butonunu kullanın]";
        if (cleanText.startsWith("TXT||")) cleanText = cleanText.replace("TXT||", "");
        
        resultDiv.textContent = cleanText;
        resultDiv.style.color = "var(--neon-green)";
        resultDiv.style.borderColor = "var(--neon-green)";
    }
}


// --- 11. PANİK BUTONU (ASYNC PROTOKOLÜ) ---
async function triggerPanic() {
    const confirmPanic = confirm("⚠️ DİKKAT!\n\nBu işlem odadaki TÜM MESAJLARI kalıcı olarak silecektir. Geri dönüşü yoktur.\n\nOnaylıyor musun?");
    
    if (confirmPanic) {
        try {
            await remove(ref(db, "rooms/" + ROOM));
            
            document.body.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:black; color:red; flex-direction:column;">
                    <h1 style="font-family:Orbitron; font-size:50px;">SİSTEM İMHA EDİLDİ</h1>
                    <p>Tüm veriler temizlendi. Bağlantı kesiliyor...</p>
                </div>
            `;
            
            setTimeout(() => { location.reload(); }, 3000);
            
        } catch (error) {
            console.error("Hata:", error);
            alert("Silme işlemi başarısız oldu! İnternet bağlantınızı kontrol edin.");
        }
    }
}

window.enterRoom = enterRoom;
window.encryptAndSend = encryptAndSend;
window.decryptExternal = decryptExternal;
window.triggerPanic = triggerPanic;
