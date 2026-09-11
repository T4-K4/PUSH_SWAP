const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
let currentRepoDir = null;

// CORS Başlıkları
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
        // Body boyutu 2MB'ı aşarsa bağlantıyı kes (Payload DoS koruması)
        if (body.length > 2 * 1024 * 1024) {
            req.destroy();
        }
    });

    req.on('end', () => {
        let parsed = {};
        if (body) {
            try { parsed = JSON.parse(body); } catch (e) {}
        }

        // 1. DERLEME ENDPOINT'I
        if (req.url === '/api/compile' && req.method === 'POST') {
            let { repoUrl } = parsed;
            if (!repoUrl) return sendJson(res, 400, { success: false, error: 'Repo linki boş!' });

            // Sadece meşru git/github bağlantılarına izin ver (SSRF ve URL Injection koruması)
            const cleanUrl = repoUrl.trim();
            if (!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\.git)?$/.test(cleanUrl)) {
                return sendJson(res, 400, { success: false, error: 'Geçersiz format! Sadece geçerli GitHub repository bağlantıları kabul edilir.' });
            }

            const tempDir = path.join(os.tmpdir(), `ps_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
            fs.mkdirSync(tempDir, { recursive: true });

            console.log(`[+] İzole klon başlatılıyor: ${cleanUrl}`);

            // Klonlama komutu
            const cloneCmd = `git clone --depth 1 --recurse-submodules --shallow-submodules "${cleanUrl}" .`;

            exec(cloneCmd, { cwd: tempDir, timeout: 35000 }, (cloneErr) => {
                if (cloneErr) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: `Git Klonlama Başarısız (Gizli repo veya hatalı link): ${cloneErr.message}` });
                }

                // Dizin alias'ları
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
                    return sendJson(res, 400, { success: false, error: 'Bu repoda hiç .c dosyası bulunamadı!' });
                }

                const includeFlags = dirs.map(d => `-I"${d}"`).join(' ');

                const mains = [];
                const nonMains = [];

                cFiles.forEach(file => {
                    if (hasMain(file)) {
                        mains.push(file);
                    } else {
                        nonMains.push(file);
                    }
                });

                if (mains.length === 0) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: "Geçersiz Kod: Projede 'main' fonksiyonu bulunamadı!" });
                }

                let chosenMain = mains.find(f => {
                    const b = path.basename(f).toLowerCase();
                    return !b.includes('checker') && !b.includes('bonus');
                }) || mains[0];

                const unusedMains = mains.filter(f => f !== chosenMain).map(f => path.relative(tempDir, f));
                const compileTargets = [chosenMain, ...nonMains];

                // GCC Derleme: -w ile uyarıları yut, binary'yi üret
                const gccCmd = `gcc -w ${includeFlags} ${compileTargets.map(f => `"${f}"`).join(' ')} -o push_swap`;

                console.log(`[+] GCC ile derleniyor...`);

                exec(gccCmd, { cwd: tempDir, timeout: 45000 }, (gccErr, stdout, stderr) => {
                    const binaryPath = path.join(tempDir, 'push_swap');

                    if (!fs.existsSync(binaryPath)) {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        return sendJson(res, 400, {
                            success: false,
                            error: `Derleme Başarısız (Syntax / Kod Hatası):\n${stderr || stdout || "push_swap üretilemedi!"}`
                        });
                    }

                    // Sadece çalıştırma izni ver, yazma izinlerini kısıtla
                    try { fs.chmodSync(binaryPath, 0o755); } catch (e) {}

                    // SANDBOX DOĞRULAMA: ulimit ile fork-bomb ve bellek koruması
                    const testCmd = `ulimit -u 30 -v 200000; ./push_swap 2 1 3`;

                    exec(testCmd, { cwd: tempDir, timeout: 4000 }, (runErr, runStdout) => {
                        const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
                        const lines = (runStdout || '').split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);

                        const isPushSwapCompatible = lines.length > 0 && lines.every(l => validOps.includes(l));

                        if (!isPushSwapCompatible && lines.length > 0) {
                            fs.rmSync(tempDir, { recursive: true, force: true });
                            return sendJson(res, 400, {
                                success: false,
                                error: `Geçersiz Program: Kod derlendi ancak 42 standart push_swap komutları yerine tanımsız çıktılar üretiyor!\nÇıktı: ${runStdout.slice(0, 80)}`
                            });
                        }

                        if (currentRepoDir && fs.existsSync(currentRepoDir)) {
                            try { fs.rmSync(currentRepoDir, { recursive: true, force: true }); } catch (e) {}
                        }
                        currentRepoDir = tempDir;

                        let note = "";
                        if (unusedMains.length > 0) {
                            note = `\n\n[UYARI] Derlemeye dahil edilmeyen ikincil main/bonus dosyaları:\n-> ` + unusedMains.join('\n-> ');
                        }

                        console.log(`[+] Derleme & Sandbox onayı tamam.`);
                        return sendJson(res, 200, {
                            success: true,
                            message: 'Kod başarıyla derlendi ve sandbox testinden geçti!' + note
                        });
                    });
                });
            });
            return;
        }

        // 2. ÇALIŞTIRMA ENDPOINT'I (ULIMIT & BUFFER KORUMALI)
        if (req.url === '/api/run' && req.method === 'POST') {
            const { args } = parsed;

            if (!currentRepoDir || !fs.existsSync(path.join(currentRepoDir, 'push_swap'))) {
                return sendJson(res, 400, { success: false, error: 'Aktif push_swap binary bulunamadı!' });
            }

            // Gelen argümanları temizle (Komut enjeksiyonunu engellemek için sadece tamsayı ve boşluk kabul et)
            let safeArgs = "";
            if (Array.isArray(args)) {
                safeArgs = args.filter(x => /^-?\d+$/.test(String(x).trim())).join(' ');
            } else if (typeof args === 'string') {
                safeArgs = args.split(/\s+/).filter(x => /^-?\d+$/.test(x.trim())).join(' ');
            }

            // Güvenli çalıştırma: Maksimum 30 proses/thread, 300MB sanal bellek, maksimum 5 saniye
            const cmd = `ulimit -u 30 -v 300000; ./push_swap ${safeArgs}`;

            exec(cmd, { cwd: currentRepoDir, timeout: 6000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    if (err.killed) {
                        return sendJson(res, 400, { success: false, error: 'TIMEOUT (Zaman Aşımı): Algoritma 5 saniye içinde sonlanmadı (Olası sonsuz döngü)!' });
                    }
                    return sendJson(res, 400, { success: false, error: `Çalışma Zamanı Hatası (Segfault/Memory Limit):\n${stderr || err.message}` });
                }

                const lines = stdout.split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);

                // Bellek patlatma koruması (20.000 satırdan fazla çıktı basan kodları durdur)
                if (lines.length > 20000) {
                    return sendJson(res, 400, {
                        success: false,
                        error: `Barem Aşımı & Buffer Sınırı: Program ${lines.length} satır hamle bastı! 42 baremlerine göre bu kod elenmiştir.`
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
                        hasInvalidCommand: true,
                        invalidCommand: invalidOp,
                        rawOutput: stdout,
                        ops: ops
                    });
                }

                return sendJson(res, 200, {
                    success: true,
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
    console.log(`====================================================`);
    console.log(`  Zırhlı Push_swap Servisi Aktif! (Port: ${PORT})`);
    console.log(`====================================================`);
});