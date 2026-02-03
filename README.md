# 🔐 Volktronic Crypto Chat

Volktronic Crypto Chat, **istemci taraflı şifreleme** mantığıyla çalışan,  
Firebase tabanlı **gerçek zamanlı**, **sunucusuz** bir web sohbet uygulamasıdır.

Mesajlar gönderilmeden önce kullanıcı tarafından şifrelenir ve yalnızca aynı
şifreleme katmanlarını bilen kişiler tarafından çözülebilir.

---

## 🚀 Özellikler

- 🔒 Client-side encryption (tarayıcı içinde)
- 🧩 Katman tabanlı şifreleme sistemi
- 🔓 Manuel şifre çözme desteği
- ⚡ Firebase Realtime Database ile canlı sohbet
- 🧑‍🤝‍🧑 Oda bazlı chat sistemi
- 📋 Tek tıkla mesaj kopyalama
- 🎨 Modern neon / cyber arayüz
- 🌐 Sunucu gerektirmez (GitHub Pages uyumlu)

---

## 🛠️ Görseller
<img width="1912" height="900" alt="image" src="https://github.com/user-attachments/assets/5e6a4fe8-3ac1-426d-87bf-13aaba471b0c" />
<img width="1907" height="901" alt="image" src="https://github.com/user-attachments/assets/f50390b9-b145-4398-8e19-50d1cd4b368b" />

---

## 🧠 Şifreleme Mantığı

Bu projede **çok katmanlı karakter kaydırma (layer-based cipher)** mantığı kullanılır.

- Kullanıcı mesaj göndermeden önce bir veya daha fazla **katman** seçer
- Her katman, mesaj karakterlerine farklı bir dönüşüm uygular
- Mesajı çözmek için **aynı katmanların aynı sırayla** seçilmesi gerekir

> ⚠️ Not: Bu proje eğitim ve demonstrasyon amaçlıdır.  
> Üretim ortamları için AES / RSA gibi modern kripto algoritmaları önerilir.

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5 / CSS3**
- **Vanilla JavaScript**
- **Firebase Realtime Database**
- **GitHub Pages**

---

## 📦 Kurulum

Herhangi bir kurulum gerekmez.

1. Repository’i klonla:
   ```bash
   git clone https://github.com/Wolynx/volktron-enigma-chat.git

2. Benim sitem üzerinden katılmak için:
   ```bash   
   https://wolynx.github.io/Volktron-Enigma-Chat/
