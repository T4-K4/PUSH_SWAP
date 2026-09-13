const http = require('http');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const PORT = process.env.PORT || 3000;
const FIREBASE_PROJECT_ID = "push-swap-trainer-42";
let currentRepoDir = null;

// Aktif Oturum Havuzu
const activeSessions = new Map();

// Bellek Temizleyici (Garbage Collector): 45 dakikayı aşan atıl oturumları RAM'den siler
setInterval(() => {
    const now = Date.now();
    for (const [id, sess] of activeSessions.entries()) {
        if (now - sess.startTime > 45 * 60 * 1000) {
            activeSessions.delete(id);
        }
    }
}, 10 * 60 * 1000);

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const sendJson = (res, statusCode, data) => {
    setCorsHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

function scanDirectory(dir) {
    let files = [];
    let dirs = [dir];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '__MACOSX') continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                dirs.push(fullPath);
                const sub = scanDirectory(fullPath);
                files = files.concat(sub.files);
                dirs = dirs.concat(sub.dirs);
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    } catch (e) {}
    return { files, dirs };
}

function hasMain(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf8');
        return /int\s+main\s*\(/.test(text);
    } catch (e) {
        return false;
    }
}

// Simülasyon Motoru (Doğrulama)
function applyOpBackend(op, a, b) {
    if (op === 'sa') { if (a.length > 1) [a[0], a[1]] = [a[1], a[0]]; }
    else if (op === 'sb') { if (b.length > 1) [b[0], b[1]] = [b[1], b[0]]; }
    else if (op === 'ss') { applyOpBackend('sa', a, b); applyOpBackend('sb', a, b); }
    else if (op === 'pa') { if (b.length > 0) a.unshift(b.shift()); }
    else if (op === 'pb') { if (a.length > 0) b.unshift(a.shift()); }
    else if (op === 'ra') { if (a.length > 1) a.push(a.shift()); }
    else if (op === 'rb') { if (b.length > 1) b.push(b.shift()); }
    else if (op === 'rr') { applyOpBackend('ra', a, b); applyOpBackend('rb', a, b); }
    else if (op === 'rra') { if (a.length > 1) a.unshift(a.pop()); }
    else if (op === 'rrb') { if (b.length > 1) b.unshift(b.pop()); }
    else if (op === 'rrr') { applyOpBackend('rra', a, b); applyOpBackend('rrb', a, b); }
}

function isSortedBackend(a, b) {
    if (!b || b.length !== 0) return false;
    for (let i = 0; i < a.length - 1; i++) {
        if (a[i] > a[i + 1]) return false;
    }
    return true;
}

function calculateTargetOpsBackend(count) {
    if (count <= 3) return 3;
    if (count <= 5) return 12;
    if (count <= 15) return Math.max(14, Math.floor(count * 5.8));
    return Math.floor(count * 9.5);
}

function compilePushSwap(targetDir, callback) {
    try {
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        entries.filter(e => e.isDirectory()).forEach(d => {
            const orig = d.name;
            const lower = orig.toLowerCase();
            const upper = orig.charAt(0).toUpperCase() + orig.slice(1);
            if (orig !== lower && !fs.existsSync(path.join(targetDir, lower))) fs.symlinkSync(orig, path.join(targetDir, lower), 'dir');
            if (orig !== upper && !fs.existsSync(path.join(targetDir, upper))) fs.symlinkSync(orig, path.join(targetDir, upper), 'dir');
        });
    } catch (e) {}

    const { files, dirs } = scanDirectory(targetDir);
    const cFiles = files.filter(f => f.endsWith('.c'));

    if (cFiles.length === 0) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return callback({ success: false, error: 'Projeden .c uzantılı dosya bulunamadı!' });
    }

    const includeFlags = dirs.map(d => `-I"${d}"`).join(' ');
    const mains = [];
    const nonMains = [];

    cFiles.forEach(file => {
        if (hasMain(file)) mains.push(file);
        else nonMains.push(file);
    });

    if (mains.length === 0) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        return callback({ success: false, error: "Projeden 'main' fonksiyonu içeren dosya bulunamadı!" });
    }

    let chosenMain = mains.find(f => {
        const b = path.basename(f).toLowerCase();
        return !b.includes('checker') && !b.includes('bonus');
    }) || mains[0];

    const gccCmd = `gcc -w ${includeFlags} "${chosenMain}" ${nonMains.map(f => `"${f}"`).join(' ')} -o push_swap`;

    exec(gccCmd, { cwd: targetDir, timeout: 45000 }, (gccErr, stdout, stderr) => {
        const binaryPath = path.join(targetDir, 'push_swap');
        if (!fs.existsSync(binaryPath)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
            return callback({ success: false, error: `Derleme Hatası:\n${stderr || stdout || "Binary üretilemedi!"}` });
        }

        try { fs.chmodSync(binaryPath, 0o755); } catch (e) {}
        if (currentRepoDir && fs.existsSync(currentRepoDir)) {
            try { fs.rmSync(currentRepoDir, { recursive: true, force: true }); } catch (e) {}
        }
        currentRepoDir = targetDir;
        return callback({ success: true, message: 'push_swap başarıyla derlendi ve hazır!' });
    });
}

const server = http.createServer((req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

        // URL Normalizasyonu: Hem /api/... hem /... isteklerini karşılar
        let pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
        if (pathname.startsWith('/api/')) {
            pathname = pathname.substring(4);
        } else if (pathname === '/api') {
            pathname = '/';
        }

        let parsedBody = {};
        if (rawBody.length > 0) {
            try { parsedBody = JSON.parse(rawBody.toString('utf8')); } catch (e) {}
        }

        if (pathname === '/' && req.method === 'GET') {
            return sendJson(res, 200, { status: "OK", server: "42 Push_swap Master Node" });
        }

        // 1. REPO DERLEME (/compile veya /api/compile)
        if (pathname === '/compile' && req.method === 'POST') {
            let { repoUrl } = parsedBody;
            if (!repoUrl) return sendJson(res, 400, { success: false, error: 'Repo linki boş olamaz!' });
            const cleanUrl = repoUrl.trim();
            if (!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(cleanUrl)) {
                return sendJson(res, 400, { success: false, error: 'Geçersiz bağlantı! Sadece genel GitHub repo linki girin.' });
            }

            const tempDir = path.join(os.tmpdir(), `ps_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
            fs.mkdirSync(tempDir, { recursive: true });

            exec(`git clone --depth 1 --recurse-submodules --shallow-submodules "${cleanUrl}" .`, { cwd: tempDir, timeout: 45000 }, (cloneErr) => {
                if (cloneErr) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: `Git Hatası: ${cloneErr.message}` });
                }
                compilePushSwap(tempDir, (result) => sendJson(res, result.success ? 200 : 400, result));
            });
            return;
        }

        // 2. ZIP DERLEME (/upload-zip veya /api/upload-zip)
        if (pathname === '/upload-zip' && req.method === 'POST') {
            const { fileBase64 } = parsedBody;
            if (!fileBase64) return sendJson(res, 400, { success: false, error: 'ZIP verisi bulunamadı!' });

            const tempDir = path.join(os.tmpdir(), `ps_zip_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
            fs.mkdirSync(tempDir, { recursive: true });

            try {
                const zip = new AdmZip(Buffer.from(fileBase64, 'base64'));
                zip.extractAllTo(tempDir, true);
            } catch (err) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                return sendJson(res, 400, { success: false, error: `ZIP Açılamadı: ${err.message}` });
            }

            compilePushSwap(tempDir, (result) => sendJson(res, result.success ? 200 : 400, result));
            return;
        }

        // 3. BINARY ÇALIŞTIRMA (/run veya /api/run)
        if (pathname === '/run' && req.method === 'POST') {
            const { args } = parsedBody;
            if (!currentRepoDir || !fs.existsSync(path.join(currentRepoDir, 'push_swap'))) {
                return sendJson(res, 400, { success: false, error: 'Aktif push_swap binary bulunamadı! Kod yükleyin.' });
            }

            let runArgs = Array.isArray(args) ? args.map(String) : (typeof args === 'string' ? args.split(/\s+/).filter(Boolean) : []);
            const binaryPath = path.join(currentRepoDir, 'push_swap');

            execFile(binaryPath, runArgs, { cwd: currentRepoDir, timeout: 7000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
                const combined = ((stdout || '') + (stderr || '')).trim();
                if ((stderr || '').toLowerCase().includes('error') || combined.toLowerCase().startsWith('error')) {
                    return sendJson(res, 200, { success: true, isErrorOutput: true, rawOutput: combined, ops: [] });
                }
                if (err) {
                    if (err.killed) return sendJson(res, 400, { success: false, error: 'TIMEOUT: Algoritma 7 saniyede bitmedi!' });
                    return sendJson(res, 400, { success: false, error: `Crash:\n${stderr || err.message}` });
                }

                const lines = stdout.split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);
                const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
                const ops = [];
                for (const line of lines) {
                    if (validOps.includes(line)) ops.push(line);
                    else return sendJson(res, 200, { success: true, isErrorOutput: false, hasInvalidCommand: true, invalidCommand: line, ops: [] });
                }
                return sendJson(res, 200, { success: true, isErrorOutput: false, hasInvalidCommand: false, ops, movesCount: ops.length });
            });
            return;
        }

        // 4. OTURUM BAŞLATMA (/start-session veya /api/start-session)
        if (pathname === '/start-session' && req.method === 'POST') {
            const { name, campus } = parsedBody;
            if (!name || !/^[a-zA-Z0-9_-]{2,12}$/.test(name)) {
                return sendJson(res, 400, { success: false, error: 'Geçersiz 42 nick formatı!' });
            }

            const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const generatedLevels = [];

            for (let lvl = 1; lvl <= 13; lvl++) {
                const count = lvl + 2;
                const set = new Set();
                while (set.size < count) set.add(Math.floor(Math.random() * 85) + 10);
                const arr = Array.from(set);
                if (arr.every((v, i) => i === 0 || arr[i - 1] <= v)) [arr[0], arr[1]] = [arr[1], arr[0]];
                generatedLevels.push({ level: lvl, count, numbers: arr, targetOps: calculateTargetOpsBackend(count) });
            }

            activeSessions.set(sessionId, {
                name,
                campus: campus || "42 Istanbul",
                startTime: Date.now(),
                levels: generatedLevels
            });

            return sendJson(res, 200, { success: true, sessionId, levels: generatedLevels });
        }

        // 5. DOĞRULAMA VE GÜVENLİ FİREBASE YAZIMI (/verify-and-submit veya /api/verify-and-submit)
        if (pathname === '/verify-and-submit' && req.method === 'POST') {
            const { sessionId, solutions } = parsedBody;
            if (!sessionId || !activeSessions.has(sessionId)) {
                return sendJson(res, 403, { success: false, error: 'Geçersiz veya süresi dolmuş oturum!' });
            }

            const session = activeSessions.get(sessionId);
            const elapsedSeconds = (Date.now() - session.startTime) / 1000;
            const solCount = Array.isArray(solutions) ? solutions.length : 0;

            // Dinamik süre kontrolü: Seviye başına 1.2 saniyeden az sürede bitirilmişse reddeder
            if (elapsedSeconds < Math.max(5, solCount * 1.2)) {
                activeSessions.delete(sessionId);
                return sendJson(res, 400, { success: false, error: 'Hile Algılandı: İmkansız tamamlama hızı!' });
            }

            let calculatedScore = 0;
            let verifiedCount = 0;

            for (const sol of (solutions || [])) {
                const serverLevel = session.levels.find(l => l.level === sol.level);
                if (!serverLevel) continue;

                const testA = [...serverLevel.numbers];
                const testB = [];
                for (const op of sol.ops) applyOpBackend(op, testA, testB);

                if (isSortedBackend(testA, testB)) {
                    const steps = sol.ops.length;
                    if (steps < serverLevel.targetOps) calculatedScore += 200;
                    else if (steps === serverLevel.targetOps) calculatedScore += 100;
                    else calculatedScore += 50;
                    verifiedCount++;
                }
            }

            activeSessions.delete(sessionId);

            // Sunucu Tarafından Firebase REST API'ye Kayıt
            try {
                const documentId = `${session.name.toLowerCase()}_${session.campus.replace(/\s+/g, '').toLowerCase()}`;
                const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/leaderboard/${documentId}`;
                fetch(firebaseUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fields: {
                            name: { stringValue: session.name },
                            campus: { stringValue: session.campus },
                            score: { integerValue: String(calculatedScore) },
                            date: { stringValue: new Date().toLocaleDateString('tr-TR') }
                        }
                    })
                }).catch(() => {});
            } catch (e) {}

            return sendJson(res, 200, { success: true, verifiedLevels: verifiedCount, finalScore: calculatedScore });
        }

        sendJson(res, 404, { error: 'Endpoint bulunamadı' });
    });
});

server.listen(PORT, () => console.log(`[+] Production Server Aktif: Port ${PORT}`));
