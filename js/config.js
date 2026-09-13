// Backend & API Yapılandırması
const BACKEND_URL = "https://push-swap-mw5i.onrender.com/api";

// Firebase Firestore REST Yapılandırması (Kendi Firebase Project ID'nizi girin)
const FIREBASE_CONFIG = {
    projectId: "push-swap-trainer-42", // Kendi Firebase Project ID'niz
    get collectionUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/leaderboard`;
    }
};

// 42 Kampüs Listesi
const CAMPUSES = [
    "42 Istanbul",
    "42 Kocaeli",
    "42 Paris",
    "42 Berlin",
    "42 Wolfsburg",
    "42 Madrid",
    "42 Barcelona",
    "42 Tokyo",
    "42 Seoul",
    "42 Abu Dhabi",
    "Other"
];

// Çoklu Dil Sözlüğü (i18n)
const I18N = {
    tr: {
        guide_title: "Push_swap Eğitim Kılavuzu",
        guide_desc: "Bu uygulama, 42 müfredatındaki <b>push_swap</b> projesini kodlamadan önce algoritma mantığını ve yığın dinamiğini kavramanız için tasarlanmıştır.",
        guide_target_title: "🎯 Hedef",
        guide_target_desc: "A yığınındaki sayıları küçükten büyüğe sıralamak ve B yığınını tamamen boş bırakmaktır. Daire boyutu sayının büyüklüğünü temsil eder.",
        guide_rules_title: "📋 Puanlama & Geçiş Kuralları",
        guide_rule_1: "<b>100 Puan:</b> Hedef hamle sayısıyla <b>birebir aynı</b> adımda bitirirsen seviyeyi geçersin.",
        guide_rule_2: "<b>200 Puan:</b> Hedefin <b>altında</b> bir hamleyle bitirirsen seviyeyi geçersin.",
        guide_rule_3: "<b>50 Puan:</b> Hedefin <b>üzerinde</b> bir hamleyle sıralarsan +50 puan alırsın.",
        guide_rule_4: "<b>0 Puan:</b> Dizi sıralanmamışsa veya B yığını boş değilse işlem başarısız sayılır.",
        guide_how_title: "🕹️ Nasıl Oynanır?",
        guide_how_desc: "Soldaki komut kartlarını sağdaki işlem sırasına ekleyin ve <b>Simüle Et & Doğrula</b> butonuna basın.",
        btn_got_it: "Anladım, Kapat ✕",
        login_title: "Yarışma Kaydı",
        login_desc: "Liderlik tablosu ve kampüs savaşı için bilgilerinizi doğrulayın.",
        login_placeholder: "42 nickinizi giriniz",
        btn_cancel: "İptal",
        btn_join_comp: "Yarışmaya Katıl →",
        mode_select_subtitle: "Başlamak için bir oyun modu seçin",
        mode_compete_title: "Yarışma Modu",
        mode_compete_desc: "Aşamalı 13 seviye (3-15 sayı), taktiksel ipuçları ve global skor tablosu.",
        mode_practice_title: "Serbest Antrenman",
        mode_practice_desc: "İstediğin sayı adedini seç, rahatça algoritma ve yığın mantığı çalış.",
        mode_cerat_title: "Cerat Oluşturma",
        mode_cerat_desc: "Kendi sayılarını gir veya 500-2000 sayı ile performansı incele.",
        mode_eval_title: "Evo & Checker Modu",
        mode_eval_desc: "GitHub veya ZIP ile kod yükle, farklı zorluk derecelerinde algoritmayı patlatmayı dene.",
        nav_menu: "Menü",
        nav_guide: "Kılavuz",
        nav_scores: "Skorlar",
        badge_player: "Oyuncu",
        badge_hints: "İpucu",
        badge_timer: "Kalan Süre",
        badge_level: "Seviye",
        badge_score: "Puan",
        stage_visual_title: "Görsel Yığın Durumu",
        lbl_count: "Sayı Adedi:",
        btn_custom_input: "✏️ Sayı Gir",
        lbl_entropy: "Zorluk:",
        entropy_random: "🟡 Rastgele (Standart)",
        entropy_nearly: "🟢 Az Karışık (Hafif)",
        entropy_worst: "🔴 Worst-Case (Ters Dizi)",
        btn_break_code: "💥 Kodu Patlat",
        panel_pipeline_title: "İŞLEM SIRASI & ÖZETİ",
        panel_stats_title: "Kullanım İstatistikleri",
        lbl_moves: "Hamle",
        lbl_target: "Hedef",
        btn_clear: "Temizle",
        btn_hint: "💡 İpucu Al",
        btn_pause: "Durdur",
        btn_resume: "Devam Et",
        btn_restart: "Yeniden Başlat",
        btn_simulate: "Simüle Et & Doğrula",
        btn_pull_code: "Kodu Çek",
        btn_upload_zip: "📁 ZIP Yükle",
        tab_c_code: "C Kaynak Kodu",
        tab_binary: "Binary (Radix)",
        tab_test_report: "🧪 Test Raporu",
        leaderboard_title: "🏆 Liderlik Tablosu",
        lb_tab_cadets: "Öğrenciler",
        lb_tab_campuses: "Kampüs Lig Tablosu",
        th_cadet: "Öğrenci",
        th_campus: "Kampüs",
        th_score: "Skor",
        th_date: "Tarih",
        toast_hint_used: "İpucu uygulandı: {cmd} ({left} hak kaldı)",
        toast_no_hints: "İpucu hakkınız kalmadı!",
        toast_bonus_hint: "Tebrikler! Seviye bonusu: +1 İpucu Hakkı kazandınız!",
        toast_zip_uploaded: "ZIP yüklendi ve başarıyla derlendi!",
        toast_invalid_nick: "Geçersiz 42 intra nicki! Sadece harf, rakam, _ veya - (2-12 karakter)."
    },
    en: {
        guide_title: "Push_swap Master Guide",
        guide_desc: "This application is built to help you understand algorithm mechanics and stack dynamics before coding the 42 curriculum <b>push_swap</b> project.",
        guide_target_title: "🎯 Objective",
        guide_target_desc: "Sort integers in Stack A in ascending order while keeping Stack B completely empty. Ball sizes represent value magnitude.",
        guide_rules_title: "📋 Scoring & Progression",
        guide_rule_1: "<b>100 Points:</b> Match the optimal benchmark move count exactly to advance.",
        guide_rule_2: "<b>200 Points:</b> Beat the optimal benchmark with fewer moves to advance.",
        guide_rule_3: "<b>50 Points:</b> Sorted above the target moves awards +50 points.",
        guide_rule_4: "<b>0 Points:</b> Array unsorted or Stack B not empty counts as failed.",
        guide_how_title: "🕹️ How to Play?",
        guide_how_desc: "Add command cards to the pipeline and press <b>Simulate & Validate</b>.",
        btn_got_it: "Got It, Close ✕",
        login_title: "Cadet Registration",
        login_desc: "Verify your intra handle and campus for leaderboard and campus wars.",
        login_placeholder: "Enter your 42 handle",
        btn_cancel: "Cancel",
        btn_join_comp: "Join Competition →",
        mode_select_subtitle: "Select a game mode to start",
        mode_compete_title: "Competition Mode",
        mode_compete_desc: "13 progressive levels (3-15 nums), tactical hints, and global leaderboard.",
        mode_practice_title: "Free Practice",
        mode_practice_desc: "Pick your stack size and freely study sorting logic without stress.",
        mode_cerat_title: "Cerat Generator",
        mode_cerat_desc: "Enter custom numbers or analyze massive sets of 500-2000 numbers.",
        mode_eval_title: "Evo & Checker Mode",
        mode_eval_desc: "Load code via GitHub or ZIP, then stress-test edge-cases under variable entropy.",
        nav_menu: "Menu",
        nav_guide: "Guide",
        nav_scores: "Scores",
        badge_player: "Cadet",
        badge_hints: "Hints",
        badge_timer: "Time Left",
        badge_level: "Level",
        badge_score: "Score",
        stage_visual_title: "Visual Stack State",
        lbl_count: "Set Size:",
        btn_custom_input: "✏️ Custom Input",
        lbl_entropy: "Entropy:",
        entropy_random: "🟡 Random (Default)",
        entropy_nearly: "🟢 Nearly Sorted",
        entropy_worst: "🔴 Worst-Case (Reverse)",
        btn_break_code: "💥 Break Code",
        panel_pipeline_title: "COMMAND PIPELINE & MATRIX",
        panel_stats_title: "Usage Metrics",
        lbl_moves: "Moves",
        lbl_target: "Target",
        btn_clear: "Clear",
        btn_hint: "💡 Take Hint",
        btn_pause: "Pause",
        btn_resume: "Resume",
        btn_restart: "Restart",
        btn_simulate: "Simulate & Validate",
        btn_pull_code: "Pull Code",
        btn_upload_zip: "📁 Upload ZIP",
        tab_c_code: "C Source Code",
        tab_binary: "Binary (Radix)",
        tab_test_report: "🧪 Test Report",
        leaderboard_title: "🏆 Global Leaderboard",
        lb_tab_cadets: "Cadets",
        lb_tab_campuses: "Campus Wars",
        th_cadet: "Cadet",
        th_campus: "Campus",
        th_score: "Score",
        th_date: "Date",
        toast_hint_used: "Hint applied: {cmd} ({left} hints left)",
        toast_no_hints: "No hints remaining!",
        toast_bonus_hint: "Congratulations! Level bonus: +1 Hint awarded!",
        toast_zip_uploaded: "ZIP uploaded and compiled successfully!",
        toast_invalid_nick: "Invalid 42 intra handle! Use 2-12 letters, numbers, _ or -."
    }
};

// Komut Listesi ve Çok Dilli Açıklamaları
const COMMANDS = [
    { cmd: 'sa', desc_tr: "A'nın en üstteki 2 elemanını takas eder.", desc_en: "Swap the first 2 elements at the top of stack A." },
    { cmd: 'sb', desc_tr: "B'nin en üstteki 2 elemanını takas eder.", desc_en: "Swap the first 2 elements at the top of stack B." },
    { cmd: 'ss', desc_tr: "sa ve sb işlemlerini aynı anda yürütür.", desc_en: "Execute sa and sb simultaneously." },
    { cmd: 'pa', desc_tr: "B'nin en üstündeki sayıyı A'nın tepesine atar.", desc_en: "Push top element from stack B to stack A." },
    { cmd: 'pb', desc_tr: "A'nın en üstündeki sayıyı B'nin tepesine atar.", desc_en: "Push top element from stack A to stack B." },
    { cmd: 'ra', desc_tr: "A'yı yukarı kaydırır; tepe eleman dibe geçer.", desc_en: "Shift up all elements of stack A by 1." },
    { cmd: 'rb', desc_tr: "B'yı yukarı kaydırır; tepe eleman dibe geçer.", desc_en: "Shift up all elements of stack B by 1." },
    { cmd: 'rr', desc_tr: "ra ve rb işlemlerini aynı anda yürütür.", desc_en: "Execute ra and rb simultaneously." },
    { cmd: 'rra', desc_tr: "A'yı aşağı kaydırır; dip eleman tepeye gelir.", desc_en: "Shift down all elements of stack A by 1." },
    { cmd: 'rrb', desc_tr: "B'yi aşağı kaydırır; dip eleman tepeye gelir.", desc_en: "Shift down all elements of stack B by 1." },
    { cmd: 'rrr', desc_tr: "rra ve rrb işlemlerini aynı anda yürütür.", desc_en: "Execute rra and rrb simultaneously." }
];

// C Kaynak Kodu Şablonu
const C_SOURCE_CODE = `#include "push_swap.h"

void\tsa(t_stack **a, int p)
{
\tt_stack\t*t;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tt = (*a)->next;
\t(*a)->next = t->next;
\tt->next = *a;
\t*a = t;
\tif (p)
\t\twrite(1, "sa\\n", 3);
}

void\tpa(t_stack **a, t_stack **b, int p)
{
\tt_stack\t*t;

\tif (!b || !*b)
\t\treturn ;
\tt = *b;
\t*b = (*b)->next;
\tt->next = *a;
\t*a = t;
\tif (p)
\t\twrite(1, "pa\\n", 3);
}

void\tpb(t_stack **a, t_stack **b, int p)
{
\tt_stack\t*t;

\tif (!a || !*a)
\t\treturn ;
\tt = *a;
\t*a = (*a)->next;
\tt->next = *b;
\t*b = t;
\tif (p)
\t\twrite(1, "pb\\n", 3);
}

void\tra(t_stack **a, int p)
{
\tt_stack\t*f;
\tt_stack\t*l;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tf = *a;
\t*a = f->next;
\tf->next = NULL;
\tl = *a;
\twhile (l->next)
\t\tl = l->next;
\tl->next = f;
\tif (p)
\t\twrite(1, "ra\\n", 3);
}

void\trb(t_stack **b, int p)
{
\tt_stack\t*f;
\tt_stack\t*l;

\tif (!b || !*b || !(*b)->next)
\t\treturn ;
\tf = *b;
\t*b = f->next;
\tf->next = NULL;
\tl = *b;
\twhile (l->next)
\t\tl = l->next;
\tl->next = f;
\tif (p)
\t\twrite(1, "rb\\n", 3);
}

void\trrb(t_stack **b, int p)
{
\tt_stack\t*prev;
\tt_stack\t*l;

\tif (!b || !*b || !(*b)->next)
\t\treturn ;
\tprev = NULL;
\tl = *b;
\twhile (l->next)
\t{
\t\tprev = l;
\t\tl = l->next;
\t}
\tprev->next = NULL;
\tl->next = *b;
\t*b = l;
\tif (p)
\t\twrite(1, "rrb\\n", 4);
}
`;
