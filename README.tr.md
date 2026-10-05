# Return Ticket

Kesilen işe tek bir sonraki adımla dönmek için dönüş biletleri.

**[Uygulamayı aç](https://metealpkarvan.github.io/return-ticket/)** · [English](README.md) · [İndirilebilir ZIP](https://github.com/metealpkarvan/return-ticket/releases/latest)

![Return Ticket ekran görüntüsü](docs/preview.png)

## Nasıl kullanılır?

1. İşe ara vermeden önce adını, tam kaldığın noktayı ve ilk küçük hareketi yaz.
2. 1–120 dakikalık bir dönüş turu belirle; istersen çalışma alanının bağlantısını ekle.
3. Bileti bırak; dönünce aç. Aynı anda tek bilet aktiftir.
4. Duraklat, tekrar bırak, yeni tur başlat veya tamamla. Başka bilet açmak önceki turu durdurur.
5. Dönüş notunu kopyala veya JSON yedeği indir; tamamlananları yeniden açabilirsin.

EN/TR düğmesi dili değiştirir. Örnek düğmesi kurgusal veriler yükler. İlk başarılı çevrimiçi açılıştan sonra uygulama dosyaları aynı tarayıcıda çevrimdışı kullanım için önbelleğe alınır.

## İndir ve yerelde çalıştır

Canlı demo için hesap veya kurulum gerekmez. Releases bölümündeki **return-ticket-v1.0.0.zip** dosyasını indir, çıkar ve çıkarılan klasörde çalıştır:

    python3 -m http.server 8080 --bind 127.0.0.1

Tarayıcıda http://127.0.0.1:8080 adresini aç. Modül kısıtlamaları nedeniyle HTML dosyasına çift tıklamak yerine yerel HTTP sunucusu kullanılır. ZIP, kullanıcı kayıtlarını içermez.

## Gizlilik ve sınırlar

Uygulama cihazında çalışır. AI API anahtarı, sunucuya metin yükleme, reklam, analiz veya hesap gerektirmez. Kayıtlar bu tarayıcının yerel deposundadır. JSON yedekleri şifresizdir; önemli kayıtlar için yedek indir. İçe aktarma mevcut kayıtları değiştirmeden önce doğrulama ve onay ister.

Görev uygulamalarıyla entegrasyon, arka plan bildirimi veya otomatik faaliyet takibi yoktur. Cihaz saatinin değiştirilmesi zamanlayıcıyı etkileyebilir.

## Araştırma ve geliştirme

Dayanılan paylaşım: [Katyayani Shukla (@aibytekat)](https://x.com/aibytekat/status/2034933272493654386) (2026-03-20). X erişim sınırlaması nedeniyle [okunabilir thread kopyası](https://threadreaderapp.com/thread/2034933272493654386.html) da incelendi. Bu seçilmiş küçük bir keşif örneklemidir; pazar araştırması veya ölçülmüş başarı iddiası değildir. Gözlem ile ürün çıkarımı [araştırma notlarında](docs/RESEARCH.md) ayrılır.

Geliştirme için Node.js 22+ gerekir:

    npm test
    npm run build

Testler, mimari tercihler ve kullanım kontrolleri İngilizce teknik belgelerde açıklanır. MIT lisansıyla kullanabilir, değiştirebilir ve katkıda bulunabilirsin.
