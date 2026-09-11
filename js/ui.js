const UI = {
    renderStacks(a, b) {
        const boxA = document.getElementById('stack-a-balls');
        const boxB = document.getElementById('stack-b-balls');
        const textA = document.getElementById('stack-a-text');
        const textB = document.getElementById('stack-b-text');

        if (!boxA || !boxB || !textA || !textB) return;

        const total = a.length + b.length;

        if (total > 15) {
            boxA.style.display = 'none';
            boxB.style.display = 'none';
            textA.style.display = 'block';
            textB.style.display = 'block';

            textA.innerText = `[${a.length} Eleman]\n` + a.slice(0, 60).join(', ') + (a.length > 60 ? ' ...' : '');
            textB.innerText = `[${b.length} Eleman]\n` + (b.length > 0 ? (b.slice(0, 60).join(', ') + (b.length > 60 ? ' ...' : '')) : '(Boş)');
        } else {
            boxA.style.display = 'flex';
            boxB.style.display = 'flex';
            textA.style.display = 'none';
            textB.style.display = 'none';

            boxA.innerHTML = '';
            boxB.innerHTML = '';

            const all = [...a, ...b];
            const min = Math.min(...all);
            const max = Math.max(...all);

            const makeBall = (val, isTop) => {
                const d = document.createElement('div');
                d.className = 'ball' + (isTop ? ' top-ball' : '');
                const norm = max === min ? 0.5 : (val - min) / (max - min);
                const size = 26 + (norm * 24);
                d.style.width = `${size}px`;
                d.style.height = `${size}px`;
                d.style.fontSize = `${Math.max(11, size * 0.35)}px`;
                d.innerText = val;
                return d;
            };

            a.forEach((val, i) => boxA.appendChild(makeBall(val, i === 0)));
            b.forEach((val, i) => boxB.appendChild(makeBall(val, i === 0)));
        }
    },

    renderPipeline(pipeline) {
        const pipe = document.getElementById('pipeline');
        if (!pipe) return;
        pipe.innerHTML = '';

        if (pipeline.length > 25) {
            const counts = {};
            pipeline.forEach(cmd => counts[cmd] = (counts[cmd] || 0) + 1);

            const matrix = document.createElement('div');
            matrix.className = 'summary-matrix';

            Object.keys(counts).forEach(cmd => {
                const item = document.createElement('div');
                item.className = 'summary-item';
                item.innerHTML = `
                    <span class="summary-cmd">${cmd}</span>
                    <span class="summary-count">${counts[cmd]}</span>
                `;
                matrix.appendChild(item);
            });
            pipe.appendChild(matrix);
        } else {
            pipeline.forEach((cmd, idx) => {
                const chip = document.createElement('div');
                chip.className = 'pipeline-chip';
                chip.innerHTML = `
                    <span>${idx + 1}.${cmd}</span>
                    <span class="remove-cmd" onclick="removeCommand(${idx})">✕</span>
                `;
                pipe.appendChild(chip);
            });
        }
        const userMoves = document.getElementById('user-moves-count');
        if (userMoves) userMoves.innerText = pipeline.length;
    },

    renderCommandsPanel() {
        const panel = document.getElementById('cmd-source-list');
        if (!panel) return;
        panel.innerHTML = '<div style="font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 2px;">KOMUTLAR (Tıkla veya Sürükle)</div>';
        COMMANDS.forEach(item => {
            const card = document.createElement('div');
            card.className = 'command-card';
            card.draggable = true;
            card.ondragstart = (e) => e.dataTransfer.setData("text/plain", item.cmd);
            card.onclick = () => addCommandToPipeline(item.cmd);

            card.innerHTML = `
                <span class="cmd-tag">${item.cmd}</span>
                <span class="cmd-desc">${item.desc}</span>
            `;
            panel.appendChild(card);
        });
    },

    renderTerminal(tab, initialStack) {
        const terminal = document.getElementById('terminal-view');
        if (!terminal) return;

        if (tab === 'c') {
            if (terminal.contentEditable !== "true") {
                terminal.innerText = C_SOURCE_CODE;
            }
            terminal.scrollTop = 0;
        } else if (tab === 'binary') {
            const sorted = [...initialStack].sort((x, y) => x - y);
            const n = initialStack.length;
            let maxBits = Math.ceil(Math.log2(n || 1));
            if (maxBits < 2) maxBits = 2;

            let binText = `N: ${n} | BITS: ${maxBits}\n\n`;
            const slice = initialStack.slice(0, 35);
            slice.forEach(val => {
                const idx = sorted.indexOf(val);
                binText += `${val.toString().padStart(6, ' ')} -> [${idx.toString().padStart(4, ' ')}] -> ${idx.toString(2).padStart(maxBits, '0')}\n`;
            });
            if (n > 35) binText += `... ve ${n - 35} sayi daha\n`;
            terminal.innerText = binText;
            terminal.scrollTop = 0;
        } else if (tab === 'report') {
            if (!AppState.lastTestReport || AppState.lastTestReport.length === 0) {
                terminal.innerHTML = '<div style="color:var(--text-muted); padding:10px;">Henüz test çalıştırılmadı. "Kodu Patlatmayı Dene" butonuna basın.</div>';
                return;
            }

            let html = `<div style="font-weight:bold; color:var(--accent-blue); margin-bottom:8px;">[42 ${AppState.checkerOS.toUpperCase()} CHECKER EVO TEST RAPORU]</div>`;
            html += `<table class="test-report-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Test İsmi</th>
                        <th>Denenen Input (ARG)</th>
                        <th>Durum</th>
                        <th>Detay / Barem</th>
                    </tr>
                </thead>
                <tbody>`;

            AppState.lastTestReport.forEach(row => {
                const statusClass = row.status === 'PASSED' ? 'status-passed' : 'status-failed';
                html += `<tr>
                    <td>${row.id}</td>
                    <td><b>${row.name}</b></td>
                    <td style="color:#f59e0b;">${row.arg}</td>
                    <td class="${statusClass}">${row.status}</td>
                    <td>${row.detail}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            terminal.innerHTML = html;
        }
    },

    toggleModal(id, show) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    },

    showToast(msg, type) {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => { if (t) t.remove(); }, 3200);
    },

    triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#00d2ff', '#00e676', '#ffd600', '#ff1744', '#9d4edd', '#ffffff'];

        for (let i = 0; i < 220; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleInc: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }

        let duration = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();

                p.tiltAngle += p.tiltAngleInc;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.tilt = Math.sin(p.tiltAngle) * 15;

                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
            });

            duration++;
            if (duration < 280) {
                requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }
        }
        draw();
    }
};