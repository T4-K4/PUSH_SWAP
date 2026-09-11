const BACKEND_URL = "https://push-swap-mw5i.onrender.com/api";

const Solver = {
    rate100(moves) {
        if (moves < 700) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 900) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 1100) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 1300) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 1500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (FAILED - Barem Aşıldı)" };
    },

    rate500(moves) {
        if (moves < 5500) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 7000) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 8500) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 10000) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 11500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (FAILED - Barem Aşıldı)" };
    },

    calculateTargetOps(count) {
        if (count === 3) return 3;
        if (count <= 5) return 12;
        if (count <= 100) return 700;
        if (count <= 500) return 5500;
        return Math.floor(count * 9.5);
    },

    async runPushSwapBinary(argsArray) {
        try {
            const res = await fetch(`${BACKEND_URL}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ args: argsArray })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                return { success: false, error: data.error || "Program çalıştırma hatası!" };
            }

            if (data.isErrorOutput) {
                return { success: true, isErrorOutput: true, rawOutput: data.rawOutput, ops: [] };
            }

            if (data.hasInvalidCommand) {
                return { success: false, error: `Program geçersiz operasyon bastı: "${data.invalidCommand}"` };
            }

            return { success: true, isErrorOutput: false, ops: data.ops, rawOutput: data.rawOutput };
        } catch (err) {
            return {
                success: false,
                error: `Bulut servisine ulaşılamadı! Render uykuda olabilir, lütfen 20-30 saniye sonra tekrar deneyin.`
            };
        }
    }
};

// 42 RESMİ EVO & ERROR MANAGEMENT STRES TESTİ
async function runEvoStressTest() {
    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";
    switchTerminalTab('report');

    // 42 Sheet: Hata Yönetimi, Tırnaklı String, Duplicate, Max/Min Int ve Sıralama Testleri
    const testSuites = [
        // --- 42 ERROR MANAGEMENT TESTS ---
        { id: 1, section: "Error Check", name: "Harf İçeren Argüman (1 2 a 4)", args: ["1", "2", "a", "4"], expectError: true },
        { id: 2, section: "Error Check", name: "Boş Argüman ('')", args: [""], expectError: true },
        { id: 3, section: "Error Check", name: "Aralarda Boş Argüman (1 2 '' 3)", args: ["1", "2", "", "3"], expectError: true },
        { id: 4, section: "Error Check", name: "Yinelenen Sayı / Duplicate (5 2 5)", args: ["5", "2", "5"], expectError: true },
        { id: 5, section: "Error Check", name: "MAX_INT Aşımı (2147483648)", args: ["2147483648"], expectError: true },
        { id: 6, section: "Error Check", name: "MIN_INT Aşımı (-2147483649)", args: ["-2147483649"], expectError: true },

        // --- 42 PARSING TESTS ---
        { id: 7, section: "Parsing Check", name: "Çift Tırnak İçinde Dizi ('3 2 1')", args: ["3 2 1"], expectSortedArgs: [3, 2, 1], maxMoves: 3 },
        { id: 8, section: "Parsing Check", name: "Karma Tırnak & Dizi (1 '5 2' 4 3)", args: ["1", "5 2", "4", "3"], expectSortedArgs: [1, 5, 2, 4, 3], maxMoves: 12 },

        // --- 42 OFFICIAL EVALUATION BENCHMARKS ---
        { id: 9, section: "Identity Test", name: "Zaten Sıralı (42 Kuralı: 0 Hamle)", args: ["1", "2", "3", "4", "5"], maxMoves: 0 },
        { id: 10, section: "Simple Version", name: "3 Elemanlı Sınav (2 1 0)", args: ["2", "1", "0"], maxMoves: 3 },
        { id: 11, section: "Simple Version", name: "5 Elemanlı Sınav (1 5 2 4 3)", args: ["1", "5", "2", "4", "3"], maxMoves: 12 },
        { id: 12, section: "Middle Version", name: "100 Rastgele Değer", args: Engine.generateHugeRandom(100), is100Scale: true },
        { id: 13, section: "Advanced Version", name: "500 Rastgele Değer", args: Engine.generateHugeRandom(500), is500Scale: true }
    ];

    AppState.lastTestReport = [];
    let passedAll = true;

    for (const test of testSuites) {
        UI.showToast(`Test ${test.id} koşturuluyor: ${test.name}...`, "warn");

        const result = await Solver.runPushSwapBinary(test.args);
        let status = "PASSED";
        let detail = "";

        if (!result.success) {
            status = "FAILED";
            detail = result.error;
            passedAll = false;
        } else if (test.expectError) {
            // Hata basması beklenen durum
            if (result.isErrorOutput) {
                detail = "OK: Program doğru şekilde 'Error' bastı.";
            } else {
                status = "FAILED";
                detail = "KO: Hatalı girdiye rağmen program 'Error' basmadı!";
                passedAll = false;
            }
        } else if (result.isErrorOutput) {
            status = "FAILED";
            detail = "KO: Geçerli girdide program beklenmedik şekilde 'Error' bastı!";
            passedAll = false;
        } else {
            const moves = result.ops.length;
            let targetNumbers = [];

            if (test.expectSortedArgs) {
                targetNumbers = [...test.expectSortedArgs];
            } else {
                targetNumbers = test.args.flatMap(x => String(x).trim().split(/\s+/)).map(Number);
            }

            const testA = [...targetNumbers];
            const testB = [];

            result.ops.forEach(op => Engine.applyOp(op, testA, testB));
            const ok = Engine.isSorted(testA, testB);

            if (test.maxMoves === 0 && moves > 0) {
                status = "FAILED";
                detail = `0 Hamle İhlali: Sıralı diziye program ${moves} hamle bastı!`;
                passedAll = false;
            } else if (!ok) {
                status = "FAILED";
                detail = `KO (Dizi sıralanamadı veya Stack B boş değil - Üretilen: ${moves} hamle)`;
                passedAll = false;
            } else if (test.is100Scale) {
                const rating = Solver.rate100(moves);
                if (rating.score === 0) {
                    status = "FAILED";
                    detail = `Barem Aşıldı: ${moves} hamle (>= 1500)`;
                    passedAll = false;
                } else {
                    detail = `OK (${moves} hamle) -> ${rating.label}`;
                }
            } else if (test.is500Scale) {
                const rating = Solver.rate500(moves);
                if (rating.score === 0) {
                    status = "FAILED";
                    detail = `Barem Aşıldı: ${moves} hamle (>= 11500)`;
                    passedAll = false;
                } else {
                    detail = `OK (${moves} hamle) -> ${rating.label}`;
                }
            } else if (test.maxMoves !== undefined && moves > test.maxMoves) {
                status = "FAILED";
                detail = `Barem Aşıldı: ${moves} > ${test.maxMoves}`;
                passedAll = false;
            } else {
                detail = `OK (${moves} hamle / Limit: ${test.maxMoves})`;
            }
        }

        AppState.lastTestReport.push({
            id: test.id,
            section: test.section,
            name: test.name,
            arg: test.args.slice(0, 4).join(" ") + (test.args.length > 4 ? "..." : ""),
            status: status,
            detail: detail
        });

        UI.renderTerminal('report', AppState.initialStack);
        if (!passedAll) break;
    }

    if (passedAll) {
        UI.triggerConfetti();
        alert("🎉 TEBRİKLER! Hata yönetimi (Error management), tırnaklı string ayrıştırma ve tüm 42 baremleri eksiksiz geçti!");
    } else {
        UI.showToast("💥 Kod baremden veya hata kontrolünden geçemedi! Detaylar raporda.", "error");
    }
}