const Engine = {
    applyOp(op, a, b) {
        if (op === 'sa') { if (a.length > 1) [a[0], a[1]] = [a[1], a[0]]; }
        else if (op === 'sb') { if (b.length > 1) [b[0], b[1]] = [b[1], b[0]]; }
        else if (op === 'ss') { this.applyOp('sa', a, b); this.applyOp('sb', a, b); }
        else if (op === 'pa') { if (b.length > 0) a.unshift(b.shift()); }
        else if (op === 'pb') { if (a.length > 0) b.unshift(a.shift()); }
        else if (op === 'ra') { if (a.length > 1) a.push(a.shift()); }
        else if (op === 'rb') { if (b.length > 1) b.push(b.shift()); }
        else if (op === 'rr') { this.applyOp('ra', a, b); this.applyOp('rb', a, b); }
        else if (op === 'rra') { if (a.length > 1) a.unshift(a.pop()); }
        else if (op === 'rrb') { if (b.length > 1) b.unshift(b.pop()); }
        else if (op === 'rrr') { this.applyOp('rra', a, b); this.applyOp('rrb', a, b); }
    },

    isSorted(a, b) {
        if (!b || b.length !== 0) return false;
        for (let i = 0; i < a.length - 1; i++) {
            if (a[i] > a[i + 1]) return false;
        }
        return true;
    },

    // Standart küçük rastgele dizi (Yarışma ve Serbest Mod için)
    generateRandomArray(count) {
        const set = new Set();
        while (set.size < count) {
            set.add(Math.floor(Math.random() * 85) + 10);
        }
        const arr = Array.from(set);
        if (arr.every((v, i) => i === 0 || arr[i - 1] <= v)) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        return arr;
    },

    // 1. Standart Tam Rastgele Dizi (Orta Karışık)
    generateHugeRandom(count) {
        const set = new Set();
        while (set.size < count) {
            set.add(Math.floor(Math.random() * (count * 10)) - Math.floor(count * 5));
        }
        return Array.from(set);
    },

    // 2. Az Karışık Dizi (Nearly Sorted - %15 Swap)
    generateNearlySortedArray(count) {
        const arr = this.generateHugeRandom(count).sort((x, y) => x - y);
        const swapCount = Math.max(2, Math.floor(count * 0.12));
        for (let k = 0; k < swapCount; k++) {
            const i = Math.floor(Math.random() * count);
            const j = Math.floor(Math.random() * count);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // 3. Worst-Case Dizi (Tam Ters Sıralı / Reverse)
    generateWorstCaseArray(count) {
        const arr = this.generateHugeRandom(count).sort((x, y) => y - x);
        return arr;
    }
};
