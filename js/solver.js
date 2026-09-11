const BACKEND_URL = "http://localhost:3000/api";

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

    // Backend'de push_swap'ı gerçek argümanlarla çalıştırıp çıktı alan fonksiyon
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

            if (data.hasInvalidCommand) {
                return { success: false, error: `Program geçersiz operasyon bastı: "${data.invalidCommand}"` };
            }

            return { success: true, ops: data.ops, rawOutput: data.rawOutput };
        } catch (err) {
            return {
                success: false,
                error: `Backend servisine ulaşılamadı! Lütfen terminalde "node server.js" çalıştırdığınızdan emin olun.`
            };
        }
    }
};

// 42 Resmi Evo Stres Testi (GERÇEK COMPILED BINARY İLE ÇALIŞIR)
async function runEvoStressTest() {
    const term = document.getElementById('terminal-view');
    if (term) term.contentEditable = "false";
    switchTerminalTab('report');

    const testSuites = [
        { id: 1, section: "Identity Test", name: "Zaten Sıralı (42 Kuralı: 0 Hamle)", args: [1, 2, 3, 4, 5], maxMoves: 0 },
        { id: 2, section: "Simple Version", name: "3 Elemanlı Sınav (2 1 0)", args: [2, 1, 0], maxMoves: 3 },
        { id: 3, section: "Another Simple", name: "5 Elemanlı Sınav (1 5 2 4 3)", args: [1, 5, 2, 4, 3], maxMoves: 12 },
        { id: 4, section: "Middle Version", name: "100 Rastgele Değer", args: Engine.generateHugeRandom(100), is100Scale: true },
        { id: 5, section: "Advanced Version", name: "500 Rastgele Değer", args: Engine.generateHugeRandom(500), is500Scale: true }
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
        } else {
            const moves = result.ops.length;
            const testA = [...test.args];
            const testB = [];

            // Programın bastığı gerçek operasyonları yığına uygula
            result.ops.forEach(op => Engine.applyOp(op, testA, testB));
            const ok = Engine.isSorted(testA, testB);

            if (test.maxMoves === 0 && moves > 0) {
                status = "FAILED";
                detail = `0 Hamle İhlali: Sıralı diziye program ${moves} hamle bastı!`;
                passedAll = false;
            } else if (!ok) {
                status = "FAILED";
                detail = `KO (Dizi sıralanamadı veya B yığını boşaltılmadı - Üretilen: ${moves} hamle)`;
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
            arg: test.args.slice(0, 5).join(" ") + (test.args.length > 5 ? "..." : ""),
            status: status,
            detail: detail
        });

        UI.renderTerminal('report', AppState.initialStack);
        if (!passedAll) break;
    }

    if (passedAll) {
        UI.triggerConfetti();
        alert("🎉 TEBRİKLER! Kod derlendi ve tüm resmi 42 baremlerini başarıyla geçti!");
    } else {
        UI.showToast("💥 Kod patladı! Hata detayları raporda gösterildi.", "error");
    }
}