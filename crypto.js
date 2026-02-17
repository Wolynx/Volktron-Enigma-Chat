const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function genKeys(){
  return crypto.subtle.generateKey(
    {name:"ECDH", namedCurve:"P-256"},
    false, ["deriveKey"]
  );
}

export async function pub(key){
  return b64(await crypto.subtle.exportKey("raw", key));
}

export async function importPub(k){
  return crypto.subtle.importKey(
    "raw", ub64(k),
    {name:"ECDH", namedCurve:"P-256"},
    false, []
  );
}

export async function derive(priv, pub, layers){
  const salt = enc.encode([...layers].sort().join("-"));
  return crypto.subtle.deriveKey(
    {name:"ECDH", public:pub},
    priv,
    {name:"AES-GCM", length:256},
    false, ["encrypt","decrypt"]
  );
}

export async function encAES(key, txt){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt(
    {name:"AES-GCM", iv},
    key, enc.encode(txt)
  );
  return JSON.stringify({iv:b64(iv), d:b64(c)});
}

export async function decAES(key, txt){
  const o = JSON.parse(txt);
  const p = await crypto.subtle.decrypt(
    {name:"AES-GCM", iv:ub64(o.iv)},
    key, ub64(o.d)
  );
  return dec.decode(p);
}
