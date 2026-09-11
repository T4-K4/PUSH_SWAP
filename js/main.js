function initApp() {
    UI.renderCommandsPanel();
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function closeInitialGuide() {
    UI.toggleModal('guide-modal', false);
    if (!AppState.isFirstGuideSeen) {
        AppState.isFirstGuideSeen = true;
        document.getElementById('login-modal').style.display = 'flex';
        setTimeout(() => document.getElementById('login-input-field').focus(), 100);
    }
}

function submitLogin() {
    const inputVal = document.getElementById('login-input-field').value.trim();
    if (inputVal !== "") AppState.playerName = inputVal;
    document.getElementById('player-name').innerText = AppState.playerName;
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('mode-modal').style.display = 'flex';
}

function promptChangeName() {
    const n = prompt("Yeni kullanıcı adı:", AppState.playerName);
    if (n && n.trim() !== "") {
        AppState.playerName = n.trim();
        document.getElementById('player-name').innerText = AppState.playerName;
    }
}

function handleHomeNavigation() {
    if (AppState.gameMode === 'compete') {
        if (confirm("Yarışmadan çıkmak istediğinize emin misiniz? Mevcut ilerlemeniz sıfırlanır.")) {
            clearInterval(AppState.timerInterval);
            document.getElementById('mode-modal').style.display = 'flex';
        }
    } else {
        document.getElementById('mode-modal').style.display = 'flex';
    }
}

function switchTerminalTab(tab) {
    AppState.activeTab = tab;
    document.getElementById('tab-c-btn').classList.toggle('active', tab === 'c');
    document.getElementById('tab-bin-btn').classList.toggle('active', tab === 'binary');
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
}

function setCheckerOS(os) {
    AppState.checkerOS = os;
    ['linux', 'mac', 'win'].forEach(k => {
        const el = document.getElementById(`btn-os-${k}`);
        if (el) el.classList.toggle('active-os', k === os);
    });
    UI.showToast(`Checker Sistemi: ${os.toUpperCase()} seçildi.`, "warn");
}

function selectMode(mode) {
    AppState.gameMode = mode;
    document.getElementById('mode-modal').style.display = 'none';

    document.getElementById('home-btn').style.display = 'inline-flex';
    document.getElementById('practice-controller').style.display = (mode === 'practice') ? 'flex' : 'none';
    document.getElementById('cerat-controller').style.display = (mode === 'cerat') ? 'flex' : 'none';
    document.getElementById('eval-controller').style.display = (mode === 'evaluator') ? 'flex' : 'none';
    document.getElementById('solve-cerat-btn').style.display = (mode === 'cerat') ? 'inline-flex' : 'none';
    document.getElementById('eval-paste-btn').style.display = (mode === 'evaluator') ? 'inline-flex' : 'none';
    document.getElementById('timer-box').style.display = (mode === 'compete') ? 'flex' : 'none';
    document.getElementById('pause-btn').style.display = (mode === 'compete') ? 'inline-flex' : 'none';
    document.getElementById('restart-btn').style.display = (mode === 'compete') ? 'inline-flex' : 'none';

    const term = document.getElementById('terminal-view');
    term.contentEditable = "false";

    if (AppState.gameMode === 'compete') {
        document.getElementById('stage-mode-label').innerText = "Yarışma Modu (Aşamalı)";
        AppState.currentLevel = 1;
        AppState.score = 0;
        updateScoreUI();
        startCompetitionTimer();
        loadLevel(AppState.currentLevel);
    } else if (AppState.gameMode === 'practice') {
        clearInterval(AppState.timerInterval);
        document.getElementById('stage-mode-label').innerText = "Serbest Antrenman Modu (Süresiz)";
        document.getElementById('level-indicator').innerText = "Serbest";
        AppState.score = 0;
        updateScoreUI();
        loadPracticeLevel(5);
    } else if (AppState.gameMode === 'cerat') {
        clearInterval(AppState.timerInterval);
        document.getElementById('stage-mode-label').innerText = "Cerat Modu (Özel Dizi & Optimize Algoritma)";
        document.getElementById('level-indicator').innerText = "Cerat";
        AppState.score = 0;
        updateScoreUI();
        loadCeratRandom(500);
    } else if (AppState.gameMode === 'evaluator') {
        clearInterval(AppState.timerInterval);
        document.getElementById('stage-mode-label').innerText = "Evo & 42 Checker Test Laboratuvarı";
        document.getElementById('level-indicator').innerText = "Evo Test";
        AppState.score = 0;
        updateScoreUI();
        setCheckerOS('linux');

        AppState.initialStack = [2, 1, 3, 6, 5, 8];
        AppState.stackA = [...AppState.initialStack];
        AppState.stackB = [];
        AppState.userPipeline = [];
        UI.renderPipeline(AppState.userPipeline);
        UI.renderStacks(AppState.stackA, AppState.stackB);

        term.contentEditable = "true";
        term.innerText = `// 42 CHECKER TERMINALI\n// Komutlarını buraya satır satır yapıştırabilirsin:\nsa\npb\npb\nsa\npa\npa`;
        document.getElementById('live-step-tracker').innerText = "Komutları Yapıştır & Çalıştır";
    }
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

    document.getElementById('level-indicator').innerText = `${lvl} / ${AppState.maxLevel}`;
    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    document.getElementById('live-step-tracker').innerText = "Canlı Adım: Bekleniyor";

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

    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    document.getElementById('live-step-tracker').innerText = "Canlı Adım: Hazır";

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
    document.getElementById('best-moves-count').innerText = AppState.optimalSolutionLength;
    document.getElementById('live-step-tracker').innerText = `Hazır (${n} Eleman)`;

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

function autoSolveCerat() {
    if (AppState.initialStack.length === 0) return;
    AppState.userPipeline = Solver.autoSolve(AppState.initialStack);
    UI.renderPipeline(AppState.userPipeline);
    UI.renderTerminal(AppState.activeTab, AppState.initialStack);
    UI.showToast(`Optimize edildi: ${AppState.initialStack.length} eleman ${AppState.userPipeline.length} hamlede çözüldü!`, "success");
}

async function evalRunPastedCommands() {
    const term = document.getElementById('terminal-view');
    const rawText = term.innerText;
    const lines = rawText.split('\n')
        .map(x => x.trim().toLowerCase())
        .filter(x => x && !x.startsWith('//') && !x.startsWith('#'));

    const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
    const invalidOps = lines.filter(op => !validOps.includes(op));

    if (invalidOps.length > 0) {
        alert(`42 ${AppState.checkerOS.toUpperCase()} Checker Sonucu:\nError\n(Geçersiz hamle: "${invalidOps[0]}")`);
        return;
    }

    AppState.userPipeline = lines;
    UI.renderPipeline(AppState.userPipeline);
    await executeUserPipeline();

    if (Engine.isSorted(AppState.stackA, AppState.stackB)) {
        UI.triggerConfetti();
        alert(`TEBRİKLER! [42 ${AppState.checkerOS.toUpperCase()} CHECKER]\nSonuç: OK\nDizi başarıyla sıralandı!`);
    } else {
        alert(`[42 ${AppState.checkerOS.toUpperCase()} CHECKER]\nSonuç: KO\nDizi sıralanmadı ya da B yığını boş değil!`);
    }
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
    document.getElementById('live-step-tracker').innerText = "Canlı Adım: Sıfırlandı";
}

async function executeUserPipeline() {
    if (AppState.isSimulating || AppState.userPipeline.length === 0 || (AppState.gameMode === 'compete' && AppState.isPaused)) return;
    AppState.isSimulating = true;

    AppState.stackA = [...AppState.initialStack];
    AppState.stackB = [];
    UI.renderStacks(AppState.stackA, AppState.stackB);

    const speed = AppState.userPipeline.length > 100 ? 2 : 180;
    const stepSkip = AppState.userPipeline.length > 100 ? 50 : 1;

    for (let i = 0; i < AppState.userPipeline.length; i++) {
        Engine.applyOp(AppState.userPipeline[i], AppState.stackA, AppState.stackB);
        if (i % stepSkip === 0 || i === AppState.userPipeline.length - 1) {
            document.getElementById('live-step-tracker').innerText = `Adım: ${i + 1}/${AppState.userPipeline.length} (${AppState.userPipeline[i]})`;
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

    if (AppState.gameMode === 'cerat') {
        UI.showToast(`Başarılı! ${AppState.initialStack.length} sayı ${steps} hamlede tamamlandı.`, "success");
        return;
    }

    if (AppState.gameMode === 'practice') {
        UI.showToast("Tebrikler! Dizi sıralandı.", "success");
        setTimeout(() => {
            const selVal = document.getElementById('practice-count-select').value;
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
        UI.showToast(`Sıralandı ancak hedeften (${AppState.optimalSolutionLength}) uzun sürdü! (+50 Puan)`, "warn");
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
    document.getElementById('score-indicator').innerText = AppState.score;
}

function startCompetitionTimer() {
    clearInterval(AppState.timerInterval);
    AppState.totalSeconds = 25 * 60;
    AppState.isPaused = false;
    document.getElementById('pause-btn').innerText = "Durdur";
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
    document.getElementById('timer-indicator').innerText = `${m}:${s}`;
}

function togglePauseComp() {
    AppState.isPaused = !AppState.isPaused;
    document.getElementById('pause-btn').innerText = AppState.isPaused ? "Devam Et" : "Durdur";
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