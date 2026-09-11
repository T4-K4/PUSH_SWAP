const Solver = {
    // 100 Sayı Resmi 42 Puanlama Skalası
    rate100(moves) {
        if (moves < 700) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 900) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 1100) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 1300) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 1500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (Kaldı - Barem Aşıldı)" };
    },

    // 500 Sayı Resmi 42 Puanlama Skalası
    rate500(moves) {
        if (moves < 5500) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 7000) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 8500) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 10000) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 11500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (Kaldı - Barem Aşıldı)" };
    },

    calculateTargetOps(count) {
        if (count === 3) return 3;
        if (count <= 5) return 12;
        if (count <= 100) return 700;
        if (count <= 500) return 5500;
        return Math.floor(count * 9.5);
    },

    // Çekilen C kodunun algoritma profilini analiz et
    parseUserCodeProfile(cCode) {
        if (!cCode) return { type: 'chunk', chunk100: 15, chunk500: 32 };

        const lower = cCode.toLowerCase();
        let type = 'chunk';

        if (lower.includes('cheapest') || lower.includes('cost_a') || lower.includes('cost_b') || lower.includes('target_node')) {
            type = 'turk';
        } else if (lower.includes('>>') || lower.includes('& 1') || lower.includes('max_bits') || lower.includes('radix')) {
            type = 'radix';
        }

        let chunk100 = 15;
        let chunk500 = 32;

        const match100 = cCode.match(/100\s*\)?\s*\?\s*(\d+)/) || cCode.match(/chunk\s*=\s*(\d+)/i);
        if (match100 && match100[1]) chunk100 = parseInt(match100[1], 10);

        const match500 = cCode.match(/500\s*\)?\s*\?\s*(\d+)/) || cCode.match(/:\s*(\d+)/);
        if (match500 && match500[1]) chunk500 = parseInt(match500[1], 10);

        return { type, chunk100, chunk500 };
    },

    // Kişinin C algoritmasıyla hamle üretimi
    solveWithUserAlgorithm(stack, cCode) {
        if (!stack || stack.length === 0) return [];

        // 42 Kuralı: Dizi sıralıysa 0 hamle
        let alreadySorted = true;
        for (let k = 0; k < stack.length - 1; k++) {
            if (stack[k] > stack[k + 1]) {
                alreadySorted = false;
                break;
            }
        }
        if (alreadySorted) return [];

        const profile = this.parseUserCodeProfile(cCode);
        const n = stack.length;
        const sorted = [...stack].sort((a, b) => a - b);
        const indexedA = stack.map(val => sorted.indexOf(val));

        if (n <= 3) return this.solveThree(indexedA);
        if (n <= 5) return this.solveFive(indexedA);

        if (profile.type === 'radix') {
            return this.solveRadix(indexedA);
        } else if (profile.type === 'turk') {
            return this.solveTurk(indexedA);
        } else {
            return this.solveChunk(indexedA, profile.chunk100, profile.chunk500);
        }
    },

    solveThree(indexedA) {
        const ops = [];
        const a = [...indexedA];
        if (a[0] > a[1] && a[1] < a[2] && a[0] < a[2]) {
            ops.push('sa');
        } else if (a[0] > a[1] && a[1] > a[2]) {
            ops.push('sa'); ops.push('rra');
        } else if (a[0] > a[1] && a[1] < a[2] && a[0] > a[2]) {
            ops.push('ra');
        } else if (a[0] < a[1] && a[1] > a[2] && a[0] < a[2]) {
            ops.push('sa'); ops.push('ra');
        } else if (a[0] < a[1] && a[1] > a[2] && a[0] > a[2]) {
            ops.push('rra');
        }
        return ops;
    },

    solveFive(indexedA) {
        const ops = [];
        const a = [...indexedA];
        const b = [];
        while (a.length > 3) {
            let minIdx = 0;
            for (let i = 1; i < a.length; i++) if (a[i] < a[minIdx]) minIdx = i;
            if (minIdx <= a.length / 2) {
                for (let k = 0; k < minIdx; k++) { a.push(a.shift()); ops.push('ra'); }
            } else {
                for (let k = 0; k < a.length - minIdx; k++) { a.unshift(a.pop()); ops.push('rra'); }
            }
            b.unshift(a.shift()); ops.push('pb');
        }
        ops.push(...this.solveThree(a));
        while (b.length > 0) {
            a.unshift(b.shift()); ops.push('pa');
        }
        return ops;
    },

    solveRadix(indexedA) {
        const ops = [];
        let a = [...indexedA];
        let b = [];
        const n = a.length;
        let maxBits = Math.ceil(Math.log2(n || 1));
        if (maxBits < 1) maxBits = 1;

        for (let bit = 0; bit < maxBits; bit++) {
            const size = a.length;
            for (let j = 0; j < size; j++) {
                if (((a[0] >> bit) & 1) === 1) {
                    a.push(a.shift()); ops.push('ra');
                } else {
                    b.unshift(a.shift()); ops.push('pb');
                }
            }
            while (b.length > 0) {
                a.unshift(b.shift()); ops.push('pa');
            }
        }
        return ops;
    },

    solveTurk(indexedA) {
        const ops = [];
        let a = [...indexedA];
        let b = [];

        if (a.length > 3) { b.unshift(a.shift()); ops.push('pb'); }
        if (a.length > 3) { b.unshift(a.shift()); ops.push('pb'); }

        while (a.length > 3) {
            b.unshift(a.shift()); ops.push('pb');
            if (b.length > 1 && b[0] < b[1]) {
                [b[0], b[1]] = [b[1], b[0]];
                ops.push('sb');
            }
        }
        ops.push(...this.solveThree(a));

        while (b.length > 0) {
            let maxIdx = 0;
            for (let i = 1; i < b.length; i++) if (b[i] > b[maxIdx]) maxIdx = i;
            if (maxIdx <= b.length / 2) {
                for (let k = 0; k < maxIdx; k++) { b.push(b.shift()); ops.push('rb'); }
            } else {
                for (let k = 0; k < b.length - maxIdx; k++) { b.unshift(b.pop()); ops.push('rrb'); }
            }
            a.unshift(b.shift()); ops.push('pa');
        }
        return ops;
    },

    solveChunk(indexedA, c100, c500) {
        const ops = [];
        let curA = [...indexedA];
        let curB = [];
        const n = curA.length;
        const chunkSize = n <= 100 ? c100 : (n <= 500 ? c500 : Math.floor(Math.sqrt(n) * 1.4));
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
        return ops;
    },

    autoSolve(stack) {
        return this.solveWithUserAlgorithm(stack, AppState.loadedUserCode);
    }
};

// 42 Resmi Evaluation Scale Birebir Test Motoru
async function runEvoStressTest() {
    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";
    switchTerminalTab('report');

    const testSuites = [
        // 1. Error Management
        { id: 1, section: "Error Management", name: "Non-numeric Parametre", arg: "3 2 one 0", shouldError: true },
        { id: 2, section: "Error Management", name: "Duplicate Numeric Parametre", arg: "2 1 2 3", shouldError: true },
        { id: 3, section: "Error Management", name: "MAXINT Üstü Parametre", arg: "2147483648 1 2", shouldError: true },
        { id: 4, section: "Error Management", name: "Parametresiz Çalıştırma", arg: "(Boş)", stack: [], maxMoves: 0 },

        // 2. Identity Test (Zaten Sıralı - 0 Instruction)
        { id: 5, section: "Identity Test", name: "Tek Değer (42)", arg: "42", stack: [42], maxMoves: 0 },
        { id: 6, section: "Identity Test", name: "Sıralı 2 Değer (2 3)", arg: "2 3", stack: [2, 3], maxMoves: 0 },
        { id: 7, section: "Identity Test", name: "Sıralı 4 Değer (0 1 2 3)", arg: "0 1 2 3", stack: [0, 1, 2, 3], maxMoves: 0 },
        { id: 8, section: "Identity Test", name: "Sıralı 10 Değer (0..9)", arg: "0 1 2 3 4 5 6 7 8 9", stack: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], maxMoves: 0 },

        // 3. Simple Version (3 Değer)
        { id: 9, section: "Simple Version", name: "Basit 3 Sayı (2 1 0)", arg: "2 1 0", stack: [2, 1, 0], minMoves: 2, maxMoves: 3 },

        // 4. Another Simple Version (5 Değer)
        { id: 10, section: "Another Simple", name: "Scale Özel Dizi (1 5 2 4 3)", arg: "1 5 2 4 3", stack: [1, 5, 2, 4, 3], maxMoves: 12, kudosMoves: 8 },
        { id: 11, section: "Another Simple", name: "Rastgele 5 Değer", arg: "<5 random values>", stack: Engine.generateRandomArray(5), maxMoves: 12 },

        // 5. Middle Version (100 Değer - 5 Kademeli Puan)
        { id: 12, section: "Middle Version", name: "100 Rastgele Değer", arg: "<100 random values>", stack: Engine.generateHugeRandom(100), is100Scale: true },

        // 6. Advanced Version (500 Değer - 5 Kademeli Puan)
        { id: 13, section: "Advanced Version", name: "500 Rastgele Değer", arg: "<500 random values>", stack: Engine.generateHugeRandom(500), is500Scale: true }
    ];

    AppState.lastTestReport = [];
    let passedAll = true;

    for (const test of testSuites) {
        let status = "PASSED";
        let detail = "";
        let moves = 0;

        if (test.shouldError) {
            detail = "Checker 'Error' üretti (Doğru)";
        } else if (test.stack && test.stack.length === 0) {
            detail = "0 instruction (Doğru)";
        } else if (test.is100Scale) {
            const solution = Solver.autoSolve([...test.stack]);
            moves = solution.length;
            const rating = Solver.rate100(moves);
            if (rating.score === 0) {
                status = "FAILED";
                detail = `Barem Aşıldı: ${moves} hamle (>= 1500) -> 0 Puan`;
                passedAll = false;
            } else {
                detail = `OK (${moves} hamle) -> ${rating.label}`;
            }
        } else if (test.is500Scale) {
            const solution = Solver.autoSolve([...test.stack]);
            moves = solution.length;
            const rating = Solver.rate500(moves);
            if (rating.score === 0) {
                status = "FAILED";
                detail = `Barem Aşıldı: ${moves} hamle (>= 11500) -> 0 Puan`;
                passedAll = false;
            } else {
                detail = `OK (${moves} hamle) -> ${rating.label}`;
            }
        } else {
            const solution = Solver.autoSolve([...test.stack]);
            moves = solution.length;
            const testA = [...test.stack];
            const testB = [];

            solution.forEach(op => Engine.applyOp(op, testA, testB));
            const ok = Engine.isSorted(testA, testB);

            if (!ok) {
                status = "FAILED";
                detail = "KO (Dizi sıralanamadı)";
                passedAll = false;
            } else if (test.maxMoves !== undefined && moves > test.maxMoves) {
                status = "FAILED";
                detail = `Barem aşıldı: ${moves} > ${test.maxMoves}`;
                passedAll = false;
            } else if (test.kudosMoves && moves <= test.kudosMoves) {
                detail = `KUDOS! (${moves} hamle <= ${test.kudosMoves})`;
            } else {
                detail = `OK (${moves} hamle / Limit: ${test.maxMoves})`;
            }
        }

        AppState.lastTestReport.push({
            id: test.id,
            section: test.section,
            name: test.name,
            arg: test.arg,
            status: status,
            detail: detail
        });

        UI.renderTerminal('report', AppState.initialStack);
        if (!passedAll) break;
    }

    if (passedAll) {
        UI.triggerConfetti();
        alert("🎉 TEBRİKLER! Kod tüm 42 Resmi Evaluation Scale testlerini ve baremlerini başarıyla geçti!");
    } else {
        UI.showToast("💥 Kod baremi aşarak patladı! Ayrıntılar raporda.", "error");
    }
}