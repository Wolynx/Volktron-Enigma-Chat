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
- 📊 **Yönetici Analiz Terminali:** Sadece sistem yöneticisine özel; günlük tekil ziyaretçi sayısını ve ağdaki anlık canlı kullanıcıları gösteren gizli takip ekranı.
- 📨 **Entegre Destek Sistemi:** Formspree API kullanılarak sisteme gömülmüş, spam korumalı doğrudan iletişim ve destek modülü.

---

## 🛠️ Arayüz Görüntüleri

> *Görseller Volktronic ağının PC ve Mobil görünümlerini temsil etmektedir.*

<img width="1919" alt="Volktronic PC Interface" src="https://github.com/user-attachments/assets/d130f4c2-44c6-4df6-9749-def0f2255cb8" />
<img width="1919" alt="Volktronic Decryption View" src="https://github.com/user-attachments/assets/5309bb33-cf42-4777-9ba8-b57fb2a85b7e" />

---

## 🧠 Şifreleme Mantığı (Çok Katmanlı AES)

Sistem, basit bir şifrelemeden ziyade gelişmiş bir kilit mekanizmasıyla çalışır:

1. **Master Anahtar:** Kullanıcı sisteme girerken odaya özel bir Gizli Parola belirler.
2. **Güvenlik Katmanları:** Mesaj gönderilmeden önce şifreleyici panelden çeşitli katmanlar (L-01, L-05 vb.) seçilir.
3. **Kriptolama:** Seçilen her bir katman, Master Şifre ile birleşerek benzersiz bir "Salt" (Tuz) oluşturur ve veriyi döngüsel olarak tekrar tekrar AES-256 algoritmasıyla kilitler.
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

## 🌐 Kurulum ve Canlı Test

Sistem herhangi bir sunucu veya backend kurulumu gerektirmez. Doğrudan statik web sayfası olarak çalışır.

### Seçenek 1: Canlı Ağ Bağlantısı (Önerilen)
Volktronic ağına doğrudan katılmak ve test etmek için aşağıdaki bağlantıyı kullanabilirsiniz:
👉 **[Volktronic Premium Ağına Katıl](https://wolynx.github.io/volktron-enigma-chat/)** ### Seçenek 2: Kendi İstasyonunuzu Kurun
Projeyi kendi yerel ağınızda çalıştırmak veya kaynak kodlarını incelemek için:
```bash
# Repository'i klonlayın
git clone [https://github.com/Wolynx/volktron-enigma-chat.git](https://github.com/Wolynx/volktron-enigma-chat.git)

# Klasöre girin
cd volktron-enigma-chat

# index.html dosyasını herhangi bir modern tarayıcıda açarak başlatın
