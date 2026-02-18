/* =======================================================
   VOLKTRONIC CRYPTO ENGINE v8.1 - MOBILE STABLE
   ======================================================= */

const firebaseConfig = {
  databaseURL: "https://volktron-chat-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
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

/* ---------- LAYER GENERATOR ---------- */
function makeLayers(element, setObj) {
    if (!element) return;
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("div");
        btn.className = "layer";
        btn.innerHTML = `<span>${i < 10 ? "0" + i : i}</span>`;
        btn.onclick = () => {
            setObj.has(i) ? setObj.delete(i) : setObj.add(i);
            btn.classList.toggle("active");
        };
        element.appendChild(btn);
    }
}
makeLayers(document.getElementById("encLayers"), encSel);
makeLayers(document.getElementById("decLayers"), decSel);

/* ---------- MOBILE ENTER FIX ---------- */
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const login = document.getElementById("login");
        if (login && !login.classList.contains("hidden")) {
            enterRoom();
        }
    }
});

/* ---------- IMAGE INPUT ---------- */
document.getElementById("imageInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    const label = document.getElementById("imgLabel");
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
        alert("Maksimum 1.5MB dosya.");
        this.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        selectedImageBase64 = ev.target.result;
        selectedAudioBase64 = null;
        label.innerHTML = "Görsel Eklendi ✓";
        label.classList.add("active-state");
    };
    reader.readAsDataURL(file);
});

/* ---------- AUDIO RECORD ---------- */
async function toggleAudioRecord() {
    const micBtn = document.getElementById("micBtn");

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.onloadend = () => {
                    selectedAudioBase64 = reader.result;
                    selectedImageBase64 = null;
                    micBtn.innerHTML = "Ses Hazır ✓";
                    micBtn.classList.remove("recording");
                    micBtn.classList.add("active-state");
                };
                reader.readAsDataURL(blob);
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.innerHTML = "Kaydediliyor...";
            micBtn.classList.add("recording");
        } catch {
            alert("Mikrofon izni reddedildi.");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
    }
}
window.toggleAudioRecord = toggleAudioRecord;

/* ---------- ENTER ROOM ---------- */
function enterRoom() {
    USER = username.value.trim();
    ROOM = room.value.trim();
    SECRET = secretKey.value.trim();
    const PIN = roomPin.value.trim();

    if (!USER || !ROOM || !SECRET || !PIN) {
        alert("Eksik bilgi.");
        return;
    }

    const hash = CryptoJS.MD5(ROOM + "_" + PIN).toString();
    SECURE_ROOM_PATH = ROOM + "_" + hash.slice(0, 10);

    login.classList.add("hidden");
    chat.classList.remove("hidden");

    document.getElementById("userNameDisplay").textContent = USER;
    document.getElementById("roomNameDisplay").textContent = ROOM;

    if (!window.firebaseListenersActive) {
        startFirebaseListeners();
        window.firebaseListenersActive = true;
    }
}

/* ---------- FIREBASE ---------- */
function startFirebaseListeners() {
    const presenceRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").push();
    presenceRef.set(USER);
    presenceRef.onDisconnect().remove();

    db.ref("rooms/" + SECURE_ROOM_PATH + "/presence").on("value", (s) => {
        document.getElementById("onlineCountDisplay").innerText = Object.keys(s.val() || {}).length;
    });

    roomMessagesRef = db.ref("rooms/" + SECURE_ROOM_PATH + "/messages");

    roomMessagesRef.on("child_added", (snap) => {
        const d = snap.val();
        const div = document.createElement("div");
        div.className = "msg-box msg " + (d.user === USER ? "me" : "other");
        div.innerHTML = `
            <div class="msg-header"><strong>${d.user}</strong><span>${new Date(d.time).toLocaleTimeString()}</span></div>
            <div class="raw-data mono-font">${d.text}</div>
        `;
        log.appendChild(div);
        chatScroll();
    });
}

/* ---------- SCROLL FIX ---------- */
function chatScroll() {
    const c = document.getElementById("chat-scroll-container");
    setTimeout(() => (c.scrollTop = c.scrollHeight), 50);
}

/* ---------- CRYPTO ---------- */
function applyStrongLayers(text, secret, layers) {
    let out = text;
    [...layers].sort((a, b) => a - b).forEach((l) => {
        out = CryptoJS.AES.encrypt(out, secret + "_L" + l).toString();
    });
    return out;
}

function removeStrongLayers(cipher, secret, layers) {
    try {
        let out = cipher;
        [...layers].sort((a, b) => b - a).forEach((l) => {
            out = CryptoJS.AES.decrypt(out, secret + "_L" + l).toString(CryptoJS.enc.Utf8);
        });
        return out;
    } catch {
        return "HATA";
    }
}

function encryptAndSend() {
    const msg = message.value.trim();
    if (!msg && !selectedImageBase64 && !selectedAudioBase64) return;

    let payload = "TXT||" + msg;
    if (selectedImageBase64) payload = "IMG||" + selectedImageBase64 + "||" + msg;
    if (selectedAudioBase64) payload = "AUDIO||" + selectedAudioBase64 + "||" + msg;

    roomMessagesRef.push({
        user: USER,
        text: applyStrongLayers(payload, SECRET, encSel),
        time: Date.now()
    });

    message.value = "";
}

window.enterRoom = enterRoom;
window.encryptAndSend = encryptAndSend;
