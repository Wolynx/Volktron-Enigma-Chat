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

// LÜTFEN KENDİ FIREBASE BİLGİLERİNİ KONTROL ET
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

// Katmanları (Layer) Tutan Küme Yapıları
const encSel = new Set();
const decSel = new Set();

// --- 1. KATMAN (LAYER) BUTONLARINI OLUŞTURMA ---
function makeLayers(element, setObj) {
    if (!element) return;
    
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer";
        const label = i < 10 ? '0' + i : i;
        btn.innerHTML = `L-${label}`;
        
        btn.onclick = () => {
            if (setObj.has(i)) {
                setObj.delete(i);
            } else {
                setObj.add(i);
            }
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

    // Maksimum 1.5MB limiti (Firebase'i yormamak için)
    if (file.size > 1.5 * 1024 * 1024) {
        alert("GÜVENLİK UYARISI: Dosya boyutu çok büyük! Maksimum 1.5MB yükleyebilirsiniz.");
        this.value = ""; 
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        btn.textContent = "✅ GÖRSEL HAZIR";
        btn.style.background = "var(--neon-blue)";
        btn.style.color = "#000";
    };
    
    reader.onerror = function() {
        alert("Dosya okuma hatası!");
    };

    reader.readAsDataURL(file);
});


// --- 3. YAZIYOR (TYPING) SENSÖRÜ ---
let typingTimer;
document.getElementById("message").addEventListener("input", () => {
    if(!ROOM || !USER) return;
    
    const typingRef = ref(db, "rooms/" + ROOM + "/typing/" + USER);
    set(typingRef, Date.now()); 
    
    // 2 saniye klavyeye dokunulmazsa "yazıyor" bilgisini sil
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        remove(typingRef);
    }, 2000);
});


// --- 4. ODAYA GİRİŞ İŞLEMİ ---
function enterRoom() {
    USER = document.getElementById("username").value.trim();
    ROOM = document.getElementById("room").value.trim();
    SECRET = document.getElementById("secretKey").value.trim();

    if (!USER || !ROOM || !SECRET) {
        alert("ERİŞİM REDDEDİLDİ: Lütfen tüm kimlik bilgilerini eksiksiz girin.");
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


// --- 5. FIREBASE DİNLEYİCİLERİ ---
function startFirebaseListeners() {
    
    // YAZIYOR DİNLEYİCİSİ
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

    // MESAJ (VERİ) AKIŞI DİNLEYİCİSİ
    roomMessagesRef = ref(db, "rooms/" + ROOM + "/messages");
    
    onChildAdded(roomMessagesRef, (snap) => {
        const data = snap.val() || {};
        const msgKey = snap.key;
        
        // Hatalı/Eksik paketleri korumak için güvenlik önlemi
        const safeUser = data.user || "BİLİNMEYEN_AJAN";
        const safeText = data.text || "HATA_VERI_YOK";
        const time = data.time ? new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";

        const div = document.createElement("div");
        div.id = "msg-" + msgKey; 
        div.className = "msg " + (safeUser === USER ? "me" : "other");
        
        // Gelen mesaj ekrana daima ŞİFRELİ düşer
        div.innerHTML = `
            <div class="msg-header">
                <b>[${safeUser}]</b> 
                <span>${time}</span>
            </div>
            
            <div class="msg-content">
                <div class="encrypted-placeholder" style="color:#666; font-size:12px; letter-spacing:1px;">
                    🔒 [AES-256 ŞİFRELİ VERİ PAKETİ] <br>
                    ${safeText.substring(0, 40)}...
                </div>
                <div class="decrypted-content" style="display:none;"></div>
            </div>

            <button class="decrypt-btn-inline">🔐 ÇÖZ VE GÖSTER</button>
        `;

        // INLINE ÇÖZME BUTONUNA TIKLANINCA
        const btn = div.querySelector(".decrypt-btn-inline");
        btn.onclick = () => {
            
            // DİKKAT: Cihazlar arası uyum için gelen mesaj "decSel" (Sağdaki Çözücü) katmanları referans alınarak çözülür.
            const decrypted = removeStrongLayers(safeText, SECRET, decSel);
            const contentDiv = div.querySelector(".decrypted-content");
            const placeholder = div.querySelector(".encrypted-placeholder");

            if (typeof decrypted === "string" && decrypted.includes("HATA:")) {
                placeholder.innerHTML = `<span style="color:red">⚠️ ŞİFRE ÇÖZME BAŞARISIZ! <br> Anahtar veya katmanlar yanlış.</span>`;
            } else {
                let htmlContent = "";
                
                // Protokol Kontrolü (IMG vs TXT)
                if (decrypted.startsWith("IMG||")) {
                    const parts = decrypted.split("||"); 
                    htmlContent = `
                        <img src="${parts[1]}" style="max-width:100%; border-radius:8px; border:1px solid var(--neon-blue); margin-bottom:10px;">
                        <div>${parts[2] || ""}</div>
                    `;
                } else if (decrypted.startsWith("TXT||")) {
                    htmlContent = decrypted.replace("TXT||", "");
                } else {
                    htmlContent = decrypted; // Geriye dönük uyumluluk
                }

                contentDiv.innerHTML = htmlContent;
                contentDiv.style.display = "block";
                placeholder.style.display = "none";
                btn.style.display = "none"; 

                // Kendini İmha Sistemi
                if (data.burn && data.burn > 0) {
                    startBurnTimer(data.burn, msgKey, div);
                }
            }
        };

        const logDiv = document.getElementById("log");
        logDiv.appendChild(div);
        logDiv.scrollTop = logDiv.scrollHeight; 
    });

    // MESAJ SİLİNDİĞİNDE (Kalıcı Yok Etme)
    onChildRemoved(roomMessagesRef, (snap) => {
        const el = document.getElementById("msg-" + snap.key);
        if (el) {
            el.innerHTML = `
                <div style="color:red; text-align:center; font-weight:bold; padding:10px;">
                    🚫 VERİ İMHA EDİLDİ
                </div>
            `;
            setTimeout(() => el.remove(), 1500);
        }
    });
}


// --- 6. KENDİNİ İMHA (BURN) SAYACI ---
function startBurnTimer(seconds, msgKey, element) {
    let timeLeft = seconds;
    
    const timerDisplay = document.createElement("div");
    timerDisplay.style.color = "var(--neon-pink)";
    timerDisplay.style.fontWeight = "bold";
    timerDisplay.style.fontSize = "12px";
    timerDisplay.style.marginTop = "10px";
    timerDisplay.style.textAlign = "right";
    timerDisplay.style.borderTop = "1px dashed var(--neon-pink)";
    timerDisplay.style.paddingTop = "5px";
    
    element.appendChild(timerDisplay);

    const interval = setInterval(() => {
        timerDisplay.innerHTML = `🔥 İMHA: ${timeLeft}sn`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            // Odayı ve anahtarı bulup veritabanından kalıcı olarak sil
            remove(ref(db, "rooms/" + ROOM + "/messages/" + msgKey));
        }
    }, 1000);
}


// --- 7. ŞİFRELEME (ENCRYPT) MATEMATİĞİ ---
function applyStrongLayers(text, secret, selectedLayers) {
    let encrypted = text;
    let layers = [...selectedLayers].sort((a, b) => a - b);
    
    if (layers.length === 0) {
        return CryptoJS.AES.encrypt(encrypted, secret).toString();
    }

    layers.forEach(layer => {
        let layerSpecificKey = secret + "_LayerSalt_L" + layer;
        encrypted = CryptoJS.AES.encrypt(encrypted, layerSpecificKey).toString();
    });
    
    return encrypted;
}


// --- 8. ŞİFRE ÇÖZME (DECRYPT) MATEMATİĞİ ---
function removeStrongLayers(ciphertext, secret, selectedLayers) {
    let decrypted = ciphertext;
    // Çözerken şifreleme sırasının tam tersi uygulanır
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


// --- 9. VERİ GÖNDERME TETİKLEYİCİSİ ---
function encryptAndSend() {
    const msgInput = document.getElementById("message");
    const burnSelect = document.getElementById("burnTimer");
    
    const textVal = msgInput.value.trim();
    const burnTime = parseInt(burnSelect.value);

    if (!textVal && !selectedImageBase64) {
        alert("SİSTEM UYARISI: Lütfen bir mesaj yazın veya resim seçin.");
        return;
    }

    // Protokol Oluşturma
    let payload = "";
    if (selectedImageBase64) {
        payload = "IMG||" + selectedImageBase64 + "||" + textVal;
    } else {
        payload = "TXT||" + textVal;
    }

    // Seçilen katmanlarla şifrele
    const encryptedPayload = applyStrongLayers(payload, SECRET, encSel);

    // Veritabanına Yaz
    push(roomMessagesRef, {
        user: USER,
        text: encryptedPayload,
        time: Date.now(),
        burn: burnTime 
    });

    // Gönderim sonrası temizlik
    msgInput.value = "";
    selectedImageBase64 = null;
    const btn = document.querySelector(".file-upload-label");
    btn.textContent = "📷 FOTOĞRAF";
    btn.style.background = ""; 
    btn.style.color = "";
}


// --- 10. HARİCİ MANUEL ÇÖZÜCÜ ---
function decryptExternal() {
    const cipherText = document.getElementById("cipher").value.trim();
    const resultDiv = document.getElementById("result");

    if (!cipherText) {
        resultDiv.textContent = "Lütfen çözülecek şifreli bloğu yapıştırın.";
        resultDiv.style.color = "var(--neon-pink)";
        return;
    }

    const plainText = removeStrongLayers(cipherText, SECRET, decSel);

    if (plainText.includes("HATA:")) {
        resultDiv.textContent = "BAŞARISIZ: Master Anahtar veya Katman Seçimi Hatalı.";
        resultDiv.style.color = "var(--neon-red)";
        resultDiv.style.borderColor = "var(--neon-red)";
    } else {
        let cleanText = plainText;
        if (cleanText.startsWith("IMG||")) cleanText = "[RESİM DOSYASI İÇERİYOR - Lütfen ana ekrandaki çözücüyü kullanın]";
        if (cleanText.startsWith("TXT||")) cleanText = cleanText.replace("TXT||", "");
        
        resultDiv.textContent = cleanText;
        resultDiv.style.color = "var(--neon-green)";
        resultDiv.style.borderColor = "var(--neon-green)";
    }
}


// --- 11. PANİK BUTONU (ASYNC DÜZELTMESİ YAPILDI) ---
// Not: Masaüstünde sayfanın hızlı yenilenmesi Firebase silme işlemini yarıda kesiyordu.
// Await kullanarak önce "Silme işlemi bitsin, ondan sonra sayfayı yenile" dedik.
async function triggerPanic() {
    const confirmPanic = confirm("⚠️ DİKKAT: KIRMIZI KOD!\n\nBu işlem odadaki TÜM MESAJLARI ve KAYITLARI kalıcı olarak silecektir. Geri dönüşü yoktur.\n\nOnaylıyor musun?");
    
    if (confirmPanic) {
        try {
            // ASYNC KORUMASI: Silme emrinin bitmesini bekle
            await remove(ref(db, "rooms/" + ROOM));
            
            document.body.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:black; color:red; flex-direction:column;">
                    <h1 style="font-family:Orbitron; font-size:50px;">SİSTEM İMHA EDİLDİ</h1>
                    <p>Tüm veriler temizlendi. Bağlantı kesiliyor...</p>
                </div>
            `;
            
            // Veri kesin olarak silindikten sonra sayfayı yenile
            setTimeout(() => {
                location.reload();
            }, 3000);
            
        } catch (error) {
            console.error("İmha işlemi sırasında hata oluştu:", error);
            alert("İmha işlemi tamamlanamadı! Bağlantınızı kontrol edin.");
        }
    }
}

// --- 12. FONKSİYONLARI HTML'E AKTARMA ---
window.enterRoom = enterRoom;
window.encryptAndSend = encryptAndSend;
window.decryptExternal = decryptExternal;
window.triggerPanic = triggerPanic;
