const Solver = {
    // 42 100 Sayı Resmi Baremi
    rate100(moves) {
        if (moves < 700) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 900) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 1100) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 1300) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 1500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (FAILED - Barem Aşıldı)" };
    },

    // 42 500 Sayı Resmi Baremi
    rate500(moves) {
        if (moves < 5500) return { score: 5, label: "5/5 (Mükemmel)" };
        if (moves < 7000) return { score: 4, label: "4/5 (Çok İyi)" };
        if (moves < 8500) return { score: 3, label: "3/5 (İyi)" };
        if (moves < 10000) return { score: 2, label: "2/5 (Orta)" };
        if (moves < 11500) return { score: 1, label: "1/5 (Geçti)" };
        return { score: 0, label: "0/5 (FAILED - Barem Aşıldı)" };
    },

    // HATA DÜZELTİLDİ: 6-15 sayı aralığı adil formüle bağlandı
    calculateTargetOps(count) {
        if (count <= 3) return 3;
        if (count <= 5) return 12;
        if (count <= 15) {
            // 6-15 arası için gerçekçi greedy/push-swap hedef baremi
            return Math.max(14, Math.floor(count * 5.8));
        }
        if (count <= 100) return 700;
        if (count <= 500) return 5500;
        return Math.floor(count * 9.5);
    },

    // Taktiksel İpucu Motoru (Anlık Stack A ve Stack B'ye göre sıradaki en mantıklı hamleyi bulur)
    getBestNextMove(currentA, currentB) {
        if (Engine.isSorted(currentA, currentB)) return null;

        const queue = [{ a: [...currentA], b: [...currentB], path: [] }];
        const visited = new Set();
        const maxDepth = 6;
        const validOps = ['sa', 'sb', 'ss', 'pa', 'pb', 'ra', 'rb', 'rr', 'rra', 'rrb', 'rrr'];

        const stateKey = (a, b) => `${a.join(',')}|${b.join(',')}`;
        visited.add(stateKey(currentA, currentB));

        while (queue.length > 0) {
            const node = queue.shift();

            if (node.path.length >= maxDepth) break;

            for (const op of validOps) {
                // Anlamsız hamleleri ele
                if (op === 'pa' && node.b.length === 0) continue;
                if (op === 'pb' && node.a.length === 0) continue;
                if (op === 'sa' && node.a.length < 2) continue;
                if (op === 'sb' && node.b.length < 2) continue;
                if (op === 'ra' && node.a.length < 2) continue;
                if (op === 'rb' && node.b.length < 2) continue;

                const nextA = [...node.a];
                const nextB = [...node.b];
                Engine.applyOp(op, nextA, nextB);

                if (Engine.isSorted(nextA, nextB)) {
                    return node.path.length === 0 ? op : node.path[0];
                }

                const key = stateKey(nextA, nextB);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({
                        a: nextA,
                        b: nextB,
                        path: [...node.path, op]
                    });
                }
            }
        }

        // Derinlikte net çözüm bulunamazsa akıllı sezgisel (heuristic) hamle öner
        if (currentB.length > 0) {
            return (currentA.length === 0 || currentB[0] < currentA[0]) ? 'pa' : 'ra';
        }
        if (currentA.length > 1 && currentA[0] > currentA[1]) {
            return 'sa';
        }
        return 'pb';
    },

    // Bulut Derleyicisine Argüman Gönderme
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
                error: `Bulut servisine ulaşılamadı! Render uykuda olabilir veya ağ bağlantısı koptu.`
            };
        }
    }
};
