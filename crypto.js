const enc = new TextEncoder();
const dec = new TextDecoder();

export async function deriveKey(secret, layers){
  const salt = enc.encode("volktronic-" + [...layers].sort().join("-"));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt","decrypt"]
  );
}

export async function encryptAES(key, text){
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );

  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(cipher))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptAES(key, cipher, iv){
  const data = Uint8Array.from(atob(cipher), c=>c.charCodeAt(0));
  const ivArr = Uint8Array.from(atob(iv), c=>c.charCodeAt(0));

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivArr },
    key,
    data
  );

  return dec.decode(plain);
}
