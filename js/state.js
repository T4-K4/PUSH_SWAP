const AppState = {
    // Dil ve Kimlik
    currentLang: localStorage.getItem('ps_lang') || 'tr',
    playerName: localStorage.getItem('ps_nick') || "cadet42",
    playerCampus: localStorage.getItem('ps_campus') || "42 Istanbul",

    // Oyun ve Seviye Durumu
    gameMode: 'practice', // 'compete', 'practice', 'cerat', 'evaluator'
    currentLevel: 1,
    maxLevel: 13,
    score: 0,
    optimalSolutionLength: 2,

    // Sunucu Tarafı Doğrulama & Anti-Cheat (Yarışma Modu)
    sessionId: null,
    serverLevels: [],
    completedSolutions: [], // { level: 1, ops: [...] }

    // İpucu Sistemi
    hintsLeft: 3,

    // Yığınlar ve Boru Hattı
    initialStack: [],
    stackA: [],
    stackB: [],
    userPipeline: [],
    isSimulating: false,

    // Zamanlayıcı
    totalSeconds: 25 * 60,
    timerInterval: null,
    isPaused: false,

    // Terminal ve Checker Durumu
    activeTab: 'c', // 'c', 'binary', 'report'
    checkerOS: 'linux',
    isCompiled: false,
    lastTestReport: [],
    evalDifficulty: 'random', // 'random', 'nearly', 'worst'

    // Liderlik Tablosu
    activeLeaderboardTab: 'cadets', // 'cadets', 'campuses'
    leaderboardCache: [],
    leaderboardLastFetch: 0
};
