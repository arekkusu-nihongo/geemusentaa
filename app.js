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

function canPlace(
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

        if (
            r < 0 ||
            r >= SIZE ||
            c < 0 ||
            c >= SIZE
        ) {
            return false;
        }

        if (
            grid[r][c] !== null &&
            grid[r][c] !== chars[i]
        ) {
            return false;
        }
    }

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

function render(
    grid,
    placements
) {

    solutionGrid =
        grid;

    placedWords =
        placements;

    const container =
        document.getElementById(
            "crossword"
        );

    container.innerHTML =
        "";

    for (
        let r = 0;
        r < SIZE;
        r++
    ) {

        const rowDiv =
            document.createElement(
                "div"
            );

        rowDiv.className =
            "row";

        for (
            let c = 0;
            c < SIZE;
            c++
        ) {

            if (
                grid[r][c]
                === null
            ) {

                const block =
                    document
                    .createElement(
                        "div"
                    );

                block.className =
                    "block";

                rowDiv.appendChild(
                    block
                );

                continue;
            }

            const input =
                document
                .createElement(
                    "input"
                );

            input.className =
                "cell";

            input.dataset.row =
                r;

            input.dataset.col =
                c;

            input.maxLength =
                1;

            rowDiv.appendChild(
                input
            );
        }

        container.appendChild(
            rowDiv
        );
    }

    const clueList =
        document.getElementById(
            "clueList"
        );

    clueList.innerHTML =
        "";

    placements.forEach(
        (p,index) => {

            const li =
                document
                .createElement(
                    "li"
                );

            li.textContent =
                p.french;

            clueList.appendChild(
                li
            );
        }
    );
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