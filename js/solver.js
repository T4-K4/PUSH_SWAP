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
