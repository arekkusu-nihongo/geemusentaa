const SIZE = 20;

let solutionGrid = [];
let placedWords = [];

document
    .getElementById("generateBtn")
    .addEventListener("click", generate);

document
    .getElementById("checkBtn")
    .addEventListener("click", checkAll);

document
    .getElementById("revealAllBtn")
    .addEventListener("click", revealAll);

async function loadVocabulary() {

    const response =
        await fetch("vocab.tsv");

    const text =
        await response.text();

    return text
        .trim()
        .split("\n")
        .map(line => {

            const [
                french,
                romaji,
                hiragana
            ] = line.split("\t");

            return {
                french,
                romaji,
                hiragana
            };
        });
}

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

function render(grid, placements) {

    solutionGrid = grid;
    placedWords = placements;

    const { minR, maxR, minC, maxC } = getBounds(placements);

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

            const input = document.createElement("input");
            input.className = "cell";
            input.maxLength = 1;

            input.dataset.row = r;
            input.dataset.col = c;

            wrapper.appendChild(input);
            rowDiv.appendChild(wrapper);
        }

        container.appendChild(rowDiv);
    }

    // clues
    const clueList = document.getElementById("clueList");
    clueList.innerHTML = "";

    placements.forEach((p, i) => {

        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${p.french}`;
        clueList.appendChild(li);
    });
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

            if (
                cell.value
                === solution
            ) {

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

async function generate() {

    const vocab =
        await loadVocabulary();

    const mode =
        document
        .getElementById(
            "mode"
        )
        .value;

    const selected =
        vocab
        .slice()
        .sort(
            ()=>Math.random()-0.5
        )
        .slice(0,10)
        .map(v => ({
            clue:
                v.french,

            french:
                v.french,

            answer:
                mode === "romaji"
                ? v.romaji
                    .toUpperCase()
                : v.hiragana
        }));

    const crossword =
        generateCrossword(
            selected
        );

    render(
        crossword.grid,
        crossword.placements
    );
}

generate();