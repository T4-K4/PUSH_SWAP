const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
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

// Klasördeki tüm dosyaları ve alt klasörleri özyinelemeli toplar
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

// Dosyada main fonksiyonu var mı kontrolü
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
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        let parsed = {};
        if (body) {
            try { parsed = JSON.parse(body); } catch (e) {}
        }

        // 1. EVRENSEL DERLEME ENDPOINT'I
        if (req.url === '/api/compile' && req.method === 'POST') {
            let { repoUrl } = parsed;
            if (!repoUrl) return sendJson(res, 400, { success: false, error: 'Repo linki boş!' });

            if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://')) {
                repoUrl = 'https://' + repoUrl;
            }

            const tempDir = path.join(os.tmpdir(), `ps_${Date.now()}`);
            fs.mkdirSync(tempDir, { recursive: true });

            console.log(`[+] Repo indiriliyor: ${repoUrl}`);

            // Submodule'ler dahil tüm repoyu çek
            const cloneCmd = `git config --global url."https://github.com/".insteadOf "git@github.com:" && git clone --depth 1 --recurse-submodules --shallow-submodules ${repoUrl} .`;

            exec(cloneCmd, { cwd: tempDir, timeout: 60000 }, (cloneErr) => {
                if (cloneErr) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: `Git indirme hatası: ${cloneErr.message}` });
                }

                // Linux Case-Sensitivity Evrensel Çözümü:
                // Repodaki her klasörün hem küçük harfli hem büyük harfli alias'ını oluştur (örn: Libft <-> libft)
                try {
                    const entries = fs.readdirSync(tempDir, { withFileTypes: true });
                    entries.filter(e => e.isDirectory()).forEach(d => {
                        const originalName = d.name;
                        const lower = originalName.toLowerCase();
                        const upper = originalName.charAt(0).toUpperCase() + originalName.slice(1);
                        
                        if (originalName !== lower && !fs.existsSync(path.join(tempDir, lower))) {
                            fs.symlinkSync(originalName, path.join(tempDir, lower), 'dir');
                        }
                        if (originalName !== upper && !fs.existsSync(path.join(tempDir, upper))) {
                            fs.symlinkSync(originalName, path.join(tempDir, upper), 'dir');
                        }
                    });
                } catch (e) {}

                // Tüm dosyaları ve klasörleri tara
                const { files, dirs } = scanDirectory(tempDir);
                const cFiles = files.filter(f => f.endsWith('.c'));

                if (cFiles.length === 0) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    return sendJson(res, 400, { success: false, error: 'Bu projede hiç .c dosyası bulunamadı!' });
                }

                // Bütün alt klasörleri GCC arama yoluna (-I) ekle
                const includeFlags = dirs.map(d => `-I"${d}"`).join(' ');

                // Main fonksiyonlarını ayıkla (Checker main'leri ana binary'ye çakışmasın)
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
                    return sendJson(res, 400, { success: false, error: "Geçersiz Kod: Projede çalıştırılabilir 'main' fonksiyonu bulunamadı!" });
                }

                // Asıl push_swap main'ini seç
                let chosenMain = mains.find(f => {
                    const b = path.basename(f).toLowerCase();
                    return !b.includes('checker') && !b.includes('bonus');
                }) || mains[0];

                // Kullanılmayan/Dışarıda kalan diğer main dosyaları
                const unusedMains = mains.filter(f => f !== chosenMain).map(f => path.relative(tempDir, f));

                // Derlenecek dosya havuzu: Seçilen main + ne kadar .c varsa hepsi
                const compileTargets = [chosenMain, ...nonMains];

                // GCC Evrensel Komutu: Uyarıları yok say (-w), ne varsa bağla ve push_swap binary'sini üret
                const gccCmd = `gcc -w ${includeFlags} ${compileTargets.map(f => `"${f}"`).join(' ')} -o push_swap`;

                console.log(`[+] GCC ile evrensel derleme koşturuluyor...`);

                exec(gccCmd, { cwd: tempDir, timeout: 60000 }, (gccErr, stdout, stderr) => {
                    const binaryPath = path.join(tempDir, 'push_swap');

                    if (!fs.existsSync(binaryPath)) {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        return sendJson(res, 400, {
                            success: false,
                            error: `Derleme Başarısız (Syntax / Kod Hatası):\n${stderr || stdout || "Binary dosya üretilemedi!"}`
                        });
                    }

                    // SENİN İSTEDİĞİN DOĞRULAMA: Çıktıyı test et, push_swap komutu basmıyorsa "Geçersiz Kod" de
                    exec(`./push_swap 2 1 3`, { cwd: tempDir, timeout: 5000 }, (runErr, runStdout) => {
                        const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
                        const lines = (runStdout || '').split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);

                        const isPushSwapCompatible = lines.length > 0 && lines.every(l => validOps.includes(l));

                        // Eğer program push_swap komutu dışında anlamsız bir metin basıyorsa
                        if (!isPushSwapCompatible && lines.length > 0) {
                            fs.rmSync(tempDir, { recursive: true, force: true });
                            return sendJson(res, 400, {
                                success: false,
                                error: `Geçersiz Kod: Program derlendi fakat 42 push_swap komutları yerine alakasız çıktılar veriyor!\nAlınan çıktı: ${runStdout.slice(0, 80)}`
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

                        console.log(`[+] DERLEME BAŞARILI. push_swap hazır.`);
                        return sendJson(res, 200, {
                            success: true,
                            message: 'Kod başarıyla derlendi ve hazır!' + note
                        });
                    });
                });
            });
            return;
        }

        // 2. ÇALIŞTIRMA ENDPOINT'I
        if (req.url === '/api/run' && req.method === 'POST') {
            const { args } = parsed;

            if (!currentRepoDir || !fs.existsSync(path.join(currentRepoDir, 'push_swap'))) {
                return sendJson(res, 400, { success: false, error: 'Aktif push_swap binary bulunamadı!' });
            }

            const argString = Array.isArray(args) ? args.join(' ') : (args || '');
            const cmd = `./push_swap ${argString}`;

            exec(cmd, { cwd: currentRepoDir, timeout: 10000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    if (err.killed) {
                        return sendJson(res, 400, { success: false, error: 'TIMEOUT: Program 10 saniyede bitmedi (Sonsuz Döngü)!' });
                    }
                    return sendJson(res, 400, { success: false, error: `Çalışma Zamanı Hatası:\n${stderr || err.message}` });
                }

                const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];
                const lines = stdout.split('\n').map(x => x.trim().toLowerCase()).filter(Boolean);
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
    console.log(`  Evrensel Push_swap Servisi Başlatıldı! (Port: ${PORT})`);
    console.log(`====================================================`);
});