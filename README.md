<div align="center">

# 🔐 VOLKTRONIC CRYPTO CHAT
**Premium Kriptolu Siber İstihbarat ve İletişim Ağı**

![Version](https://img.shields.io/badge/Version-11.0-blueviolet?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-AES--256-brightgreen?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Firebase_v10-orange?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%26%20Mobile-00f3ff?style=for-the-badge)

Volktronic Crypto Chat, tarayıcı tabanlı **uçtan uca şifreleme (E2EE)** mantığıyla çalışan, askeri standartlarda (AES-256) güvenlik sunan **sunucusuz ve gerçek zamanlı** bir iletişim platformudur. Geride hiçbir iz bırakmamak üzere kodlanmış olup, PC ve Mobil cihazlarda kusursuz bir "Native App" (Yerel Uygulama) deneyimi sunar.

</div>

---

## 🚀 Yeni Nesil Özellikler

- 🛡️ **Askeri Sınıf Şifreleme (AES-256):** CryptoJS altyapısı ile "Soğan Yönlendirme" (Onion Routing) mantığında çok katmanlı kriptolama.
- 📱 **Kusursuz Mobil Mimari:** Telefon tarayıcılarında donma veya kilitlenme yapmayan, alt menü (tab-bar) destekli akıcı ve modern arayüz tasarımı.
- 🔥 **Kendini İmha Eden Mesajlar (Burn-Timer):** 15 veya 60 saniye sonra Firebase veritabanından ve ekrandan *kalıcı olarak* silinen zaman ayarlı mesajlar.
- 🎙️ & 📷 **Şifreli Medya Transferi:** Ses kayıtları ve fotoğrafları sunucuya yüklemeden, anında Base64 formatına çevirip AES-256 ile şifreleyerek güvenli iletim.
- 🚨 **Panik Protokolü:** Tek tıkla odadaki tüm sohbet geçmişini ve verileri saniyeler içinde geri döndürülemez şekilde yok eden acil durum sistemi.
- 📨 **Entegre Destek Sistemi:** Formspree API kullanılarak sisteme gömülmüş, spam korumalı doğrudan iletişim ve destek modülü.

---

## 🛠️ Arayüz Görüntüleri

> *Görseller Volktronic ağının PC ve Mobil görünümlerini temsil etmektedir.*

<img width="1919" height="866" alt="image" src="[https://github.com/user-attachments/assets/ae51892e-120f-41d1-b540-0d6dbfe8707d](https://github.com/user-attachments/assets/ae51892e-120f-41d1-b540-0d6dbfe8707d)" />
<img width="1919" height="861" alt="image" src="[https://github.com/user-attachments/assets/dd0bcd98-e6f1-49ac-985c-20ffb100d979](https://github.com/user-attachments/assets/dd0bcd98-e6f1-49ac-985c-20ffb100d979)" />
<img width="945" height="2048" alt="image" src="[https://github.com/user-attachments/assets/b91ca50e-26eb-4572-a2eb-bcfd58c951c6](https://github.com/user-attachments/assets/b91ca50e-26eb-4572-a2eb-bcfd58c951c6)" />
<img width="945" height="2048" alt="image" src="[https://github.com/user-attachments/assets/0abac16a-6ea4-4853-ac25-87dc13d30940](https://github.com/user-attachments/assets/0abac16a-6ea4-4853-ac25-87dc13d30940)" />

---

## 🧠 Şifreleme Mantığı (Çok Katmanlı AES)

Sistem, basit bir şifrelemeden ziyade gelişmiş bir kilit mekanizmasıyla çalışır:

1. **Master Anahtar:** Kullanıcı sisteme girerken odaya özel bir Gizli Parola belirler.
2. **Güvenlik Katmanları:** Mesaj gönderilmeden önce şifreleyici panelden çeşitli katmanlar (L-01, L-05 vb.) seçilir.
3. **Kriptolama:** Seçilen her bir katman, Master Şifre ile birleşerek benzersiz bir "Salt" oluşturur ve veriyi döngüsel olarak tekrar tekrar AES-256 algoritmasıyla kilitler.
4. **Çözümleme:** Karşı tarafın mesajı, görseli veya sesi çözebilmesi için göndericiyle **birebir aynı katman dizilimini** ve **aynı Master Şifreyi** girmesi zorunludur. En ufak bir uyumsuzlukta sistem veriyi kesinlikle reddeder.

---

## 💻 Kullanılan Teknolojiler

- **Core:** HTML5, CSS3, Vanilla JavaScript (ES6)
- **Güvenlik:** CryptoJS (AES-256)
- **Veritabanı:** Firebase Realtime Database v10 (BaaS)
- **Tasarım Mimarisi:** CSS Flexbox/Grid, Responsive Mobile-First Design
- **API:** Formspree (E-Posta Yönetimi)
- **Medya API:** WebRTC `getUserMedia()` (Mikrofon erişimi ve ses kaydı), `FileReader` (Görsel işleme)

---

## ⚙️ Kurulum ve Kendi Ortamınızda Çalıştırma (Local Setup)

Bu proje açık kaynak (Open Source) olarak paylaşılmıştır ancak güvenlik nedeniyle veritabanı bağlantıları ve yönetici şifreleri kod içerisinden **kaldırılmıştır**. Sistem herhangi bir sunucu veya backend kurulumu gerektirmez, doğrudan statik web sayfası olarak çalışır.

### Seçenek 1: Canlı Ağ Bağlantısı (Önerilen)
Volktronic ağına doğrudan katılmak ve test etmek için aşağıdaki bağlantıyı kullanabilirsiniz:
👉 **[Volktronic Premium Ağına Katıl](https://wolynx.github.io/volktron-enigma-chat/)**

### Seçenek 2: Kendi İstasyonunuzu Kurun
Projeyi kendi bilgisayarınızda çalıştırmak veya sunucunuza kurmak için aşağıdaki adımları izleyin:

**1. Repository'i Klonlayın**
```bash
git clone https://github.com/Wolynx/volktron-enigma-chat.git
cd volktron-enigma-chat
