const UI = {
    // Çoklu Dil Motoru (DOM'daki tüm [data-i18n] etiketlerini çevirir)
    applyTranslations() {
        const lang = AppState.currentLang;
        const dict = I18N[lang] || I18N['tr'];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Input placeholder'ları güncelle
        const loginInput = document.getElementById('login-input-field');
        if (loginInput && dict['login_placeholder']) {
            loginInput.placeholder = dict['login_placeholder'];
        }

        // Dil butonunun üstündeki yazıyı güncelle
        const langBtn = document.getElementById('lang-toggle-btn');
        if (langBtn) {
            langBtn.innerText = lang === 'tr' ? '🌐 EN' : '🌐 TR';
        }

        // Komutlar panelini ve terminali yeni dilde tekrar çiz
        this.renderCommandsPanel();
        this.renderTerminal(AppState.activeTab, AppState.initialStack);
    },

    renderStacks(a, b) {
        const boxA = document.getElementById('stack-a-balls');
        const boxB = document.getElementById('stack-b-balls');
        const textA = document.getElementById('stack-a-text');
        const textB = document.getElementById('stack-b-text');

        if (!boxA || !boxB || !textA || !textB) return;

        const total = (a ? a.length : 0) + (b ? b.length : 0);

        if (total > 15) {
            boxA.style.display = 'none';
            boxB.style.display = 'none';
            textA.style.display = 'block';
            textB.style.display = 'block';

            const lang = AppState.currentLang;
            const itemsLabel = lang === 'tr' ? 'Eleman' : 'Items';
            const emptyLabel = lang === 'tr' ? '(Boş)' : '(Empty)';

            textA.innerText = `[${a.length} ${itemsLabel}]\n` + a.slice(0, 60).join(', ') + (a.length > 60 ? ' ...' : '');
            textB.innerText = `[${b.length} ${itemsLabel}]\n` + (b.length > 0 ? (b.slice(0, 60).join(', ') + (b.length > 60 ? ' ...' : '')) : emptyLabel);
        } else {
            boxA.style.display = 'flex';
            boxB.style.display = 'flex';
            textA.style.display = 'none';
            textB.style.display = 'none';

            boxA.innerHTML = '';
            boxB.innerHTML = '';

            const safeA = a || [];
            const safeB = b || [];
            const all = [...safeA, ...safeB];

            if (all.length === 0) return;

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

            safeA.forEach((val, i) => boxA.appendChild(makeBall(val, i === 0)));
            safeB.forEach((val, i) => boxB.appendChild(makeBall(val, i === 0)));
        }
    },

    renderPipeline(pipeline) {
        const pipe = document.getElementById('pipeline');
        if (!pipe) return;
        pipe.innerHTML = '';

        if (!pipeline || pipeline.length === 0) {
            const userMoves = document.getElementById('user-moves-count');
            if (userMoves) userMoves.innerText = 0;
            return;
        }

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
        const lang = AppState.currentLang;
        const headerTitle = lang === 'tr' ? 'KOMUTLAR (Tıkla veya Sürükle)' : 'OPERATIONS (Click or Drag)';

        panel.innerHTML = `<div style="font-size: 11px; font-weight: 800; color: var(--text-muted); margin-bottom: 2px;">${headerTitle}</div>`;
        COMMANDS.forEach(item => {
            const desc = lang === 'tr' ? item.desc_tr : item.desc_en;
            const card = document.createElement('div');
            card.className = 'command-card';
            card.draggable = true;
            card.ondragstart = (e) => e.dataTransfer.setData("text/plain", item.cmd);
            card.onclick = () => addCommandToPipeline(item.cmd);

            card.innerHTML = `
                <span class="cmd-tag">${item.cmd}</span>
                <span class="cmd-desc">${desc}</span>
            `;
            panel.appendChild(card);
        });
    },

    renderTerminal(tab, initialStack) {
        const terminal = document.getElementById('terminal-view');
        if (!terminal) return;

        const lang = AppState.currentLang;
        const dict = I18N[lang] || I18N['tr'];

        if (tab === 'c') {
            if (terminal.contentEditable !== "true") {
                terminal.innerText = `${dict.term_c_comment}\n\n${C_SOURCE_CODE}`;
            }
            terminal.scrollTop = 0;
        } else if (tab === 'binary') {
            const stack = initialStack || [];
            const sorted = [...stack].sort((x, y) => x - y);
            const n = stack.length;
            let maxBits = Math.ceil(Math.log2(n || 1));
            if (maxBits < 2) maxBits = 2;

            let binText = dict.term_bin_header.replace('{n}', n).replace('{bits}', maxBits);
            const slice = stack.slice(0, 35);
            slice.forEach(val => {
                const idx = sorted.indexOf(val);
                binText += `${val.toString().padStart(6, ' ')} -> [${idx.toString().padStart(4, ' ')}] -> ${idx.toString(2).padStart(maxBits, '0')}\n`;
            });
            if (n > 35) {
                binText += dict.term_bin_more.replace('{count}', n - 35);
            }
            terminal.innerText = binText;
            terminal.scrollTop = 0;
        } else if (tab === 'report') {
            if (!AppState.lastTestReport || AppState.lastTestReport.length === 0) {
                terminal.innerHTML = `<div style="color:var(--text-muted); padding:10px;">${dict.term_report_empty}</div>`;
                return;
            }

            const header = dict.term_report_header.replace('{os}', AppState.checkerOS.toUpperCase());
            let html = `<div style="font-weight:bold; color:var(--accent-blue); margin-bottom:8px;">${header}</div>`;
            html += `<table class="test-report-table">
                <thead>
                    <tr>
                        <th>${dict.th_report_id}</th>
                        <th>${dict.th_report_name}</th>
                        <th>${dict.th_report_input}</th>
                        <th>${dict.th_report_status}</th>
                        <th>${dict.th_report_detail}</th>
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

    // Liderlik Tablosu Render Motoru
    renderLeaderboard(data, tab = 'cadets') {
        const thead = document.getElementById('leaderboard-head');
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody || !thead) return;
        tbody.innerHTML = '';

        const lang = AppState.currentLang;
        const dict = I18N[lang] || I18N['tr'];

        if (tab === 'cadets') {
            thead.innerHTML = `
                <tr>
                    <th>#</th>
                    <th>${dict.th_cadet}</th>
                    <th>${dict.th_campus}</th>
                    <th>${dict.th_score}</th>
                    <th>${dict.th_date}</th>
                </tr>
            `;

            if (!data || data.length === 0) {
                const emptyMsg = lang === 'tr' ? 'Henüz kayıtlı skor bulunmuyor.' : 'No recorded scores yet.';
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:15px;">${emptyMsg}</td></tr>`;
                return;
            }

            data.slice(0, 25).forEach((item, index) => {
                let rankIcon = index + 1;
                if (index === 0) rankIcon = '🥇 1';
                else if (index === 1) rankIcon = '🥈 2';
                else if (index === 2) rankIcon = '🥉 3';

                const isMe = item.name.toLowerCase() === AppState.playerName.toLowerCase();
                const row = document.createElement('tr');
                if (isMe) row.style.background = 'rgba(0, 210, 255, 0.08)';

                row.innerHTML = `
                    <td style="font-weight:bold; color:${index < 3 ? 'var(--accent-yellow)' : 'var(--text-muted)'};">${rankIcon}</td>
                    <td style="font-weight:${isMe ? '900' : 'normal'}; color:${isMe ? 'var(--accent-blue)' : '#fff'};">${item.name} ${isMe ? (lang === 'tr' ? '(Sen)' : '(You)') : ''}</td>
                    <td><span style="background:#23283c; padding:2px 6px; border-radius:4px; font-size:11px; color:#38bdf8;">${item.campus || '42 Istanbul'}</span></td>
                    <td style="font-weight:bold; color:var(--accent-green);">${item.score}</td>
                    <td style="color:var(--text-muted); font-size:11px;">${item.date}</td>
                `;
                tbody.appendChild(row);
            });
        } else if (tab === 'campuses') {
            thead.innerHTML = `
                <tr>
                    <th>#</th>
                    <th>${dict.th_campus}</th>
                    <th>${lang === 'tr' ? 'Toplam Skor' : 'Total Score'}</th>
                    <th>${lang === 'tr' ? 'Aktif Cadet' : 'Active Cadets'}</th>
                </tr>
            `;

            const campusStats = {};
            (data || []).forEach(item => {
                const c = item.campus || 'Other';
                if (!campusStats[c]) campusStats[c] = { score: 0, count: 0 };
                campusStats[c].score += item.score;
                campusStats[c].count += 1;
            });

            const sortedCampuses = Object.keys(campusStats).map(c => ({
                campus: c,
                score: campusStats[c].score,
                count: campusStats[c].count
            })).sort((a, b) => b.score - a.score);

            if (sortedCampuses.length === 0) {
                const emptyMsg = lang === 'tr' ? 'Henüz kampüs verisi bulunmuyor.' : 'No campus data available.';
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:15px;">${emptyMsg}</td></tr>`;
                return;
            }

            sortedCampuses.forEach((item, index) => {
                let rankIcon = index + 1;
                if (index === 0) rankIcon = '🏆 1';
                else if (index === 1) rankIcon = '🥈 2';
                else if (index === 2) rankIcon = '🥉 3';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-weight:bold; color:var(--accent-yellow);">${rankIcon}</td>
                    <td style="font-weight:bold; color:#fff;">${item.campus}</td>
                    <td style="font-weight:bold; color:var(--accent-green);">${item.score.toLocaleString()}</td>
                    <td style="color:#38bdf8;">${item.count} Cadet</td>
                `;
                tbody.appendChild(row);
            });
        }
    },

    toggleModal(id, show) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    },

    showToast(msg, type = "warn") {
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
