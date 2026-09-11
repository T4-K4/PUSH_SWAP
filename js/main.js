// UI.toggleModal yoksa doğrudan güvenli kapatma fonksiyonu:
function closeInitialGuide() {
    const guide = document.getElementById('guide-modal');
    if (guide) {
        guide.style.display = 'none';
        guide.classList.add('hidden');
    }
    
    if (typeof UI !== 'undefined' && typeof UI.toggleModal === 'function') {
        UI.toggleModal('guide-modal', false);
    }

    if (!AppState.isFirstGuideSeen) {
        AppState.isFirstGuideSeen = true;
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'flex';
            loginModal.classList.remove('hidden');
        }
        const loginInput = document.getElementById('login-input-field');
        if (loginInput) setTimeout(() => loginInput.focus(), 100);
    }
}

window.closeInitialGuide = closeInitialGuide;

function initApp() {
    UI.renderCommandsPanel();
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function closeInitialGuide() {
    UI.toggleModal('guide-modal', false);
    if (!AppState.isFirstGuideSeen) {
        AppState.isFirstGuideSeen = true;
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'flex';
        const loginInput = document.getElementById('login-input-field');
        if (loginInput) setTimeout(() => loginInput.focus(), 100);
    }
}

function submitLogin() {
    const inputField = document.getElementById('login-input-field');
    const inputVal = inputField ? inputField.value.trim() : "";
    if (inputVal !== "") AppState.playerName = inputVal;
    
    const pName = document.getElementById('player-name');
    if (pName) pName.innerText = AppState.playerName;

    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.style.display = 'none';

    const modeModal = document.getElementById('mode-modal');
    if (modeModal) modeModal.style.display = 'flex';
}

function promptChangeName() {
    const n = prompt("Yeni kullanıcı adı:", AppState.playerName);
    if (n && n.trim() !== "") {
        AppState.playerName = n.trim();
        const pName = document.getElementById('player-name');
        if (pName) pName.innerText = AppState.playerName;
    }
}

function handleHomeNavigation() {
    if (AppState.gameMode === 'compete') {
        if (confirm("Yarışmadan çıkmak istediğinize emin misiniz? Mevcut ilerlemeniz sıfırlanır.")) {
            clearInterval(AppState.timerInterval);
            const modeModal = document.getElementById('mode-modal');
            if (modeModal) modeModal.style.display = 'flex';
        }
    } else {
        const modeModal = document.getElementById('mode-modal');
        if (modeModal) modeModal.style.display = 'flex';
    }
}

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

// GITHUB REPOSUNU BACKEND'E GÖNDERİP GERÇEKTEN DERLEYEN FONKSİYON (RENDER ENTEGRASYONLU)
async function fetchGithubRepo() {
    const input = document.getElementById('github-repo-input').value.trim();
    if (!input) {
        alert("Lütfen bir GitHub repo linki girin!\nÖrnek: https://github.com/kullanici/push_swap");
        return;
    }

    const term = document.getElementById('terminal-view');
    if (term) {
        term.innerText = `[LOG] Bulut derleyicisine bağlanılıyor (https://push-swap-mw5i.onrender.com)...\n[LOG] git clone ${input}\n[LOG] make ve GCC koşturuluyor, lütfen bekleyin (İlk açılışta sunucunun uyanması 30 sn sürebilir)...`;
    }
    switchTerminalTab('c');
    UI.showToast("Repo klonlanıyor ve izole ortamda derleniyor...", "warn");

    try {
        const res = await fetch(`${BACKEND_URL}/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl: input })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            if (term) {
                term.innerText = `💥 HATA:\n${data.error}`;
            }
            alert(`Derleme Başarısız!\n\n${data.error}`);
            return;
        }

        AppState.isCompiled = true;
        if (term) {
            term.innerText = `/* ====================================================\n` +
                             `   REPO BAŞARIYLA DERLENDİ: push_swap hazır!\n` +
                             `   ==================================================== */\n\n` +
                             `[DERLEME ÇIKTISI]:\n${data.makeOutput || data.message || "Başarıyla derlendi."}`;
        }

        UI.showToast("Repo başarıyla derlendi! Artık 100/500 sayı koşturabilirsiniz.", "success");
    } catch (err) {
        alert("Backend Bağlantı Hatası!\nRender sunucusu uykuda olabilir veya ağ bağlantısı koptu.\nLütfen 20-30 saniye bekleyip tekrar deneyin.\nHata: " + err.message);
    }
}

// 100 VE 500 SAYI BUTONU: GERÇEK BINARY'E ARGÜMAN VERİR
async function loadEvalRandom(count) {
    if (!AppState.isCompiled) {
        alert("Lütfen önce üst bardan geçerli bir GitHub repo linki çekip derleyin!");
        return;
    }

    AppState.isSimulating = false;
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);

    const arr = Engine.generateHugeRandom(parseInt(count));
    AppState.initialStack = [...arr];
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];

    AppState.optimalSolutionLength = Solver.calculateTargetOps(parseInt(count));
    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    document.getElementById('live-step-tracker').innerText = `./push_swap ${count} sayıyla koşturuluyor...`;

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.showToast(`${count} rastgele sayı ./push_swap binary'sine gönderiliyor...`, "warn");

    const result = await Solver.runPushSwapBinary(arr);

    if (!result.success) {
        alert(`Çalıştırma Hatası:\n${result.error}`);
        document.getElementById('live-step-tracker').innerText = "Program Patladı!";
        return;
    }

    AppState.userPipeline = result.ops;
    UI.renderPipeline(AppState.userPipeline);
    document.getElementById('live-step-tracker').innerText = `Üretilen Hamle: ${result.ops.length}`;

    const term = document.getElementById('terminal-view');
    if (term) {
        term.innerText = `/* ./push_swap ÇIKTISI (${count} Sayı) */\n` +
                         `Toplam Hamle: ${result.ops.length}\n\n` +
                         result.ops.slice(0, 80).join('\n') +
                         (result.ops.length > 80 ? `\n\n... ve ${result.ops.length - 80} komut daha` : '');
    }

    UI.showToast(`Başarılı! Binary çalıştı ve ${result.ops.length} gerçek komut üretti.`, "success");
}

// OS CHECKER: OLUŞAN ÇIKTIYI YIĞINLARDA OYNATIR
async function setAndRunChecker(os) {
    setCheckerOS(os);

    if (!AppState.userPipeline || AppState.userPipeline.length === 0) {
        alert("Henüz çalıştırılmış bir hamle listesi yok! Lütfen önce '100 Sayı' veya '500 Sayı' butonuna basın.");
        return;
    }

    UI.showToast(`42 ${os.toUpperCase()} Checker devrede. Simüle ediliyor...`, "warn");
    await executeUserPipeline();

    const isSorted = Engine.isSorted(AppState.stackA, AppState.stackB);
    const moves = AppState.userPipeline.length;
    const n = AppState.initialStack.length;

    if (!isSorted) {
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: KO\n\nProgramın ürettiği hamleler diziyi sıralayamadı!`);
        return;
    }

    if (n === 100) {
        const rating = Solver.rate100(moves);
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: OK\nHamle Sayısı: ${moves}\nBarem Puanı: ${rating.label}`);
    } else if (n === 500) {
        const rating = Solver.rate500(moves);
        alert(`[42 ${os.toUpperCase()} CHECKER]\n\nSonuç: OK\nHamle Sayısı: ${moves}\nBarem Puanı: ${rating.label}`);
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
        term.contentEditable = "true";
        term.innerText = `// 42 GERÇEK C DERLEME & EVO TEST LABORATUVARI\n// Üst bardan GitHub repo linki girip 'Kodu Çek' butonuna basın.\n// Backend 'make' ve GCC ile kodu doğrudan bulutta derleyecektir.`;
    }
    
    const gitInput = document.getElementById('github-repo-input');
    if (gitInput) gitInput.value = "";
    
    switchTerminalTab('c');
    document.getElementById('best-moves-count').innerText = "6";
    document.getElementById('live-step-tracker').innerText = "Hazır";
    UI.showToast("Evo modu sıfırlandı!", "success");
}

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
    setDisplay('solve-cerat-btn', (mode === 'cerat') ? 'inline-flex' : 'none');
    setDisplay('eval-paste-btn', (mode === 'evaluator') ? 'inline-flex' : 'none');
    setDisplay('timer-box', (mode === 'compete') ? 'flex' : 'none');
    setDisplay('pause-btn', (mode === 'compete') ? 'inline-flex' : 'none');
    setDisplay('restart-btn', (mode === 'compete') ? 'inline-flex' : 'none');

    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";

    if (AppState.gameMode === 'compete') {
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = "Yarışma Modu (Aşamalı)";
        AppState.currentLevel = 1;
        AppState.score = 0;
        updateScoreUI();
        startCompetitionTimer();
        loadLevel(AppState.currentLevel);
    } else if (AppState.gameMode === 'practice') {
        clearInterval(AppState.timerInterval);
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = "Serbest Antrenman Modu (Süresiz)";
        const ind = document.getElementById('level-indicator');
        if (ind) ind.innerText = "Serbest";
        AppState.score = 0;
        updateScoreUI();
        loadPracticeLevel(5);
    } else if (AppState.gameMode === 'cerat') {
        clearInterval(AppState.timerInterval);
        const lbl = document.getElementById('stage-mode-label');
        if (lbl) lbl.innerText = "Cerat Modu (Özel Dizi & Test)";
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
        setCheckerOS('win');
        resetEvalMode();
    }
}

async function evalRunPastedCommands() {
    await setAndRunChecker(AppState.checkerOS);
}

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
    if (tracker) tracker.innerText = "Canlı Adım: Bekleniyor";

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

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

function changePracticeCount(val) {
    loadPracticeLevel(val);
}

function setCeratStack(arr) {
    AppState.initialStack = [...arr];
    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    AppState.userPipeline = [];
    UI.renderPipeline(AppState.userPipeline);

    const n = arr.length;
    AppState.optimalSolutionLength = Solver.calculateTargetOps(n);
    const best = document.getElementById('best-moves-count');
    if (best) best.innerText = AppState.optimalSolutionLength;
    const tracker = document.getElementById('live-step-tracker');
    if (tracker) tracker.innerText = `Hazır (${n} Eleman)`;

    UI.renderStacks(AppState.stackA, AppState.stackB);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function loadCeratRandom(count) {
    const arr = Engine.generateHugeRandom(count);
    setCeratStack(arr);
}

function promptCustomInput() {
    const input = prompt("Sayıları aralarında boşluk veya virgül bırakarak girin:", "45 12 88 3 19 6");
    if (!input) return;
    const parts = input.split(/[\s,]+/).filter(x => x.trim() !== "");
    const parsed = [];
    for (let p of parts) {
        const num = parseInt(p, 10);
        if (isNaN(num)) {
            alert("Geçersiz sayı tespit edildi: " + p);
            return;
        }
        parsed.push(num);
    }
    if (new Set(parsed).size !== parsed.length) {
        alert("Hata: Yinelenen sayılar var!");
        return;
    }
    if (parsed.length < 2) {
        alert("En az 2 sayı girmelisiniz!");
        return;
    }
    setCeratStack(parsed);
}

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

function evaluateResult() {
    const isSorted = Engine.isSorted(AppState.stackA, AppState.stackB);
    const steps = AppState.userPipeline.length;

    if (!isSorted) {
        UI.showToast("Sayılar düzgün sıralanmadı veya Stack B boş değil! (0 Puan)", "error");
        return;
    }

    if (AppState.gameMode === 'practice') {
        UI.showToast("Tebrikler! Dizi sıralandı.", "success");
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
        UI.showToast(`Sıralandı ancak hedeften uzun sürdü! (+50 Puan)`, "warn");
    }
}

function nextCompLevel() {
    if (AppState.currentLevel < AppState.maxLevel) {
        AppState.currentLevel++;
        setTimeout(() => loadLevel(AppState.currentLevel), 1200);
    } else {
        saveScoreToLeaderboard(AppState.playerName, AppState.score);
        alert(`TEBRİKLER! 13 seviyenin tamamını bitirdiniz!\nToplam Skorunuz: ${AppState.score}`);
    }
}

function updateScoreUI() {
    const scoreInd = document.getElementById('score-indicator');
    if (scoreInd) scoreInd.innerText = AppState.score;
}

function startCompetitionTimer() {
    clearInterval(AppState.timerInterval);
    AppState.totalSeconds = 25 * 60;
    AppState.isPaused = false;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.innerText = "Durdur";
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
    if (pauseBtn) pauseBtn.innerText = AppState.isPaused ? "Devam Et" : "Durdur";
    UI.showToast(AppState.isPaused ? "Yarışma duraklatıldı." : "Yarışma devam ediyor.", "warn");
}

function restartCompetition() {
    if (confirm("Yarışmayı baştan başlatmak istediğinize emin misiniz? Puanınız sıfırlanacaktır.")) {
        AppState.score = 0;
        updateScoreUI();
        startCompetitionTimer();
        AppState.currentLevel = 1;
        loadLevel(AppState.currentLevel);
    }
}

function finishCompetitionTime() {
    saveScoreToLeaderboard(AppState.playerName, AppState.score);
    confirm(`SÜRE DOLDU!\nToplam Puanınız: ${AppState.score}\n\nAynı kullanıcı adıyla tekrar denemek istiyor musunuz?`);
    AppState.score = 0;
    updateScoreUI();
    startCompetitionTimer();
    AppState.currentLevel = 1;
    loadLevel(AppState.currentLevel);
}

function saveScoreToLeaderboard(name, sc) {
    let list = JSON.parse(localStorage.getItem('ps_leaderboard') || '[]');
    const existingUser = list.find(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingUser) {
        if (sc > existingUser.score) {
            existingUser.score = sc;
            existingUser.date = new Date().toLocaleDateString('tr-TR');
            UI.showToast("Yeni kişisel rekor kaydedildi!", "success");
        }
    } else {
        list.push({
            name: name,
            score: sc,
            date: new Date().toLocaleDateString('tr-TR')
        });
    }

    list.sort((a, b) => b.score - a.score);
    localStorage.setItem('ps_leaderboard', JSON.stringify(list));
}

function openLeaderboardModal() {
    const list = JSON.parse(localStorage.getItem('ps_leaderboard') || '[]');
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">Henüz kayıtlı skor bulunmuyor.</td></tr>';
    } else {
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold; color:var(--accent-yellow);">${index + 1}</td>
                <td>${item.name}</td>
                <td style="font-weight:bold; color:var(--accent-green);">${item.score}</td>
                <td style="color:var(--text-muted); font-size:12px;">${item.date}</td>
            `;
            tbody.appendChild(row);
        });
    }
    UI.toggleModal('leaderboard-modal', true);
}

window.onload = initApp;