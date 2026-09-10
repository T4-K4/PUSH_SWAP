kodun yazılı olduğu dosya üzerine sağ tık yapılıp "Open ın ıntegrated browser" basıp test edebilirsiniz.
kullanım kılavuzu sistem içinde mevcut.
# 42 Push_swap Master Trainer 🚀

42 Okulu müfredatında yer alan **push_swap** projesini C dilinde kodlamadan önce; yığın (stack) mekaniğini, operasyonları ve sıralama algoritmalarını (Chunk Sort, Radix Sort vb.) görselleştirerek kavramanızı sağlayan interaktif bir web simülatörüdür.

---

## 📌 Özellikler

- **Görsel Yığın Alanı (Stack A & B):** Sayıların büyüklüğüne göre dinamik boyutlanan daireler ve 15+ eleman için optimize edilmiş kompakt liste görünümü.
- **Komut Hattı & Pipeline:** Komutları tıklayarak veya sürükle-bırak yöntemiyle sıraya dizme, 25+ hamle için özet kullanım matrisi.
- **3 Farklı Oyun / Çalışma Modu:**
  - 🏆 **Yarışma Modu:** 13 aşamalı zorluk seviyesi, 25 dakikalık süre kısıtı ve yerel skor tablosu (Leaderboard).
  - 🧘‍♂️ **Serbest Antrenman:** 3 ile 15 arasında serbest eleman seçimiyle pratik yapma imkanı.
  - 🛠️ **Cerat Modu:** Manuel sayı girişi veya 500, 1000, 1500, 2000 boyutunda rastgele devasa dizilerle test.
- **Oto-Çözücü (Chunk Sort Algoritması):** 500 elemanı 42 baremlerine uygun şekilde (< 5500 hamle) tek tıkla simüle eden dahili optimize algoritma.
- **Çift Modlu Terminal:**
  - **C Kaynak Kodu:** Gerçek 42 normuna uygun çift yönlü/tek yönlü liste pointer operasyonları (`sa`, `pb`, `ra`, `rrb` vb.).
  - **Binary (Radix):** $O(n \log n)$ Radix sıralamasının bit bazlı dönüşümünü ve indis analizini gösteren canlı çıktı.

---

## 🎯 Puanlama ve Seviye Geçiş Kuralları

| Durum | Puan | Açıklama |
| :--- | :---: | :--- |
| **İdeal Çözüm** | **100 Puan** | Dizi sıralanır ve 42 barem hamle sayısıyla birebir aynı adımda bitirilir. |
| **Daha Az Hamle** | **200 Puan** | Sistemin bulduğu referans çözümden daha az adımla sıralanır. |
| **Fazla Hamle** | **50 Puan** | Dizi sıralanır ancak ideal baremden uzun sürer (Tekrar denenmelidir). |
| **Başarısız** | **0 Puan** | Dizi sıralanmamışsa veya Stack B boş bırakılmamışsa. |

---

## 🛠️ Desteklenen Komutlar

| Komut | Açıklama |
| :---: | :--- |
| `sa` / `sb` | Stack A / B tepesindeki ilk 2 elemanı takas eder (swap). |
| `ss` | `sa` ve `sb` işlemlerini eşzamanlı çalıştırır. |
| `pa` / `pb` | Stack B'den A'ya veya Stack A'dan B'ye en üstteki elemanı iter (push). |
| `ra` / `rb` | Yığını yukarı kaydırır; en üstteki eleman en alta geçer (rotate). |
| `rr` | `ra` ve `rb` işlemlerini eşzamanlı çalıştırır. |
| `rra` / `rrb` | Yığını aşağı kaydırır; en alttaki eleman en üste gelir (reverse rotate). |
| `rrr` | `rra` ve `rrb` işlemlerini eşzamanlı çalıştırır. |

---

## 📂 Proje Dizin Yapısı

Proje, okunabilirliği ve bakımı kolaylaştırmak adına modüler bir yapıda tasarlanmıştır:

```text
push_swap_trainer/
├── index.html              # Arayüz iskeleti ve modal pencereler
├── css/
│   ├── style.css           # CSS değişkenleri, sayfa düzeni ve omurga
│   ├── components.css      # Toplar, butonlar, çipler, terminal ve modallar
│   └── responsive.css      # Mobil ve tablet ekran uyumluluğu
└── js/
    ├── config.js           # Sabit komut listesi ve C kaynak kod şablonları
    ├── state.js            # Uygulamanın anlık durumu (AppState)
    ├── engine.js           # Temel Push_swap operasyonları ve dizi üretimleri
    ├── solver.js           # Barem hesaplayıcı ve K-Sort / Chunk Sort çözücü
    ├── ui.js               # DOM render fonksiyonları, görsel toplar ve bildirimler
    └── main.js             # Event dinleyicileri, zamanlayıcı ve akış yöneticisi

