const http = require('http');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
let currentRepoDir = null;

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
            if (entry.name === '.git' || entry.name === 'node_modules') continue;
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

const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 2 * 1024 * 1024) req.destroy();
    });

    req.on('end', () => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

        let parsedBody = {};
        if (body) {
            try { parsedBody = JSON.parse(body); } catch (e) {}
        }

        // HEALTH CHECK
        if (pathname === '/' && req.method === 'GET') {
            return sendJson(res, 200, {
                status: "OK",
                message: "42 Push_swap Derleme & Test Motoru Aktif!"
            });
        }

        // 1. DERLEME ENDPOINT'I
        if (pathname === '/api/compile' && req.method === 'POST') {
            let { repoUrl } = parsedBody;
            if (!repoUrl) return sendJson(res, 400, { success: false, error: 'Repo linki boş olamaz!' });

            const cleanUrl = repoUrl.trim();
            if (!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(cleanUrl)) {
                return sendJson(res, 400, { success: false, error: 'Geçersiz bağlantı! Sadece genel GitHub repo linki girin.' });
            }

            const tempDir = path.join(os.tmpdir(), `ps_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
            fs.mkdirSync(tempDir, { recursive: true });

            console.log(`[+] Repo klonlanıyor: ${cleanUrl}`);
            const cloneCmd = `git clone --depth 1 --recurse-submodules --shallow-submodules "${cleanUrl}" .`;

            exec(cloneCmd, { cwd: tempDir, timeout: 45000 }, (cloneErr) => {
                if (cloneErr) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: `Git Klonlama Hatası: ${cloneErr.message}` });
                }

                // Linux dosya sistemi case-sensitivity alias
                try {
                    const entries = fs.readdirSync(tempDir, { withFileTypes: true });
                    entries.filter(e => e.isDirectory()).forEach(d => {
                        const orig = d.name;
                        const lower = orig.toLowerCase();
                        const upper = orig.charAt(0).toUpperCase() + orig.slice(1);

                        if (orig !== lower && !fs.existsSync(path.join(tempDir, lower))) {
                            fs.symlinkSync(orig, path.join(tempDir, lower), 'dir');
                        }
                        if (orig !== upper && !fs.existsSync(path.join(tempDir, upper))) {
                            fs.symlinkSync(orig, path.join(tempDir, upper), 'dir');
                        }
                    });
                } catch (e) {}

                const { files, dirs } = scanDirectory(tempDir);
                const cFiles = files.filter(f => f.endsWith('.c'));

                if (cFiles.length === 0) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: 'Repoda .c dosyası bulunamadı!' });
                }

                const includeFlags = dirs.map(d => `-I"${d}"`).join(' ');
                const mains = [];
                const nonMains = [];

                cFiles.forEach(file => {
                    if (hasMain(file)) mains.push(file);
                    else nonMains.push(file);
                });

                if (mains.length === 0) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: "Repoda 'main' fonksiyonu bulunamadı!" });
                }

                let chosenMain = mains.find(f => {
                    const b = path.basename(f).toLowerCase();
                    return !b.includes('checker') && !b.includes('bonus');
                }) || mains[0];

                const unusedMains = mains.filter(f => f !== chosenMain).map(f => path.relative(tempDir, f));
                const compileTargets = [chosenMain, ...nonMains];
                const gccCmd = `gcc -w ${includeFlags} ${compileTargets.map(f => `"${f}"`).join(' ')} -o push_swap`;

                console.log(`[+] GCC ile derleniyor...`);
                exec(gccCmd, { cwd: tempDir, timeout: 45000 }, (gccErr, stdout, stderr) => {
                    const binaryPath = path.join(tempDir, 'push_swap');

                    if (!fs.existsSync(binaryPath)) {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        return sendJson(res, 400, {
                            success: false,
                            error: `Derleme Başarısız:\n${stderr || stdout || "push_swap üretilemedi!"}`
                        });
                    }

                    try { fs.chmodSync(binaryPath, 0o755); } catch (e) {}

                    if (currentRepoDir && fs.existsSync(currentRepoDir)) {
                        try { fs.rmSync(currentRepoDir, { recursive: true, force: true }); } catch (e) {}
                    }
                    currentRepoDir = tempDir;

                    let note = "";
                    if (unusedMains.length > 0) {
                        note = `\n\n[UYARI] Derlemeye dahil edilmeyen ikincil main dosyaları:\n-> ` + unusedMains.join('\n-> ');
                    }

                    return sendJson(res, 200, {
                        success: true,
                        message: 'Kod başarıyla derlendi ve hazır!' + note
                    });
                });
            });
            return;
        }

        // 2. ÇALIŞTIRMA ENDPOINT'I (execFile: Tırnaklı & Boş Argümanları Destekler)
        if (pathname === '/api/run' && req.method === 'POST') {
            const { args } = parsedBody;

            if (!currentRepoDir || !fs.existsSync(path.join(currentRepoDir, 'push_swap'))) {
                return sendJson(res, 400, { success: false, error: 'Aktif push_swap bulunamadı! Önce repo bağlantısını girip derleyin.' });
            }

            // Gelen argümanları diziye dönüştür
            let runArgs = [];
            if (Array.isArray(args)) {
                runArgs = args.map(x => String(x));
            } else if (typeof args === 'string') {
                runArgs = args.split(/\s+/).filter(Boolean);
            }

            const binaryPath = path.join(currentRepoDir, 'push_swap');

            // execFile kullanarak kabuk tırnaklama sorunlarını aşar ve injection'ı engeller
            execFile(binaryPath, runArgs, {
                cwd: currentRepoDir,
                timeout: 7000,
                maxBuffer: 4 * 1024 * 1024
            }, (err, stdout, stderr) => {
                const combinedOutput = ((stdout || '') + (stderr || '')).trim();
                const stderrTrimmed = (stderr || '').trim();

                // 42 Kuralı: Hatalı girdilerde "Error" basılmalı
                if (stderrTrimmed.toLowerCase().includes('error') || combinedOutput.toLowerCase().startsWith('error')) {
                    return sendJson(res, 200, {
                        success: true,
                        isErrorOutput: true,
                        rawOutput: combinedOutput,
                        ops: []
                    });
                }

                if (err) {
                    if (err.killed) {
                        return sendJson(res, 400, { success: false, error: 'TIMEOUT: Algoritma 7 saniyede bitmedi (Sonsuz Döngü)!' });
                    }
                    return sendJson(res, 400, { success: false, error: `Çalışma Hatası (Segfault/Crash):\n${stderr || err.message}` });
                }

                const lines = stdout.split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);

                if (lines.length > 20000) {
                    return sendJson(res, 400, {
                        success: false,
                        error: `Barem Aşımı: Program ${lines.length} satır hamle bastı! 42 baremlerine göre elendi.`
                    });
                }

                const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
                const ops = [];
                let invalidOp = null;

                for (const line of lines) {
                    if (validOps.includes(line)) {
                        ops.push(line);
                    } else {
                        invalidOp = line;
                        break;
                    }
                }

                if (invalidOp) {
                    return sendJson(res, 200, {
                        success: true,
                        isErrorOutput: false,
                        hasInvalidCommand: true,
                        invalidCommand: invalidOp,
                        rawOutput: stdout,
                        ops: ops
                    });
                }

                return sendJson(res, 200, {
                    success: true,
                    isErrorOutput: false,
                    hasInvalidCommand: false,
                    rawOutput: stdout,
                    ops: ops,
                    movesCount: ops.length
                });
            });
            return;
        }

        sendJson(res, 404, { error: 'Endpoint bulunamadı' });
    });
});

server.listen(PORT, () => {
    console.log(`[+] Push_swap Servisi Aktif! (Port: ${PORT})`);
});