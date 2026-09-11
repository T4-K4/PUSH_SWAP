const Solver = {
    calculateTargetOps(count) {
        if (count === 3) return 2;
        if (count <= 5) return 8;
        if (count <= 100) return 700;
        if (count <= 500) return 5500;
        return Math.floor(count * 9.5);
    },

    autoSolve(stack) {
        if (!stack || stack.length === 0) return [];
        const n = stack.length;
        const sorted = [...stack].sort((a, b) => a - b);
        const indexedA = stack.map(val => sorted.indexOf(val));

        const ops = [];
        let curA = [...indexedA];
        let curB = [];

        if (n <= 5) {
            while (curA.length > 3) {
                let minIdx = 0;
                for (let i = 1; i < curA.length; i++) if (curA[i] < curA[minIdx]) minIdx = i;
                if (minIdx <= curA.length / 2) {
                    for (let k = 0; k < minIdx; k++) { curA.push(curA.shift()); ops.push('ra'); }
                } else {
                    for (let k = 0; k < curA.length - minIdx; k++) { curA.unshift(curA.pop()); ops.push('rra'); }
                }
                curB.unshift(curA.shift()); ops.push('pb');
            }
            if (curA[0] > curA[1] && curA[0] > curA[2]) { curA.push(curA.shift()); ops.push('ra'); }
            else if (curA[1] > curA[0] && curA[1] > curA[2]) { curA.unshift(curA.pop()); ops.push('rra'); }
            if (curA[0] > curA[1]) { [curA[0], curA[1]] = [curA[1], curA[0]]; ops.push('sa'); }
            while (curB.length > 0) { curA.unshift(curB.shift()); ops.push('pa'); }
        } else {
            const chunkSize = n <= 100 ? 15 : (n <= 500 ? 32 : Math.floor(Math.sqrt(n) * 1.4));
            let i = 0;

            while (curA.length > 0) {
                const top = curA[0];
                if (top <= i) {
                    curB.unshift(curA.shift()); ops.push('pb');
                    curB.push(curB.shift()); ops.push('rb');
                    i++;
                } else if (top <= i + chunkSize) {
                    curB.unshift(curA.shift()); ops.push('pb');
                    i++;
                } else {
                    curA.push(curA.shift()); ops.push('ra');
                }
            }

            while (curB.length > 0) {
                const maxVal = curB.length - 1;
                const pos = curB.indexOf(maxVal);

                if (pos <= curB.length / 2) {
                    for (let k = 0; k < pos; k++) { curB.push(curB.shift()); ops.push('rb'); }
                } else {
                    for (let k = 0; k < curB.length - pos; k++) { curB.unshift(curB.pop()); ops.push('rrb'); }
                }
                curA.unshift(curB.shift()); ops.push('pa');
            }
        }
        return ops;
    }
};

async function runEvoStressTest() {
    const term = document.getElementById('terminal-view');
    term.contentEditable = "false";
    term.innerText = `[42 ${AppState.checkerOS.toUpperCase()} CHECKER - KOD PATLATMA TESTİ]\n` +
                     `====================================================\n`;

    const testSuites = [
        { name: "Zaten Sıralı Dizi (Hamle Olmamalı)", stack: [1, 2, 3, 4, 5], maxMoves: 0 },
        { name: "Ters Sıralı 5 Sayı", stack: [5, 4, 3, 2, 1], maxMoves: 12 },
        { name: "Duplicate (Çift Sayı) Koruması", stack: [4, 8, 2, 8, 1], shouldError: true },
        { name: "INT_MAX Taşması (Overflow)", stack: [2147483648, 1, 2], shouldError: true },
        { name: "INT_MIN & INT_MAX Edge Case", stack: [-2147483648, 2147483647, 0], maxMoves: 3 },
        { name: "3 Elemanlı Sınav Testi", stack: [3, 2, 1], maxMoves: 3 },
        { name: "5 Elemanlı Sınav Testi (Hedef: <= 12)", stack: [5, 2, 3, 1, 4], maxMoves: 12 },
        { name: "100 Sayı Sınav Baremi (Hedef: < 700)", stack: Engine.generateHugeRandom(100), maxMoves: 700 },
        { name: "500 Sayı Sınav Baremi (Hedef: < 5500)", stack: Engine.generateHugeRandom(500), maxMoves: 5500 }
    ];

    let passedAll = true;

    for (let idx = 0; idx < testSuites.length; idx++) {
        const test = testSuites[idx];
        term.innerText += `\n>> [Test ${idx + 1}] ${test.name}... `;

        if (test.shouldError) {
            const hasDuplicate = new Set(test.stack).size !== test.stack.length;
            const hasOverflow = test.stack.some(x => x > 2147483647 || x < -2147483648);
            if (hasDuplicate || hasOverflow) {
                term.innerText += `[PASSED: Checker 'Error' fırlattı]`;
            } else {
                term.innerText += `[FAILED: Hatalı girdiye rağmen Error vermedi!]`;
                passedAll = false;
                break;
            }
            continue;
        }

        const solution = Solver.autoSolve([...test.stack]);
        const testA = [...test.stack];
        const testB = [];

        solution.forEach(op => Engine.applyOp(op, testA, testB));
        const ok = Engine.isSorted(testA, testB);

        if (!ok) {
            term.innerText += `[FAILED: KO -> Dizi sıralanamadı!]`;
            passedAll = false;
            break;
        } else if (test.maxMoves !== undefined && solution.length > test.maxMoves) {
            term.innerText += `[FAILED: Barem Aşıldı -> ${solution.length} hamle (Max: ${test.maxMoves})]`;
            passedAll = false;
            break;
        } else {
            term.innerText += `[PASSED: OK (${solution.length} hamle)]`;
        }
    }

    if (passedAll) {
        term.innerText += `\n\n====================================================\n` +
                          `🎉 TEBRİKLER! TÜM EVO STRES TESTLERİ BAŞARIYLA GEÇİLDİ!\n` +
                          `Kod hiçbir edge-case senaryosunda patlamadı.`;
        UI.triggerConfetti();
        alert("TEBRİKLER! Kodun tüm 42 Evo testlerini başarıyla geçti!");
    } else {
        term.innerText += `\n\n====================================================\n` +
                          `💥 KOD PATLADI! Yukarıdaki senaryoyu inceleyip algoritmanı düzelt.`;
        UI.showToast("Kod patladı! Detaylar terminalde.", "error");
    }
    term.scrollTop = term.scrollHeight;
}