function caesarEncrypt(text, shift = 3) {
  return text.split('').map(c => {
    if (c.match(/[a-z]/i)) {
      const code = c.charCodeAt(0);
      const base = code >= 65 && code <= 90 ? 65 : 97;
      return String.fromCharCode(((code - base + shift) % 26) + base);
    }
    return c;
  }).join('');
}

function caesarDecrypt(text, shift = 3) {
  return caesarEncrypt(text, 26 - shift);
}

function applyLayer(text, type, encrypt = true) {
  if (type === "caesar") return encrypt ? caesarEncrypt(text) : caesarDecrypt(text);
  if (type === "base64") return encrypt ? btoa(text) : atob(text);
  if (type === "reverse") return text.split('').reverse().join('');
  return text;
}

function sendEncrypted() {
  let text = document.getElementById("plainText").value;
  if (!text) return;

  const l1 = document.getElementById("layer1").value;
  const l2 = document.getElementById("layer2").value;

  let encrypted = applyLayer(text, l1, true);
  encrypted = applyLayer(encrypted, l2, true);

  addMessage(encrypted);
  document.getElementById("plainText").value = "";
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `
    ${msg}
    <span class="copy-btn">📋 Kopyala</span>
  `;

  div.querySelector(".copy-btn").onclick = () => {
    navigator.clipboard.writeText(msg);
    document.getElementById("decryptInput").value = msg;
  };

  document.getElementById("messages").prepend(div);
}

function decryptMessage() {
  let text = document.getElementById("decryptInput").value;

  const l1 = document.getElementById("dLayer1").value;
  const l2 = document.getElementById("dLayer2").value;

  let decrypted = applyLayer(text, l2, false);
  decrypted = applyLayer(decrypted, l1, false);

  document.getElementById("decryptOutput").value = decrypted;
}
