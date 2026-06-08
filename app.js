const SIZE = 20;

let solutionGrid = [];
let placedWords = [];

const failedWords =
    new Set();

const solvedWords =
    new Set();

const revealedWords =
    new Set();

const revealedLetters =
    new Set();

let activeDirection = "across"; // default
let focusedCell = null;
let selectedCell = null;
let selectedCells = [];
let lastClicked = null;

document
    .getElementById("generateBtn")
    .addEventListener("click", generate);

document
    .getElementById("checkBtn")
    .addEventListener("click", checkAll);

document
    .getElementById("revealAllBtn")
    .addEventListener("click", revealAll);

document
    .getElementById("checkLetterBtn")
    .addEventListener("click", () => {
        if (!focusedCell) return;
        checkLetter(
            Number(focusedCell.dataset.row),
            Number(focusedCell.dataset.col)
        );
    });

document
    .getElementById("checkWordBtn")
    .addEventListener("click", checkWord);

document
    .getElementById("revealLetterBtn")
    .addEventListener("click", revealLetter);

document
    .getElementById("revealWordBtn")
    .addEventListener("click", revealWord);

document
    .getElementById("statsBtn")
    .addEventListener(
        "click",
        showStats
    );

document
    .getElementById("clearStatsBtn")
    .addEventListener("click", clearStats);

function clearStats() {

    if (
        !confirm(
            "Delete all learning statistics?"
        )
    ) {
        return;
    }

    localStorage.removeItem(
        "wordStats"
    );

    alert(
        "Statistics cleared."
    );
}

async function getRuntimeKey() {
    return crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode("Some*(#@OtherRuntime@(*)#@(KEY2Decrypt!@)*1224[]';)")
    );
}

async function decryptRuntimeFile(buffer) {

    const rawKey =
        await getRuntimeKey();

    const key =
        await crypto.subtle.importKey(
            "raw",
            rawKey,
            "AES-GCM",
            false,
            ["decrypt"]
        );

    const nonce =
        buffer.slice(0, 12);

    const encrypted =
        buffer.slice(12);

    const decrypted =
        await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: nonce
            },
            key,
            encrypted
        );

    return new TextDecoder()
        .decode(decrypted);
}

async function loadVocabulary() {

    const response =
        await fetch(
            "vocab.runtime.enc"
        );

    const buffer =
        await response.arrayBuffer();

    const text =
        await decryptRuntimeFile(
            buffer
        );

    return JSON.parse(text);
}

async function getFilteredVocab() {

    const includeKnown =
        document.getElementById(
            "includeKnownWords"
        ).checked;
    
    allVocab = await loadVocabulary()

    if (includeKnown) {
        return allVocab;
    }

    return allVocab.filter(
        word => word.should_study
    );
}

// async function loadVocabulary() {

//     const response =
//         await fetch("vocab.tsv");

//     const text =
//         await response.text();

//     return text
//         .trim()
//         .split("\n")
//         .map(line => {

//             const [
//                 french,
//                 romaji,
//                 hiragana,
//                 comment = "",
//                 example = ""
//             ] = line.split("\t");

//             return {
//                 french,
//                 romaji,
//                 hiragana,
//                 comment,
//                 example
//             };
//         });
// }

function createEmptyGrid() {

    return Array.from(
        { length: SIZE },
        () => Array(SIZE).fill(null)
    );
}

function inBounds(r, c) {
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function canPlace(grid, word, row, col, direction) {

    const chars = [...word];

    for (let i = 0; i < chars.length; i++) {

        const r = direction === "across" ? row : row + i;
        const c = direction === "across" ? col + i : col;

        if (!inBounds(r, c)) return false;

        const existing = grid[r][c];

        if (existing !== null && existing !== chars[i]) {
            return false;
        }

        // adjacency rules (NO touching except valid crossing)
        const isCrossing = existing === chars[i];

        if (!isCrossing) {

            if (direction === "across") {

                // above / below must be empty
                if (inBounds(r - 1, c) && grid[r - 1][c] !== null) return false;
                if (inBounds(r + 1, c) && grid[r + 1][c] !== null) return false;
            }

            if (direction === "down") {

                // left / right must be empty
                if (inBounds(r, c - 1) && grid[r][c - 1] !== null) return false;
                if (inBounds(r, c + 1) && grid[r][c + 1] !== null) return false;
            }
        }
    }

    // prevent touching at word ends
    const beforeR = direction === "down" ? row - 1 : row;
    const beforeC = direction === "across" ? col - 1 : col;

    const afterR =
        direction === "down" ? row + chars.length : row;

    const afterC =
        direction === "across" ? col + chars.length : col;

    if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC] !== null)
        return false;

    if (inBounds(afterR, afterC) && grid[afterR][afterC] !== null)
        return false;

    return true;
}

function placeWord(
    grid,
    word,
    row,
    col,
    direction
) {

    const chars = [...word];

    for (
        let i = 0;
        i < chars.length;
        i++
    ) {

        let r =
            direction === "across"
            ? row
            : row + i;

        let c =
            direction === "across"
            ? col + i
            : col;

        grid[r][c] = chars[i];
    }
}

function generateCrossword(words) {

    const grid =
        createEmptyGrid();

    const placements = [];

    words.sort(
        (a,b)=>
        b.answer.length
        - a.answer.length
    );

    const first =
        words[0];

    const startCol =
        Math.floor(
            (SIZE
             - first.answer.length)
            / 2
        );

    const startRow =
        Math.floor(SIZE/2);

    placeWord(
        grid,
        first.answer,
        startRow,
        startCol,
        "across"
    );

    placements.push({
        ...first,
        row:startRow,
        col:startCol,
        direction:"across"
    });

    for (
        let w = 1;
        w < words.length;
        w++
    ) {

        const word =
            words[w];

        let placed =
            false;

        outer:

        for (
            const existing
            of placements
        ) {

            const currentChars =
                [...existing.answer];

            const newChars =
                [...word.answer];

            for (
                let i=0;
                i<newChars.length;
                i++
            ) {

                for (
                    let j=0;
                    j<currentChars.length;
                    j++
                ) {

                    if (
                        newChars[i]
                        !==
                        currentChars[j]
                    ) {
                        continue;
                    }

                    let row;
                    let col;
                    let direction;

                    if (
                        existing.direction
                        === "across"
                    ) {

                        direction =
                            "down";

                        row =
                            existing.row
                            - i;

                        col =
                            existing.col
                            + j;
                    }
                    else {

                        direction =
                            "across";

                        row =
                            existing.row
                            + j;

                        col =
                            existing.col
                            - i;
                    }

                    if (
                        canPlace(
                            grid,
                            word.answer,
                            row,
                            col,
                            direction
                        )
                    ) {

                        placeWord(
                            grid,
                            word.answer,
                            row,
                            col,
                            direction
                        );

                        placements.push({
                            ...word,
                            row,
                            col,
                            direction
                        });

                        placed =
                            true;

                        break outer;
                    }
                }
            }
        }
    }

    return {
        grid,
        placements
    };
}

function getBounds(placements) {

    let minR = 999, minC = 999;
    let maxR = -999, maxC = -999;

    placements.forEach(p => {

        const chars = [...p.answer];

        for (let i = 0; i < chars.length; i++) {

            const r = p.direction === "across" ? p.row : p.row + i;
            const c = p.direction === "across" ? p.col + i : p.col;

            minR = Math.min(minR, r);
            minC = Math.min(minC, c);
            maxR = Math.max(maxR, r);
            maxC = Math.max(maxC, c);
        }
    });

    return { minR, maxR, minC, maxC };
}



function getWordCellsFromPlacement(p) {
    const cells = [];

    const chars = [...p.answer];

    for (let i = 0; i < chars.length; i++) {
        const r = p.direction === "across" ? p.row : p.row + i;
        const c = p.direction === "across" ? p.col + i : p.col;
        cells.push({ r, c });
    }

    return cells;
}

function getWordsAtCell(r, c) {
    return placedWords.filter(p => {
        const cells = getWordCellsFromPlacement(p);
        return cells.some(cell => cell.r === r && cell.c === c);
    });
}

function clearHighlight() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.classList.remove("active");
    });
}

function highlightCells(cells) {
    clearHighlight();

    selectedCells = cells;

    cells.forEach(({ r, c }) => {
        const el = document.querySelector(
            `.cell[data-row="${r}"][data-col="${c}"]`
        );
        if (el) el.classList.add("active");
    });
}

function detectDirection(r, c) {

    let hasAcross = false;
    let hasDown = false;

    for (const p of placedWords) {

        const chars = [...p.answer];

        for (let i = 0; i < chars.length; i++) {

            const rr = p.direction === "across" ? p.row : p.row + i;
            const cc = p.direction === "across" ? p.col + i : p.col;

            if (rr === r && cc === c) {
                if (p.direction === "across") hasAcross = true;
                if (p.direction === "down") hasDown = true;
            }
        }
    }

    // if both exist, keep last direction (feels like real crosswords)
    if (hasAcross && hasDown) return activeDirection;

    return hasAcross ? "across" : "down";
}

function moveNext(r, c, direction) {

    let nextR = r;
    let nextC = c;

    if (direction === "across") nextC++;
    if (direction === "down") nextR++;

    const next = document.querySelector(
        `.cell[data-row="${nextR}"][data-col="${nextC}"]`
    );

    if (next) next.focus();
}

function getWordCells(r, c, direction) {
    const cells = [];

    if (direction === "across") {
        let cc = c;

        // go left to start
        while (inBounds(r, cc - 1) && solutionGrid[r][cc - 1] !== null) {
            cc--;
        }

        // collect right
        while (inBounds(r, cc) && solutionGrid[r][cc] !== null) {
            cells.push({ r, c: cc });
            cc++;
        }
    }

    if (direction === "down") {
        let rr = r;

        while (inBounds(rr - 1, c) && solutionGrid[rr - 1][c] !== null) {
            rr--;
        }

        while (inBounds(rr, c) && solutionGrid[rr][c] !== null) {
            cells.push({ r: rr, c });
            rr++;
        }
    }

    return cells;
}

function checkLetter(r, c) {

    const cell = document.querySelector(
        `.cell[data-row="${r}"][data-col="${c}"]`
    );

    const solution = solutionGrid[r][c];

    const user = (cell.value || "").toUpperCase();
    const target = (solution || "").toUpperCase();

    cell.classList.remove("correct", "wrong");

    if (user === target) {
        cell.classList.add("correct");
    } else {
        cell.classList.add("wrong");

        const words = getWordsAtCell(r, c);

        words.forEach(word => {
            markFailed(word.id);
        });
    }
}

function revealLetter() {
    if (!focusedCell) return;

    const r = Number(focusedCell.dataset.row);
    const c = Number(focusedCell.dataset.col);

    const words = getWordsAtCell(r, c);

    words.forEach(word => {
        incrementStat(word.id, "revealLetter");
    });

    focusedCell.value = (solutionGrid[r][c] || "").toUpperCase();
    focusedCell.classList.add("correct");
}

function checkWord() {
    if (!focusedCell) return;

    const r = Number(focusedCell.dataset.row);
    const c = Number(focusedCell.dataset.col);

    const dir = activeDirection;

    const cells = getWordCells(r, c, dir);

    let allCorrect = true;

    cells.forEach(({ r, c }) => {
        checkLetter(r, c);

        const cell = document.querySelector(
            `.cell[data-row="${r}"][data-col="${c}"]`
        );

        const user =
            (cell.value || "").toUpperCase();

        const target =
            (solutionGrid[r][c] || "").toUpperCase();

        if (user !== target) {
            allCorrect = false;
        }
    });

    const words = getWordsAtCell(r, c)
        .filter(w => w.direction === activeDirection);

    words.forEach(word => {

        const key =
            `${word.id}-${word.direction}`;

        if (allCorrect) {

            if (!solvedWords.has(key)) {

                solvedWords.add(key);

                markSolved(word.id);
            }

        } else {

            markFailed(word.id);
        }
    });
}

function revealWord() {
    if (!focusedCell) return;

    const r = Number(focusedCell.dataset.row);
    const c = Number(focusedCell.dataset.col);

    const cells = getWordCells(r, c, activeDirection);

    const words = getWordsAtCell(r, c);

    words
        .filter(w => w.direction === activeDirection)
        .forEach(word => {
            markRevealWord(word.id)
        });

    cells.forEach(({ r, c }) => {
        const cell = document.querySelector(
            `.cell[data-row="${r}"][data-col="${c}"]`
        );

        cell.value = (solutionGrid[r][c] || "").toUpperCase();
        cell.classList.add("correct");
    });
}

function showStats() {

    const stats =
        getStats();

    let text = "";

    Object.entries(stats)
        .forEach(([id, s]) => {

            text +=
                `${id}
Solved: ${s.solved}
Failed: ${s.failed}
Reveal word: ${s.revealWord}
Reveal letter: ${s.revealLetter}
Last seen: ${s.lastSeen}

`;
        });

    alert(text);
}

function render(grid, placements) {

    solutionGrid = grid;
    placedWords = placements;

    const { minR, maxR, minC, maxC } = getBounds(placements);

    const numbering = computeNumbering(placements, minR, minC);

    placements.forEach(p => {
        const key = `${p.row - minR},${p.col - minC}`;
        p.number = numbering.get(key);
    });

    const container = document.getElementById("crossword");
    container.innerHTML = "";

    for (let r = minR; r <= maxR; r++) {

        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        for (let c = minC; c <= maxC; c++) {

            const value = grid[r][c];

            if (value === null) {
                const block = document.createElement("div");
                block.className = "block";
                rowDiv.appendChild(block);
                continue;
            }

            const wrapper = document.createElement("div");
            wrapper.className = "cellWrapper";

            const key = `${r - minR},${c - minC}`;

            const number = document.createElement("div");
            number.className = "number";

            if (numbering.has(key)) {
                number.textContent = numbering.get(key);
            }

            const input = document.createElement("input");
            input.className = "cell";
            input.autocomplete = "off";
            input.autocorrect = "off";
            input.autocapitalize = "off";
            input.spellcheck = false;

            // input.maxLength = 1;

            input.dataset.row = r;
            input.dataset.col = c;

            input.addEventListener("focus", (e) => {
                focusedCell = input;

                // highlight whole word instead of caret
                const r = Number(input.dataset.row);
                const c = Number(input.dataset.col);

                const cells = getWordCells(r, c, activeDirection);
                highlightCells(cells);
            });

            input.addEventListener("click", () => {
                handleCellClick(r, c, input);
                focusedCell = input;
            });

            input.addEventListener("input", (e) => {

                const value = e.target.value;

                if (!value) {
                    return;
                }

                const chars = [...input.value];
                input.value = chars.slice(-1)[0] || "";

                e.target.value =
                    chars[chars.length - 1].toUpperCase();

                moveNext(r, c, activeDirection);
            });

            input.addEventListener("keydown", (e) => {

                if (e.key !== "Backspace") {
                    return;
                }

                if (input.value !== "") {
                    return;
                }

                e.preventDefault();

                let prevR = r;
                let prevC = c;

                if (activeDirection === "across") {
                    prevC--;
                } else {
                    prevR--;
                }

                const prev =
                    document.querySelector(
                        `.cell[data-row="${prevR}"][data-col="${prevC}"]`
                    );

                if (prev) {
                    prev.focus();
                    prev.value = "";
                }
            });

            wrapper.appendChild(number);
            wrapper.appendChild(input);
            rowDiv.appendChild(wrapper);
        }

        container.appendChild(rowDiv);
    }

    const clueList = document.getElementById("clueList");
    clueList.innerHTML = "";

    placements
        .slice()
        .sort((a, b) => a.number - b.number)
        .forEach(p => {

            const li = document.createElement("li");

            const dir =
                p.direction === "across"
                    ? "→"
                    : "↓";

            const clueText =
                document.createElement("div");

            clueText.textContent =
                `${p.number}. ${dir} ${p.french}`;

            li.appendChild(clueText);

            if (p.comment?.trim()) {

                const btn =
                    document.createElement("button");

                btn.textContent =
                    "Show comment";

                const content =
                    document.createElement("div");

                content.className =
                    "extraInfo";

                content.style.display =
                    "none";

                content.textContent =
                    p.comment;

                btn.addEventListener("click", () => {

                    const visible =
                        content.style.display !== "none";

                    content.style.display =
                        visible ? "none" : "block";

                    btn.textContent =
                        visible
                            ? "Show comment"
                            : "Hide comment";
                });

                li.appendChild(btn);
                li.appendChild(content);
            }

            if (p.example?.trim()) {

                const btn =
                    document.createElement("button");

                btn.textContent =
                    "Show example";

                const content =
                    document.createElement("div");

                content.className =
                    "extraInfo";

                content.style.display =
                    "none";

                content.textContent =
                    p.example;

                btn.addEventListener("click", () => {

                    const visible =
                        content.style.display !== "none";

                    content.style.display =
                        visible ? "none" : "block";

                    btn.textContent =
                        visible
                            ? "Show example"
                            : "Hide example";
                });

                li.appendChild(btn);
                li.appendChild(content);
            }

            clueList.appendChild(li);
        });
}

function handleCellClick(r, c, input) {

    const words = getWordsAtCell(r, c);
    if (words.length === 0) return;

    const isSameCell =
        lastClicked &&
        lastClicked.r === r &&
        lastClicked.c === c;

    // choose possible directions
    const hasAcross = words.some(w => w.direction === "across");
    const hasDown = words.some(w => w.direction === "down");

    if (isSameCell) {
        // toggle ONLY if both exist
        if (hasAcross && hasDown) {
            activeDirection =
                activeDirection === "across"
                    ? "down"
                    : "across";
        }
    } else {
        // first click: prefer across first (more natural UX)
        activeDirection = hasAcross ? "across" : "down";
    }

    lastClicked = { r, c };

    const cells = getWordCells(r, c, activeDirection);
    highlightCells(cells);
}

function computeNumbering(placements, minR, minC) {

    const map = new Map();
    let counter = 1;

    const starts = new Set();

    for (const p of placements) {

        const r = p.row - minR;
        const c = p.col - minC;

        const key = `${r},${c}`;

        if (!starts.has(key)) {
            starts.add(key);
            map.set(key, counter++);
        }
    }

    return map;
}

function toKey(r, c) {
    return `${r},${c}`;
}

function checkAll() {

    document
        .querySelectorAll(
            ".cell"
        )
        .forEach(cell => {

            const r =
                Number(
                    cell.dataset.row
                );

            const c =
                Number(
                    cell.dataset.col
                );

            const solution =
                solutionGrid[r][c];

            const user = (cell.value || "").toUpperCase();
            const target = (solution || "").toUpperCase();

            if (user === target) {

                cell.classList
                    .remove("wrong");

                cell.classList
                    .add("correct");
            }
            else {

                cell.classList
                    .remove("correct");

                cell.classList
                    .add("wrong");
            }
        });
}

// function revealAll() {
//     console.log("revealAll clicked");
//     inputs.forEach(input => {
//         input.value = solution;
//     });
// }

function revealAll() {
    console.log("revealAll2 clicked");

    document
        .querySelectorAll(".cell")
        .forEach(cell => {

            const r =
                Number(cell.dataset.row);

            const c =
                Number(cell.dataset.col);

            cell.value =
                solutionGrid[r][c];
        });
}

function getStats() {

    const raw =
        localStorage.getItem("wordStats");

    console.log("raw", raw);
    console.log("typeof raw =", typeof raw);

    const parsed =
        JSON.parse(raw || "{}");

    console.log("parsed =", parsed);
    console.log("parsed type =", typeof parsed);

    return parsed;
}

function getStat(wordId) {

    const stats = getStats();

    console.log("stats =", stats);
    console.log("type =", typeof stats);
    console.log("array =", Array.isArray(stats));
    console.log("keys =", Object.keys(stats));

    console.log("before", wordId, stats[wordId]);

    if (!stats[wordId]) {

        stats[wordId] = {
            solved: 0,
            failed: 0,
            revealWord: 0,
            revealLetter: 0,
            lastSeen: 0
        };

        console.log("created");

        saveStats(stats);
    }

    console.log("after", stats[wordId]);

    return stats[wordId];
}

function getPriority(word) {

    const stats =
        getStats();

    const s =
        stats[word.id] || {};

    const solved =
        s.solved || 0;

    const failed =
        s.failed || 0;

    const revealWord =
        s.revealWord || 0;

    const revealLetter =
        s.revealLetter || 0;

    const lastSeen =
        s.lastSeen || 0;

    const daysSinceSeen =
        (Date.now() - lastSeen)
        / (1000 * 60 * 60 * 24);

    return (
        failed * 20
        + revealWord * 30
        + revealLetter * 5
        - solved * 3
        + Math.min(daysSinceSeen, 20)
        + Math.random() * 10
    );
}

function pickWeighted(words, count) {

    const result = [];
    const pool = [...words];

    while (
        result.length < count &&
        pool.length > 0
    ) {

        const total =
            pool.reduce(
                (sum, w) => sum + w.score,
                0
            );

        let r =
            Math.random() * total;

        let index = 0;

        while (
            r > pool[index].score
        ) {
            r -= pool[index].score;
            index++;
        }

        result.push(
            pool[index].word
        );

        pool.splice(index, 1);
    }

    return result;
}

function saveStats(stats) {

    localStorage.setItem(
        "wordStats",
        JSON.stringify(stats)
    );
}

function saveStat(wordId, stat) {

    const stats =
        getStats();

    stats[wordId] = stat;

    saveStats(stats);
}

function getWordStat(id) {

    const stats = getStats();

    if (!stats[id]) {

        stats[id] = {
            solved: 0,
            failed: 0,
            revealWord: 0,
            revealLetter: 0,
            lastSeen: 0
        };

        saveStats(stats);
    }

    return stats[id];
}

function incrementStat(wordId, field) {

    const stat =
        getStat(wordId);

    console.log(
        "wordId",
        wordId,
        "stat",
        stat
    );

    stat[field] =
        (stat[field] || 0) + 1;

    saveStat(wordId, stat);
}

function markSolved(wordId) {

    if (solvedWords.has(wordId)) {
        return;
    }

    solvedWords.add(wordId);

    incrementStat(wordId, "solved");
}

function markFailed(wordId) {

    if (failedWords.has(wordId)) {
        return;
    }

    failedWords.add(wordId);

    incrementStat(wordId, "failed");
}



function markRevealWord(wordId) {

    if (revealedWords.has(wordId)) {
        return;
    }

    revealedWords.add(wordId);

    incrementStat(wordId, "revealWord");
}

async function generate() {
    failedWords.clear();
    solvedWords.clear();
    revealedWords.clear();
    revealedLetters.clear();

    const vocab = 
        await getFilteredVocab()

    const mode =
        document
        .getElementById(
            "mode"
        )
        .value;
    
    const scored =
        vocab.map(word => ({
            word,
            score: getPriority(word)
        }));

    const selected =
        pickWeighted(
            scored,
            80
        )
        .map(v => ({
            id: v.id,
            clue: v.french,
            french: v.french,
            comment: v.comment,
            example: v.example,
            answer:
                mode === "romaji"
                    ? v.romaji.toUpperCase()
                    : v.hiragana,
            should_study: v.should_study
        }));

    const crossword =
        generateCrossword(
            selected
        );
    
    selected.forEach(word => {

        const stat =
            getStat(word.id);

        stat.lastSeen =
            Date.now();

        saveStat(word.id, stat);
    });

    render(
        crossword.grid,
        crossword.placements
    );
}

generate();