Limitations of this first version

This works, but it's a "greedy" crossword generator.

It does not yet:

enforce professional crossword spacing rules
maximize intersections
number clues
check individual words
reveal letters
auto-advance cursor
save progress
guarantee all selected words are placed

For a vocabulary-learning site, this version is already usable.

If you want something closer to newspaper-quality crosswords, I can also provide a second version with:

clue numbering,
keyboard navigation,
word-by-word validation,
reveal letter / reveal word,
smarter crossword generation (backtracking instead of greedy placement),
mobile-friendly layout,
dark mode,

while still remaining deployable as a static GitHub Pages site.


# Crossword App TODO

## 🧩 Core Fixes / Stability
- [ ] Ensure consistent uppercase handling (input + reveal + check)
- [ ] Fix mobile input reliability (avoid double triggers / focus issues)
- [ ] Make grid responsive (fit small screens without overflow)
- [ ] Adjust grid size dynamically for mobile (e.g. 12x12 vs 20x20)

---

## 🎯 Cell Interaction (NEW — HIGH PRIORITY)
- [ ] Highlight full word when a cell is selected
- [ ] Detect whether cell belongs to across, down, or both words
- [ ] If both directions exist:
  - [ ] first click → select current direction word
  - [ ] second click on same cell → toggle direction (across ↔ down)
- [ ] Visually indicate active word (highlight all cells in word)
- [ ] Visually indicate active direction (arrow or subtle marker)

---

## ✍️ Input UX Improvements
- [ ] Auto-move to next cell only when 1 character is entered
- [ ] Prevent skipping already-filled cells (optional smart skip)
- [ ] Add optional backspace navigation to previous cell
- [ ] Handle mobile keyboard edge cases (focus loss, repeat events)

---

## 🧠 Crossword UX Enhancements
- [ ] Click clue → focus corresponding word
- [ ] Highlight clue when word is selected
- [ ] Show clue direction (→ / ↓) consistently linked to grid

---

## 📱 Mobile UX
- [ ] Improve touch targets (larger cells on mobile)
- [ ] Add tap-to-toggle direction on ambiguous cells
- [ ] Optional on-screen hiragana keyboard (for Japanese mode)
- [ ] Prevent zoom / layout shift on input focus

---

## 🎨 Visual Feedback
- [ ] Highlight selected cell
- [ ] Highlight active word (primary highlight)
- [ ] Dim non-active cells slightly
- [ ] Mark correct / wrong states more clearly
- [ ] Add “reveal” styling distinct from user input

---

## 🔍 Game Features
- [ ] Reveal letter / word cooldown or limit (optional game mode)
- [ ] Track completion progress
- [ ] Add win detection (all cells correct)