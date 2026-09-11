# 42 PUSH_SWAP MASTER TRAINER & EVALUATION TOOL

Modern arayüzlü, 42 Push_swap projesi için geliştirilmiş algoritma simülatörü, görselleştiricisi ve resmi **42 Evaluation Scale (Akran Değerlendirme)** test aracı.

---

## 🚀 Proje Hakkında

Bu proje, 42 müfredatındaki `push_swap` projesinin algoritma mantığını ve yığın dinamiğini kavramak; akran değerlendirmesi (peer-evaluation) sırasında öğrencinin kodunu GitHub üzerinden anında çekip resmi barem kurallarına göre test etmek amacıyla geliştirilmiştir.

Uygulama; sıfır harici kütüphane (zero-dependency) prensibiyle saf JavaScript (ES6+), HTML5 ve modern responsive CSS mimarisiyle inşa edilmiştir.

---

## 🎮 Modlar ve Özellikler

### 1. 🏆 Yarışma Modu (Compete)
* 3 elemandan 15 elemana kadar kademeli 13 seviye.
* 25 dakikalık geri sayım sayacı ve duraklatma seçeneği.
* 42 baremine uygun ideal adım hedefleri ve puanlama mekanizması.
* Yerel depolama (`localStorage`) tabanlı global skor tablosu.

### 2. 🧘‍♂️ Serbest Antrenman (Practice)
* 3, 4, 5, 6, 8, 10 veya 15 elemanlık rastgele diziler.
* Süre ve puan kısıtı olmadan algoritma denemeleri.

### 3. 🛠️ Cerat Modu (Büyük Veri & Özel Diziler)
* Manuel sayı girişi (virgül veya boşlukla ayrılmış).
* 500, 1000, 1500 ve 2000 elemanlı rastgele veri setleri oluşturma.
* Tek tıkla çalışan optimize çözücü (`autoSolve`).

### 4. 🧪 Evo & 42 Checker Test Laboratuvarı
* **GitHub Entegrasyonu:** Herkese açık bir GitHub push_swap repo linki verildiğinde `git/trees` API ile alt dizinler dahil tüm `.c` kaynak kodlarını otomatik bulur, çeker ve terminale yükler.
* **Akıllı Algoritma Analizi:** Çekilen kodun mimarisini (Radix Sort, Turk Algorithm / Cost, Chunk Sort) ve C içindeki `chunk` parametrelerini otomatik analiz eder.
* **100 ve 500 Sayı Testi:** Üretilen rastgele dizileri, kullanıcının GitHub'dan çekilen kendi C algoritmasıyla simüle eder.
* **Resmi Barem Skalası (Evaluation Scale):**
  * **100 Sayı:**
    * `< 700`: 5/5 (Mükemmel)
    * `< 900`: 4/5
    * `< 1100`: 3/5
    * `< 1300`: 2/5
    * `< 1500`: 1/5
    * $\ge 1500$: 0 Puan (FAILED)
  * **500 Sayı:**
    * `< 5500`: 5/5 (Mükemmel)
    * `< 7000`: 4/5
    * `< 8500`: 3/5
    * `< 10000`: 2/5
    * `< 11500`: 1/5
    * $\ge 11500$: 0 Puan (FAILED)
* **💥 Kodu Patlatmayı Dene (Resmi Test Paketi):**
  * **Error Management:** Non-numeric, duplicate, `> INT_MAX` ve parametresiz çağırma kontrolleri.
  * **Identity Test:** `42`, `2 3`, `0 1 2 3`, `0..9` gibi zaten sıralı dizilerde kesinlikle **0 hamle** kontrolü.
  * **Simple Version:** `2 1 0` için 2 veya 3 hamle kontrolü.
  * **Another Simple Version:** `1 5 2 4 3` için $\le 12$ hamle (8 hamle Kudos) kontrolü.
  * **Tırnaklı Tek Parametre Desteği:** `ARG="10 20 30 40 50"` string parsing testi.
* **Çoklu OS Checker:** 🐧 Linux, 🍎 macOS ve 🪟 Windows resmi checker mantığı ile anında tek tıkla test.
* **Konfeti Animasyonu:** Kod tüm resmi evaluation testlerinden başarıyla geçerse canvas tabanlı kutlama animasyonu.

---

## 🛠️ Desteklenen Push_swap Komutları

| Komut | Açıklama |
| :--- | :--- |
| `sa` | Stack A'nın tepesindeki ilk 2 elemanı takas eder. |
| `sb` | Stack B'nin tepesindeki ilk 2 elemanı takas eder. |
| `ss` | `sa` ve `sb` operasyonlarını eş zamanlı yürütür. |
| `pa` | Stack B'nin en üstündeki sayıyı Stack A'nın tepesine atar. |
| `pb` | Stack A'nın en üstündeki sayıyı Stack B'nin tepesine atar. |
| `ra` | Stack A'yı yukarı kaydırır; tepe eleman dibe geçer. |
| `rb` | Stack B'yi yukarı kaydırır; tepe eleman dibe geçer. |
| `rr` | `ra` ve `rb` operasyonlarını eş zamanlı yürütür. |
| `rra` | Stack A'yı aşağı kaydırır; dip eleman tepeye gelir. |
| `rrb` | Stack B'yi aşağı kaydırır; dip eleman tepeye gelir. |
| `rrr` | `rra` ve `rrb` operasyonlarını eş zamanlı yürütür. |

---

## 📁 Proje Dosya Ağacı

```text
PUSH_SWAP/
├── css/
│   ├── components.css    # Modallar, butonlar, badge'ler ve test rapor tablosu
│   ├── responsive.css    # Mobil ve tablet uyumluluk kuralları
│   └── style.css         # Ana renk değişkenleri, terminal ve grid yerleşimi
├── js/
│   ├── config.js         # Komut sözlüğü ve C kaynak kodu taslakları
│   ├── engine.js         # Yığın motoru (applyOp) ve isSorted kontrolü
│   ├── main.js           # Sayfa yaşam döngüsü, mod yönetimi ve GitHub Tree API
│   ├── solver.js         # 42 algoritma çözücüleri, profil çıkarıcı ve Evo test motoru
│   ├── state.js          # Uygulama durum değişkenleri (AppState)
│   └── ui.js             # Yığın çizimi, pipeline, toast ve konfeti animasyonu
├── index.html            # Ana uygulama şablonu
└── README.md             # Dokümantasyon