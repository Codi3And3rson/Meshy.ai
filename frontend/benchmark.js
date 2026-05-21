import { performance } from 'perf_hooks';

const tasks = Array.from({ length: 10000 }, (_, i) => ({ id: `task-${i}`, status: 'SUCCEEDED', type: 'text' }));

function renderWithoutMemo(tasks) {
    return tasks.slice().reverse();
}

let memoizedTasks = null;
let lastTasks = null;
function renderWithMemo(tasks) {
    if (tasks !== lastTasks) {
        memoizedTasks = tasks.slice().reverse();
        lastTasks = tasks;
    }
    return memoizedTasks;
}

function runBenchmark() {
    const iterations = 10000;

    // Simulate re-renders where tasks reference doesn't change
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
        renderWithoutMemo(tasks);
    }
    const end1 = performance.now();

    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
        renderWithMemo(tasks);
    }
    const end2 = performance.now();

    console.log(`Baseline (slice().reverse() every time): ${(end1 - start1).toFixed(2)} ms`);
    console.log(`Optimized (memoized): ${(end2 - start2).toFixed(2)} ms`);
}

runBenchmark();
