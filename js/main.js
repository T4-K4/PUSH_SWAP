// --- UYGULAMA BAŞLANGICI ---
function initApp() {
    UI.applyTranslations();
    UI.renderCommandsPanel();
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);

    // Kayıtlı kullanıcı adı ve kampüsü yükle
    const savedNick = localStorage.getItem('ps_nick');
    if (savedNick) AppState.playerName = savedNick;
    const pName = document.getElementById('player-name');
    if (pName) pName.innerText = AppState.playerName;

    const savedCampus = localStorage.getItem('ps_campus');
    if (savedCampus) AppState.playerCampus = savedCampus;

    const inputField = document.getElementById('login-input-field');
    if (inputField) inputField.value = AppState.playerName !== 'cadet42' ? AppState.playerName : '';

    const campusSelect = document.getElementById('login-campus-select');
    if (campusSelect && savedCampus) campusSelect.value = savedCampus;
}

window.onload = initApp;

// --- DİL YÖNETİMİ ---
function toggleLanguage() {
    AppState.currentLang = AppState.currentLang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('ps_lang', AppState.currentLang);
    UI.applyTranslations();
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

// --- GİRİŞ VE KAMPÜS SEÇİMİ (YARIŞMA MODU) ---
function triggerCompeteMode() {
    const modeModal = document.getElementById('mode-modal');
    if (modeModal) modeModal.style.display = 'none';

    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        const inputField = document.getElementById('login-input-field');
        if (inputField) setTimeout(() => inputField.focus(), 150);
    }
}

function submitLogin() {
    const inputField = document.getElementById('login-input-field');
    const campusSelect = document.getElementById('login-campus-select');
    const nick = inputField ? inputField.value.trim() : "";
    const campus = campusSelect ? campusSelect.value : "42 Istanbul";

    // 42 Intra Doğrulaması (2-12 karakter; harf, rakam, _ veya -)
    const validNickRegex = /^[a-zA-Z0-9_-]{2,12}$/;
    if (!validNickRegex.test(nick)) {
        UI.showToast(I18N[AppState.currentLang].toast_invalid_nick, "error");
        if (inputField) {
            inputField.style.borderColor = "var(--accent-red)";
            setTimeout(() => inputField.style.borderColor = "var(--border-color)", 2000);
        }
        return;
    }

    AppState.playerName = nick;
    AppState.playerCampus = campus;
    localStorage.setItem('ps_nick', nick);
    localStorage.setItem('ps_campus', campus);

    const pName = document.getElementById('player-name');
    if (pName) pName.innerText = AppState.playerName;

    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.style.display = 'none';

    selectMode('compete');
}

function promptChangeName() {
    const n = prompt("Yeni kullanıcı adı / New intra nick:", AppState.playerName);
    if (n && /^[a-zA-Z0-9_-]{2,12}$/.test(n.trim())) {
        AppState.playerName = n.trim();
        localStorage.setItem('ps_nick', AppState.playerName);
        const pName = document.getElementById('player-name');
        if (pName) pName.innerText = AppState.playerName;
    } else if (n) {
        UI.showToast(I18N[AppState.currentLang].toast_invalid_nick, "error");
    }
}

// --- MOD SEÇİMİ VE GÖRÜNÜM DÜZENİ ---
function selectMode(mode) {
    AppState.gameMode = mode;
    const modeModal = document.getElementById('mode-modal');
    if (modeModal) modeModal.style.display = 'none';

    const setDisplay = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.style.display = val;
    };

    setDisplay('home-btn', 'inline-flex');
    setDisplay('practice-controller', (mode === 'practice') ? 'flex' : 'none');
    setDisplay('cerat-controller', (mode === 'cerat') ? 'flex' : 'none');
    setDisplay('eval-controller', (mode === 'evaluator') ? 'flex' : 'none');
    setDisplay('github-bar', (mode === 'evaluator') ? 'flex' : 'none');
    setDisplay('tab-report-btn', (mode === 'evaluator') ? 'inline-block' : 'none');
    setDisplay('timer-box', (mode === 'compete') ? 'flex' : 'none');
    setDisplay('hint-box', (mode === 'compete') ? 'flex' : 'none');
    setDisplay('hint-btn', (mode === 'compete') ? 'inline-flex' : 'none');
    setDisplay('pause-btn', (mode === 'compete') ? 'inline-flex' : 'none');
    setDisplay('restart-btn', (mode === 'compete') ? 'inline-flex' : 'none');

    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";

    if (AppState.gameMode === 'compete') {
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = AppState.currentLang === 'tr' ? "Yarışma Modu (Aşamalı)" : "Competition Mode";
        AppState.currentLevel = 1;
        AppState.score = 0;
        AppState.hintsLeft = 3;
        updateHintsUI();
        updateScoreUI();
        startCompetitionTimer();
        loadLevel(AppState.currentLevel);
    } else if (AppState.gameMode === 'practice') {
        clearInterval(AppState.timerInterval);
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = AppState.currentLang === 'tr' ? "Serbest Antrenman Modu" : "Free Practice Mode";
        const ind = document.getElementById('level-indicator');
        if (ind) ind.innerText = "Serbest";
        AppState.score = 0;
        updateScoreUI();
        loadPracticeLevel(5);
    } else if (AppState.gameMode === 'cerat') {
        clearInterval(AppState.timerInterval);
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = "Cerat Modu";
        const ind = document.getElementById('level-indicator');
        if (ind) ind.innerText = "Cerat";
        AppState.score = 0;
        updateScoreUI();
        loadCeratRandom(500);
    } else if (AppState.gameMode === 'evaluator') {
        clearInterval(AppState.timerInterval);
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = "42 Gerçek C Compiler & Evo Laboratuvarı";
        const ind = document.getElementById('level-indicator');
        if (ind) ind.innerText = "Evo Test";
        AppState.score = 0;
        updateScoreUI();
        setCheckerOS('linux');
        resetEvalMode();
    }
}

function handleHomeNavigation() {
    if (AppState.gameMode === 'compete') {
        if (confirm(AppState.currentLang === 'tr' ? "Yarışmadan çıkmak istediğinize emin misiniz? Puanınız sıfırlanır." : "Are you sure you want to exit? Your progress will reset.")) {
            clearInterval(AppState.timerInterval);
            const modeModal = document.getElementById('mode-modal');
            if (modeModal) modeModal.style.display = 'flex';
        }
    } else {
        const modeModal = document.getElementById('mode-modal');
        if (modeModal) modeModal.style.display = 'flex';
    }
}

// --- İPUCU (HINT) MEKANİĞİ ---
function updateHintsUI() {
    const hintInd = document.getElementById('hint-indicator');
    if (hintInd) hintInd.innerText = `💡 ${AppState.hintsLeft}`;

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        if (AppState.hintsLeft <= 0) {
            hintBtn.style.opacity = "0.5";
            hintBtn.style.cursor = "not-allowed";
        } else {
            hintBtn.style.opacity = "1";
            hintBtn.style.cursor = "pointer";
        }
    }
}

function useHint() {
    if (AppState.hintsLeft <= 0) {
        UI.showToast(I18N[AppState.currentLang].toast_no_hints, "error");
        return;
    }
    if (AppState.isSimulating || (AppState.gameMode === 'compete' && AppState.isPaused)) return;

    // Mevcut pipeline komutlarını klon yığınlarda işletip anlık durumu hesapla
    const simA = [...AppState.initialStack];
    const simB = [];
    AppState.userPipeline.forEach(op => Engine.applyOp(op, simA, simB));

    const nextOp = Solver.getBestNextMove(simA, simB);

    if (!nextOp) {
        UI.showToast(AppState.currentLang === 'tr' ? "Dizi zaten sıralı durumda!" : "Stack is already sorted!", "success");
        return;
    }

    AppState.hintsLeft--;
    updateHintsUI();

    addCommandToPipeline(nextOp);

    const msg = I18N[AppState.currentLang].toast_hint_used
        .replace('{cmd}', nextOp)
        .replace('{left}', AppState.hintsLeft);
    UI.showToast(msg, "success");
}

// --- SEVİYE & YARIŞMA AKIŞI ---
function loadLevel(lvl) {
    AppState.isSimulating = false;
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);

    const count = lvl + 2;
    AppState.initialStack = Engine.generateRandomArray(count);
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];

    AppState.optimalSolutionLength = Solver.calculateTargetOps(count);

    const ind = document.getElementById('level-indicator');
    if (ind) ind.innerText = `${lvl} / ${AppState.maxLevel}`;
    const best = document.getElementById('best-moves-count');
    if (best) best.innerText = AppState.optimalSolutionLength;
    const tracker = document.getElementById('live-step-tracker');
    if (tracker) tracker.innerText = AppState.currentLang === 'tr' ? "Canlı Adım: Bekleniyor" : "Live Step: Ready";

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function nextCompLevel() {
    if (AppState.currentLevel < AppState.maxLevel) {
        AppState.currentLevel++;

        // Seviye 7, 9, 11 ve 13'te bonus ipucu hakkı
        if ([7, 9, 11, 13].includes(AppState.currentLevel)) {
            AppState.hintsLeft++;
            updateHintsUI();
            UI.showToast(I18N[AppState.currentLang].toast_bonus_hint, "success");
        }

        setTimeout(() => loadLevel(AppState.currentLevel), 1200);
    } else {
        saveScoreToFirebase(AppState.playerName, AppState.playerCampus, AppState.score);
        UI.triggerConfetti();
        alert(`🎉 TEBRİKLER! 13 seviyenin tamamını başarıyla bitirdiniz!\nToplam Skor: ${AppState.score}`);
    }
}

function evaluateResult() {
    const isSorted = Engine.isSorted(AppState.stackA, AppState.stackB);
    const steps = AppState.userPipeline.length;

    if (!isSorted) {
        UI.showToast(AppState.currentLang === 'tr' ? "Sayılar sıralanmadı veya Stack B boş değil! (0 Puan)" : "Numbers unsorted or Stack B not empty! (0 Pts)", "error");
        return;
    }

    if (AppState.gameMode === 'practice') {
        UI.showToast(AppState.currentLang === 'tr' ? "Tebrikler! Dizi sıralandı." : "Congratulations! Array sorted.", "success");
        setTimeout(() => {
            const sel = document.getElementById('practice-count-select');
            const selVal = sel ? sel.value : 5;
            loadPracticeLevel(selVal);
        }, 1200);
        return;
    }

    if (steps < AppState.optimalSolutionLength) {
        AppState.score += 200;
        updateScoreUI();
        UI.showToast(`Efsanevi! Hedefin altında tamamladın. +200 Puan!`, "success");
        nextCompLevel();
    } else if (steps === AppState.optimalSolutionLength) {
        AppState.score += 100;
        updateScoreUI();
        UI.showToast(`Kusursuz! İdeal çözüm. +100 Puan!`, "success");
        nextCompLevel();
    } else {
        AppState.score += 50;
        updateScoreUI();
        UI.showToast(`Sıralandı ancak hedeften uzun sürdü (+50 Puan)`, "warn");
        nextCompLevel();
    }
}

function updateScoreUI() {
    const scoreInd = document.getElementById('score-indicator');
    if (scoreInd) scoreInd.innerText = AppState.score;
}

// --- ZAMANLAYICI KONTROLLERİ ---
function startCompetitionTimer() {
    clearInterval(AppState.timerInterval);
    AppState.totalSeconds = 25 * 60;
    AppState.isPaused = false;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.innerText = AppState.currentLang === 'tr' ? "Durdur" : "Pause";
    updateTimerDisplay();

    AppState.timerInterval = setInterval(() => {
        if (!AppState.isPaused) {
            if (AppState.totalSeconds > 0) {
                AppState.totalSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(AppState.timerInterval);
                finishCompetitionTime();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(AppState.totalSeconds / 60).toString().padStart(2, '0');
    const s = (AppState.totalSeconds % 60).toString().padStart(2, '0');
    const timerInd = document.getElementById('timer-indicator');
    if (timerInd) timerInd.innerText = `${m}:${s}`;
}

function togglePauseComp() {
    AppState.isPaused = !AppState.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.innerText = AppState.isPaused ? (AppState.currentLang === 'tr' ? "Devam Et" : "Resume") : (AppState.currentLang === 'tr' ? "Durdur" : "Pause");
    UI.showToast(AppState.isPaused ? "Durduruldu" : "Devam ediyor", "warn");
}

function restartCompetition() {
    if (confirm("Yarışmayı baştan başlatmak istediğinize emin misiniz? Puanınız sıfırlanacaktır.")) {
        AppState.score = 0;
        AppState.hintsLeft = 3;
        updateHintsUI();
        updateScoreUI();
        startCompetitionTimer();
        AppState.currentLevel = 1;
        loadLevel(AppState.currentLevel);
    }
}

function finishCompetitionTime() {
    saveScoreToFirebase(AppState.playerName, AppState.playerCampus, AppState.score);
    alert(`SÜRE DOLDU!\nToplam Puanınız: ${AppState.score}`);
    AppState.score = 0;
    AppState.hintsLeft = 3;
    updateHintsUI();
    updateScoreUI();
    startCompetitionTimer();
    AppState.currentLevel = 1;
    loadLevel(AppState.currentLevel);
}

// --- SERBEST VE CERAT MODU KONTROLLERİ ---
function loadPracticeLevel(count) {
    AppState.isSimulating = false;
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);

    AppState.initialStack = Engine.generateRandomArray(parseInt(count));
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];

    AppState.optimalSolutionLength = Solver.calculateTargetOps(parseInt(count));
    const best = document.getElementById('best-moves-count');
    if (best) best.innerText = AppState.optimalSolutionLength;
    const tracker = document.getElementById('live-step-tracker');
    if (tracker) tracker.innerText = "Canlı Adım: Hazır";

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function changePracticeCount(val) { loadPracticeLevel(val); }

function loadCeratRandom(count) {
    const arr = Engine.generateHugeRandom(count);
    AppState.initialStack = [...arr];
    AppState.stackA = [...arr];
    AppState.stackB = [];
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);
    AppState.optimalSolutionLength = Solver.calculateTargetOps(count);
    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function promptCustomInput() {
    const input = prompt("Sayıları aralarında boşluk bırakarak girin:", "45 12 88 3 19 6");
    if (!input) return;
    const parts = input.split(/[\s,]+/).filter(x => x.trim() !== "");
    const parsed = parts.map(Number);
    if (parsed.some(isNaN) || new Set(parsed).size !== parsed.length || parsed.length < 2) {
        alert("Geçersiz veya mükerrer sayı girişi!");
        return;
    }
    AppState.initialStack = [...parsed];
    AppState.stackA = [...parsed];
    AppState.stackB = [];
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);
    AppState.optimalSolutionLength = Solver.calculateTargetOps(parsed.length);
    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

// --- BORU HATTI & SİMÜLASYON ---
function addCommandToPipeline(cmd) {
    if (AppState.isSimulating || (AppState.gameMode === 'compete' && AppState.isPaused)) return;
    AppState.userPipeline.push(cmd);
    UI.renderPipeline(AppState.userPipeline);
}

function removeCommand(idx) {
    if (AppState.isSimulating || (AppState.gameMode === 'compete' && AppState.isPaused)) return;
    AppState.userPipeline.splice(idx, 1);
    UI.renderPipeline(AppState.userPipeline);
}

function allowDrop(e) { e.preventDefault(); }
function handleDrop(e) {
    e.preventDefault();
    const cmd = e.dataTransfer.getData("text/plain");
    if (cmd) addCommandToPipeline(cmd);
}

function resetCurrentPipeline() {
    if (AppState.isSimulating || (AppState.gameMode === 'compete' && AppState.isPaused)) return;
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    UI.renderStacks(AppState.stackA, AppState.stackB);
    const tracker = document.getElementById('live-step-tracker');
    if (tracker) tracker.innerText = "Canlı Adım: Sıfırlandı";
}

async function executeUserPipeline() {
    if (AppState.isSimulating || AppState.userPipeline.length === 0 || (AppState.gameMode === 'compete' && AppState.isPaused)) return;
    AppState.isSimulating = true;

    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    UI.renderStacks(AppState.stackA, AppState.stackB);

    const speed = AppState.userPipeline.length > 100 ? 1 : 180;
    const stepSkip = AppState.userPipeline.length > 100 ? 50 : 1;

    for (let i = 0; i < AppState.userPipeline.length; i++) {
        Engine.applyOp(AppState.userPipeline[i], AppState.stackA, AppState.stackB);
        if (i % stepSkip === 0 || i === AppState.userPipeline.length - 1) {
            const tracker = document.getElementById('live-step-tracker');
            if (tracker) tracker.innerText = `Adım: ${i + 1}/${AppState.userPipeline.length} (${AppState.userPipeline[i]})`;
            UI.renderStacks(AppState.stackA, AppState.stackB);
            await new Promise(r => setTimeout(r, speed));
        }
    }

    AppState.isSimulating = false;
    if (AppState.gameMode !== 'evaluator') {
        evaluateResult();
    }
}

// --- TERMINAL & TAB YÖNETİMİ ---
function switchTerminalTab(tab) {
    AppState.activeTab = tab;
    const tabC = document.getElementById('tab-c-btn');
    const tabBin = document.getElementById('tab-bin-btn');
    const tabRep = document.getElementById('tab-report-btn');

    if (tabC) tabC.classList.toggle('active', tab === 'c');
    if (tabBin) tabBin.classList.toggle('active', tab === 'binary');
    if (tabRep) tabRep.classList.toggle('active', tab === 'report');

    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function setCheckerOS(os) {
    AppState.checkerOS = os;
    ['linux', 'mac', 'win'].forEach(k => {
        const el = document.getElementById(`btn-os-${k}`);
        if (el) el.classList.toggle('active-os', k === os);
    });
}

// --- EVO CHECKER & DERLEME ENTEGRASYONLARI (GITHUB + ZIP) ---
async function fetchGithubRepo() {
    const input = document.getElementById('github-repo-input').value.trim();
    if (!input) {
        alert("Lütfen bir GitHub repo linki girin!\nÖrnek: https://github.com/cadet/push_swap");
        return;
    }

    const term = document.getElementById('terminal-view');
    if (term) term.innerText = `[LOG] Repo klonlanıyor ve GCC ile derleniyor:\n${input}\nLütfen bekleyin...`;
    switchTerminalTab('c');
    UI.showToast("Repo derleniyor...", "warn");

    try {
        const res = await fetch(`${BACKEND_URL}/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl: input })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            if (term) term.innerText = `💥 HATA:\n${data.error}`;
            alert(`Derleme Başarısız!\n\n${data.error}`);
            return;
        }

        AppState.isCompiled = true;
        if (term) term.innerText = `/* ====================================================\n   REPO BAŞARIYLA DERLENDİ: push_swap hazır!\n   ==================================================== */\n\n${data.message}`;
        UI.showToast("Derleme başarılı!", "success");
    } catch (err) {
        alert("Bağlantı Hatası: " + err.message);
    }
}

// ZIP Dosyasını Base64 Olarak Backend'e Gönderme
function handleZipFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
        alert("Lütfen sadece .zip uzantılı bir arşiv dosyası yükleyin!");
        return;
    }

    const reader = new FileReader();
    const term = document.getElementById('terminal-view');
    if (term) term.innerText = `[LOG] ZIP dosyası okunuyor: ${file.name} (${Math.round(file.size / 1024)} KB)...\nBackend'e gönderiliyor...`;
    switchTerminalTab('c');
    UI.showToast("ZIP arşivi derleyiciye yükleniyor...", "warn");

    reader.onload = async function() {
        const base64Data = reader.result.split(',')[1];
        try {
            const res = await fetch(`${BACKEND_URL}/upload-zip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileBase64: base64Data })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                if (term) term.innerText = `💥 HATA:\n${data.error}`;
                alert(`ZIP Derleme Hatası:\n${data.error}`);
                return;
            }

            AppState.isCompiled = true;
            if (term) term.innerText = `/* ====================================================\n   ZIP BAŞARIYLA AÇILDI VE DERLENDİ: push_swap hazır!\n   ==================================================== */\n\n${data.message}`;
            UI.showToast(I18N[AppState.currentLang].toast_zip_uploaded, "success");
        } catch (err) {
            alert("Bağlantı Hatası: " + err.message);
        }
    };
    reader.readAsDataURL(file);
}

// --- ENTROPİ & EVO STRES TESTİ ---
function loadEvalWithSelectedDifficulty(count) {
    const sel = document.getElementById('eval-difficulty-select');
    const difficulty = sel ? sel.value : 'random';

    let arr;
    if (difficulty === 'nearly') {
        arr = Engine.generateNearlySortedArray(count);
    } else if (difficulty === 'worst') {
        arr = Engine.generateWorstCaseArray(count);
    } else {
        arr = Engine.generateHugeRandom(count);
    }

    runEvaluatorWithArray(arr, count, difficulty);
}

async function runEvaluatorWithArray(arr, count, difficulty) {
    if (!AppState.isCompiled) {
        alert("Lütfen önce bir GitHub repo linki çekin veya ZIP dosyası yükleyin!");
        return;
    }

    AppState.isSimulating = false;
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);

    AppState.initialStack = [...arr];
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    AppState.optimalSolutionLength = Solver.calculateTargetOps(count);

    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    document.getElementById('live-step-tracker').innerText = `./push_swap koşturuluyor...`;

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.showToast(`${count} Sayı (${difficulty}) push_swap binary'sine gönderiliyor...`, "warn");

    const result = await Solver.runPushSwapBinary(arr);

    if (!result.success) {
        alert(`Çalıştırma Hatası:\n${result.error}`);
        document.getElementById('live-step-tracker').innerText = "Crash!";
        return;
    }

    AppState.userPipeline = result.ops;
    UI.renderPipeline(AppState.userPipeline);
    document.getElementById('live-step-tracker').innerText = `Üretilen Hamle: ${result.ops.length}`;

    const term = document.getElementById('terminal-view');
    if (term) {
        term.innerText = `/* ./push_swap ÇIKTISI (${count} Sayı - Mod: ${difficulty}) */\n` +
                         `Toplam Hamle: ${result.ops.length}\n\n` +
                         result.ops.slice(0, 80).join('\n') +
                         (result.ops.length > 80 ? `\n\n... ve ${result.ops.length - 80} komut daha` : '');
    }

    UI.showToast(`Başarılı! Binary ${result.ops.length} komut üretti.`, "success");
}

async function setAndRunChecker(os) {
    setCheckerOS(os);
    if (!AppState.userPipeline || AppState.userPipeline.length === 0) {
        alert("Henüz çalıştırılmış bir hamle listesi yok!");
        return;
    }

    UI.showToast(`42 ${os.toUpperCase()} Checker simüle ediliyor...`, "warn");
    await executeUserPipeline();

    const isSorted = Engine.isSorted(AppState.stackA, AppState.stackB);
    const moves = AppState.userPipeline.length;
    const n = AppState.initialStack.length;

    if (!isSorted) {
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: KO\nProgram diziyi sıralayamadı!`);
        return;
    }

    if (n === 100) {
        const r = Solver.rate100(moves);
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: OK\nHamle: ${moves}\nBarem: ${r.label}`);
    } else if (n === 500) {
        const r = Solver.rate500(moves);
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: OK\nHamle: ${moves}\nBarem: ${r.label}`);
    } else {
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: OK\nHamle: ${moves}`);
    }
}

function resetEvalMode() {
    AppState.initialStack = [2, 1, 3, 6, 5, 8];
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    AppState.userPipeline = [];
    AppState.lastTestReport = [];
    AppState.isCompiled = false;

    UI.renderPipeline(AppState.userPipeline);
    UI.renderStacks(AppState.stackA, AppState.stackB);

    const term = document.getElementById('terminal-view');
    if (term) {
        term.innerText = `// 42 EVO TEST LABORATUVARI\n// Repo linki girin veya ZIP yükleyip derleyin.`;
    }
    const gitInput = document.getElementById('github-repo-input');
    if (gitInput) gitInput.value = "";

    switchTerminalTab('c');
    document.getElementById('best-moves-count').innerText = "6";
    document.getElementById('live-step-tracker').innerText = "Hazır";
}

async function runEvoStressTest() {
    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";
    switchTerminalTab('report');

    const testSuites = [
        { id: 1, section: "Error Check", name: "Harf İçeren Argüman (1 2 a 4)", args: ["1", "2", "a", "4"], expectError: true },
        { id: 2, section: "Error Check", name: "Boş Argüman ('')", args: [""], expectError: true },
        { id: 3, section: "Error Check", name: "Aralarda Boş Argüman (1 2 '' 3)", args: ["1", "2", "", "3"], expectError: true },
        { id: 4, section: "Error Check", name: "Yinelenen Sayı / Duplicate (5 2 5)", args: ["5", "2", "5"], expectError: true },
        { id: 5, section: "Error Check", name: "MAX_INT Aşımı (2147483648)", args: ["2147483648"], expectError: true },
        { id: 6, section: "Error Check", name: "MIN_INT Aşımı (-2147483649)", args: ["-2147483649"], expectError: true },
        { id: 7, section: "Parsing Check", name: "Çift Tırnak İçinde Dizi ('3 2 1')", args: ["3 2 1"], expectSortedArgs: [3, 2, 1], maxMoves: 3 },
        { id: 8, section: "Parsing Check", name: "Karma Tırnak & Dizi (1 '5 2' 4 3)", args: ["1", "5 2", "4", "3"], expectSortedArgs: [1, 5, 2, 4, 3], maxMoves: 12 },
        { id: 9, section: "Identity Test", name: "Zaten Sıralı (0 Hamle Kuralı)", args: ["1", "2", "3", "4", "5"], maxMoves: 0 },
        { id: 10, section: "Simple Version", name: "3 Elemanlı Sınav (2 1 0)", args: ["2", "1", "0"], maxMoves: 3 },
        { id: 11, section: "Simple Version", name: "5 Elemanlı Sınav (1 5 2 4 3)", args: ["1", "5", "2", "4", "3"], maxMoves: 12 },
        { id: 12, section: "Entropy Check", name: "100 Worst-Case (Ters Dizi)", args: Engine.generateWorstCaseArray(100), is100Scale: true },
        { id: 13, section: "Middle Version", name: "100 Standart Rastgele", args: Engine.generateHugeRandom(100), is100Scale: true },
        { id: 14, section: "Advanced Version", name: "500 Standart Rastgele", args: Engine.generateHugeRandom(500), is500Scale: true }
    ];

    AppState.lastTestReport = [];
    let passedAll = true;

    for (const test of testSuites) {
        UI.showToast(`Test ${test.id}: ${test.name}...`, "warn");
        const result = await Solver.runPushSwapBinary(test.args);
        let status = "PASSED";
        let detail = "";

        if (!result.success) {
            status = "FAILED";
            detail = result.error;
            passedAll = false;
        } else if (test.expectError) {
            if (result.isErrorOutput) {
                detail = "OK: Beklendiği gibi 'Error' bastı.";
            } else {
                status = "FAILED";
                detail = "KO: Hatalı girdide 'Error' basmadı!";
                passedAll = false;
            }
        } else if (result.isErrorOutput) {
            status = "FAILED";
            detail = "KO: Geçerli girdide program 'Error' bastı!";
            passedAll = false;
        } else {
            const moves = result.ops.length;
            let targetNumbers = [];
            if (test.expectSortedArgs) {
                targetNumbers = [...test.expectSortedArgs];
            } else {
                targetNumbers = test.args.flatMap(x => String(x).trim().split(/\s+/)).map(Number);
            }

            const testA = [...targetNumbers];
            const testB = [];
            result.ops.forEach(op => Engine.applyOp(op, testA, testB));
            const ok = Engine.isSorted(testA, testB);

            if (test.maxMoves === 0 && moves > 0) {
                status = "FAILED";
                detail = `0 Hamle İhlali: Sıralı diziye ${moves} hamle bastı!`;
                passedAll = false;
            } else if (!ok) {
                status = "FAILED";
                detail = `KO: Sıralanmadı (${moves} hamle)`;
                passedAll = false;
            } else if (test.is100Scale) {
                const rating = Solver.rate100(moves);
                if (rating.score === 0) {
                    status = "FAILED";
                    detail = `Barem Aşıldı: ${moves} hamle`;
                    passedAll = false;
                } else {
                    detail = `OK (${moves} hamle) -> ${rating.label}`;
                }
            } else if (test.is500Scale) {
                const rating = Solver.rate500(moves);
                if (rating.score === 0) {
                    status = "FAILED";
                    detail = `Barem Aşıldı: ${moves} hamle`;
                    passedAll = false;
                } else {
                    detail = `OK (${moves} hamle) -> ${rating.label}`;
                }
            } else if (test.maxMoves !== undefined && moves > test.maxMoves) {
                status = "FAILED";
                detail = `Barem Aşıldı: ${moves} > ${test.maxMoves}`;
                passedAll = false;
            } else {
                detail = `OK (${moves} hamle)`;
            }
        }

        AppState.lastTestReport.push({
            id: test.id,
            section: test.section,
            name: test.name,
            arg: test.args.slice(0, 3).join(" ") + (test.args.length > 3 ? "..." : ""),
            status: status,
            detail: detail
        });

        UI.renderTerminal('report', AppState.initialStack);
        if (!passedAll) break;
    }

    if (passedAll) {
        UI.triggerConfetti();
        alert("🎉 TEBRİKLER! Kod tüm hata yönetimi ve barem testlerini eksiksiz geçti!");
    } else {
        UI.showToast("💥 Kod testten geçemedi! Detaylar raporda.", "error");
    }
}

// --- ONLINE FIREBASE LİDERLİK TABLOSU ---
async function saveScoreToFirebase(name, campus, score) {
    // Yerel önbelleğe yaz
    let localList = JSON.parse(localStorage.getItem('ps_leaderboard') || '[]');
    const existing = localList.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        if (score > existing.score) {
            existing.score = score;
            existing.campus = campus;
            existing.date = new Date().toLocaleDateString('tr-TR');
        }
    } else {
        localList.push({ name, campus, score, date: new Date().toLocaleDateString('tr-TR') });
    }
    localList.sort((a, b) => b.score - a.score);
    localStorage.setItem('ps_leaderboard', JSON.stringify(localList));

    // Firebase REST API ile buluta kaydet
    try {
        const documentId = `${name.toLowerCase()}_${campus.replace(/\s+/g, '').toLowerCase()}`;
        const url = `${FIREBASE_CONFIG.collectionUrl}/${documentId}`;

        const payload = {
            fields: {
                name: { stringValue: name },
                campus: { stringValue: campus },
                score: { integerValue: String(score) },
                date: { stringValue: new Date().toLocaleDateString('tr-TR') }
            }
        };

        await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        UI.showToast("Skor buluta kaydedildi!", "success");
    } catch (e) {
        console.warn("Firebase kaydı atlandı, yerel skor saklandı.");
    }
}

async function fetchLeaderboardData() {
    const now = Date.now();
    // 30 saniyelik cache kontrolü
    if (now - AppState.leaderboardLastFetch < 30000 && AppState.leaderboardCache.length > 0) {
        return AppState.leaderboardCache;
    }

    try {
        const res = await fetch(FIREBASE_CONFIG.collectionUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.documents && data.documents.length > 0) {
                const cloudScores = data.documents.map(doc => {
                    const f = doc.fields;
                    return {
                        name: f.name ? f.name.stringValue : "Anonim",
                        campus: f.campus ? f.campus.stringValue : "42 Istanbul",
                        score: f.score ? parseInt(f.score.integerValue, 10) : 0,
                        date: f.date ? f.date.stringValue : ""
                    };
                });
                cloudScores.sort((a, b) => b.score - a.score);
                AppState.leaderboardCache = cloudScores;
                AppState.leaderboardLastFetch = now;
                return cloudScores;
            }
        }
    } catch (e) {
        console.warn("Bulut tablosu alınamadı, yerel tablo kullanılıyor.");
    }

    // Fallback: localStorage
    const local = JSON.parse(localStorage.getItem('ps_leaderboard') || '[]');
    AppState.leaderboardCache = local;
    return local;
}

async function openLeaderboardModal() {
    UI.toggleModal('leaderboard-modal', true);
    const data = await fetchLeaderboardData();
    UI.renderLeaderboard(data, AppState.activeLeaderboardTab);
}

function switchLeaderboardTab(tab) {
    AppState.activeLeaderboardTab = tab;
    const btnCadets = document.getElementById('lb-tab-cadets');
    const btnCampuses = document.getElementById('lb-tab-campuses');

    if (btnCadets) btnCadets.classList.toggle('active-os', tab === 'cadets');
    if (btnCampuses) btnCampuses.classList.toggle('active-os', tab === 'campuses');

    UI.renderLeaderboard(AppState.leaderboardCache, tab);
}
