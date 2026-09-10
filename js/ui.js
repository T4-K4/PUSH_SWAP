const UI = {
    renderStacks(a, b) {
        const boxA = document.getElementById('stack-a-balls');
        const boxB = document.getElementById('stack-b-balls');
        const textA = document.getElementById('stack-a-text');
        const textB = document.getElementById('stack-b-text');

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
        document.getElementById('user-moves-count').innerText = pipeline.length;
    },

    renderCommandsPanel() {
        const panel = document.getElementById('cmd-source-list');
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

        if (tab === 'c') {
            terminal.innerText = C_SOURCE_CODE;
            terminal.scrollTop = 0;
        } else {
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
        }
    },

    toggleModal(id, show) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = show ? 'flex' : 'none';
    },

    showToast(msg, type) {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3200);
    }
};
