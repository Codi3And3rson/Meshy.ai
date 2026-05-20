import { performance } from 'perf_hooks';

const tasks = Array.from({ length: 10000 }, (_, i) => ({ id: i, type: 'text', status: 'SUCC' }));

console.log("Baseline (Reversing on every render for 10000 renders):");
const start = performance.now();
for (let i = 0; i < 10000; i++) {
    const reversed = tasks.slice().reverse();
}
const end = performance.now();
console.log(`Execution time: ${(end - start).toFixed(2)} ms`);

console.log("\nOptimized (Memoizing the array reversal):");
const start2 = performance.now();
const reversedMemo = tasks.slice().reverse(); // Only done once
for (let i = 0; i < 10000; i++) {
    const reversed = reversedMemo;
}
const end2 = performance.now();
console.log(`Execution time: ${(end2 - start2).toFixed(2)} ms`);
