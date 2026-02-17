# 🔐 Volktronic Crypto Chat v3.1 | Kriptolu İstihbarat Ağı

![Version](https://img.shields.io/badge/Version-3.1-blueviolet)
![Encryption](https://img.shields.io/badge/Encryption-AES--256-brightgreen)
![Firebase](https://img.shields.io/badge/Database-Firebase_v10-orange)
![UI](https://img.shields.io/badge/UI-Glassmorphism%20%26%203D-00f3ff)

Volktronic Crypto Chat, tarayıcı tabanlı **uçtan uca şifreleme (E2EE)** mantığıyla çalışan, askeri standartlarda (AES-256) güvenlik sunan **sunucusuz ve gerçek zamanlı** bir iletişim platformudur. "Siber İstihbarat" temasıyla tasarlanmış olup, geride hiçbir iz bırakmamak üzere özel protokollerle kodlanmıştır.

---

## 🚀 Yeni Nesil Özellikler

- 🛡️ **Askeri Sınıf Şifreleme (AES-256):** CryptoJS altyapısı ile çok katmanlı (Onion) kriptolama.
- 🔥 **Kendini İmha Eden Mesajlar (Burn-Timer):** 10, 30 veya 60 saniye sonra Firebase veritabanından ve ekrandan *kalıcı olarak* silinen mesajlar.
- 🚨 **Panik Protokolü:** Tek tıkla (Async) odadaki tüm geçmişi ve verileri saniyeler içinde geri döndürülemez şekilde yok eden acil durum butonu.
- 📷 **Şifreli Medya Transferi:** Fotoğrafları Base64 formatına çevirip AES-256 ile şifreleyerek güvenli görsel aktarımı.
- 🛸 **Siber Arayüz (Cyberdeck UI):** HTML5 Canvas veri ağı animasyonları, 3D Glassmorphism tilt (eğilme) efektleri ve modern neon detaylar.
- 📋 **RAW Veri Aktarımı:** Gelen şifreli paketleri tek tıkla kopyalama veya sağ paneldeki harici manuel çözücüye aktarma imkanı.

---

## 🛠️ Görseller

<img width="1919" height="868" alt="image" src="https://github.com/user-attachments/assets/d130f4c2-44c6-4df6-9749-def0f2255cb8" />
<img width="1919" height="861" alt="image" src="https://github.com/user-attachments/assets/5309bb33-cf42-4777-9ba8-b57fb2a85b7e" />

---

## 🧠 Şifreleme Mantığı (Çok Katmanlı AES)

Sistem, basit bir şifrelemeden ziyade **"Soğan Yönlendirme" (Onion Routing)** mantığına benzer çalışır.

1. Kullanıcı sisteme girerken bir **Master Şifre (Gizli Anahtar)** belirler.
2. Mesajı göndermeden önce panelden çeşitli **Katmanlar (L-01, L-05 vb.)** seçer.
3. Seçilen her katman, Master Şifre ile birleşerek benzersiz bir "Salt" (Tuz) oluşturur ve veriyi **tekrar tekrar AES-256 algoritmasıyla şifreler**.
4. Karşı tarafın mesajı veya görseli çözebilmesi için göndericiyle **birebir aynı katmanları** ve **aynı Master Şifreyi** girmesi zorunludur. Yanlış bir katman seçimi sistemin veriyi reddetmesine yol açar.

---

## 💻 Kullanılan Teknolojiler

- **Vanilla JavaScript (ES6 Modules)**
- **CryptoJS** (AES-256 Core)
- **Firebase Realtime Database v10** (Gerçek Zamanlı Veri Akışı)
- **HTML5 Canvas & CSS3 3D Transforms** (Görsel Motor)

---

## 🌐 Kurulum ve Canlı Test

Herhangi bir sunucu kurulumu gerekmez. Doğrudan tarayıcı üzerinden çalışır.

### Seçenek 1: Canlı Ağ Bağlantısı (Önerilen)
Volktronic ağına doğrudan tarayıcınızdan katılmak için aşağıdaki güvenli bağlantıyı kullanın:
👉 **[volktron-enigma-chat Ağına Katıl](https://wolynx.github.io/volktron-enigma-chat/)** *(Not: Sistem büyük/küçük harf duyarlı olduğu için bağlantının tamamen küçük harflerden oluştuğundan emin olun.)*

### Seçenek 2: Kendi İstasyonunuzu Kurun
Projeyi kendi yerel ağınızda test etmek veya geliştirmek için:
```bash
# Repository'i klonlayın
git clone [https://github.com/Wolynx/volktron-enigma-chat.git](https://github.com/Wolynx/volktron-enigma-chat.git)

# Klasöre girin
cd volktron-enigma-chat

# index.html dosyasını herhangi bir modern tarayıcıda açın
