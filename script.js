import Grid, { Solving, SolvingPreset, Setting } from './Grid.js';
import './hide-mirror.js';
import './collapse-sidebar.js';
import { addEl, setText, defaultText, inputInt, addInput, classIf, addButton } from './dom-tools.js';
import numberImage from './number-image.js';
import isMobile from './mobile.js';
import updateProgressSpan from './progress.js';
import { detectTwoLetterLights, detectIslands } from './extra-rules.js';

const preForm = document.getElementById('before'),
	gridEl = document.getElementById('grid'),
	clueList = document.getElementById('clues'),
	titleBox = document.getElementById('title'),
	authorBox = document.getElementById('author'),
	progressSpan = document.getElementById('progress'),
	progressLink = document.getElementById('progress-link'),
	gridTable = document.getElementById('grid-table'),
	solveTickbox = document.getElementById('solve'),
	permalink = document.getElementById('permalink'),
	keyboard = document.getElementById('keyboard');

let grid, cursorX = 0, cursorY = 0;

preForm.addEventListener('submit', e => {
	e.preventDefault();
	grid = new Grid(
		inputInt('subgrids-across'),
		inputInt('subgrids-down'),
		inputInt('subgrid-width'),
		inputInt('subgrid-height'),
		solveTickbox.checked
			? Solving
			: Setting,
		render);
	start();
});

if (window.location.hash) {
	const parts = window.location.hash.substr(1).split(';');
	const [w,h,a,d,...c] = parts.pop().split(',');
	const [title, author] = parts.map(decodeURIComponent);
	if (title) setText(titleBox, title);
	if (author) setText(authorBox, author);
	document.title = 'Junimoji'
		+ (title ? ` - "${title}"` : '')
		+ (author ? ` by ${author}` : '');
	grid = new Grid(
		parseInt(a, 10),
		parseInt(d, 10),
		parseInt(w, 10),
		parseInt(h, 10),
		SolvingPreset,
		render
	);
	start();
	for (const clue of grid.clues) {
		clue.value = c[clue.i];
		if (clue.el.tagName == "SPAN")
			setText(clue.el, c[clue.i]);
		else clue.el.value = c[clue.i];
	}
	const progress = c[grid.clues.length];
	if (progress)
		for (const cell of grid.eachCell()) {
			const p = progress[cell.x + cell.y * grid.totalWidth];
			if (p == '=') cell.block = true;
			else if (/[A-Z]/i.test(p)) cell.letter = p;
		}
	grid.render();
}

function start() {
	preForm.classList.add('hidden');
	gridTable.addEventListener('keydown', cellKey);
	if (grid.setting) {
		progressSpan.classList.add('hidden');
		progressLink.classList.add('hidden');
		addInput(titleBox, 'title-input', 'Untitled', updateLink);
		addInput(authorBox, 'author-input', 'Anonymous', updateLink);
	} else
		defaultText(authorBox, 'unknown author');
	for (const clue of grid.clues) {
		const el = addEl(addEl(clueList, 'li'),
			(grid.setting || grid.preset) ? 'span' : 'input');
		el.classList.add('clue-text');
		if (el.tagName == "INPUT") {
			el.setAttribute('required', true);
			el.addEventListener('change', e => {
				clue.value = el.value;
				grid.render();
			});
		}
		if (grid.solving && !grid.preset)
			el.addEventListener('change', updateLink);
		clue.el = el;
	}
	for (let yi = 0; yi < grid.totalHeight; ++yi) {
		const row = addEl(gridEl, 'tr');
		for (let xi = 0; xi < grid.totalWidth; ++xi) {
			const cell = grid.cell(xi, yi);
			cell.el = addEl(row, 'td');
			classIf(cell.el, 'left', xi % grid.subGridWidth == 0);
			classIf(cell.el, 'right', xi % grid.subGridWidth == grid.subGridWidth - 1);
			classIf(cell.el, 'top', yi % grid.subGridHeight == 0);
			classIf(cell.el, 'bottom', yi % grid.subGridHeight == grid.subGridHeight - 1);
			classIf(cell.el, 'checker', ((xi / grid.subGridWidth) ^ (yi / grid.subGridHeight)) & 1);
			cell.el.addEventListener('click', e => {
				gridEl.focus();
				cursorX = cell.x;
				cursorY = cell.y;
				grid.render();
			});
		}
	}
	for (let x = 0; x < grid.subGridsAcross; ++x)
		for (let y = 0; y < grid.subGridsDown; ++y) {
			const backgroundImage = `url(${numberImage(
				x + y * grid.subGridsAcross + 1,
				(x ^ y) & 1
			)})`;
			for (let u = 0; u < grid.subGridWidth; ++u)
				for (let v = 0; v < grid.subGridHeight; ++v) {
					const xx = (u - grid.subGridWidth / 2) * 2,
						yy = (v - grid.subGridHeight / 2) * 2;
					Object.assign(grid.cell(
						x * grid.subGridWidth + u,
						y * grid.subGridHeight + v
					).el.style, {
						backgroundImage,
						backgroundScale: `
							calc(${grid.subGridWidth * 2}rem + ${grid.subGridWidth - 1}px)
							calc(${grid.subGridHeight * 2}rem + ${grid.subGridHeight - 1}px)`,
						backgroundPosition: `
							calc(${-100 - xx}px - ${xx}rem)
							calc(${-100 - yy}px - ${yy}rem)`
					});

				}
		}
}

function moveCursor(x, y) {
	if (x >= 0 && y >= 0 && x < grid.totalWidth && y < grid.totalHeight) {
		cursorX = x;
		cursorY = y;
		grid.render();
	}
}

function cellKey(e) {
	if (e.ctrlKey) return;
	const cell = grid.cell(cursorX, cursorY);
	switch (e.key) {
		case ' ':
			grid.toggleBlock(cell);
			break;
		case 'ArrowUp':
			moveCursor(cursorX, cursorY - 1);
			break;
		case 'ArrowDown':
			moveCursor(cursorX, cursorY + 1);
			break;
		case 'ArrowLeft':
			moveCursor(cursorX - 1, cursorY);
			break;
		case 'ArrowRight':
			moveCursor(cursorX + 1, cursorY);
			break;
		case 'Backspace':
			grid.emptyCell(cell);
			break;
		case 'Enter':
			moveCursor(cell.mirror.x, cell.mirror.y);
			break;
		case '.':
			grid.toggleExplicitWhite(cell);
			break;
		default:
			if (/^[A-Z]$/i.test(e.key))
				grid.setCell(cell, e.key.toUpperCase());
			else {
				console.log('Unexpected key:', e);
				return;
			}
	}
	e.preventDefault();
};

function render(grid) {
	for (const cell of grid.eachCell()) {
		if (cell.block) {
			setText(cell.el, '');
			cell.el.classList.add('block');
		} else {
			cell.el.classList.remove('block');
			setText(cell.el, cell.letter || (
				(cell.explicitWhite || cell.mirror.letter)
					? '•' : ''));
		}
	}
	for (const clue of grid.clues) {
		if (grid.solving) {
			classIf(clue.el, 'correct', grid.isCorrect(clue));
			classIf(clue.el, 'wrong', !grid.mightBe(clue));
		} else {
			const txt = grid.clueCellsText(clue).replace(/[• ]/g, '');
			clue.value = txt;
			setText(clue.el, txt);
		}
	}
	if (grid.solving) {
		updateProgressSpan(grid);
		updateLink();
		progressLink.setAttribute('href', `${getHash()},${grid.toProgressString()}`);
	}
	if (grid.setting) updateLink();
	document.querySelector('.cursor')?.classList.remove('cursor');
	document.querySelector('.current')?.classList.remove('current');
	document.querySelector('.mirror')?.classList.remove('mirror');
	const cell = grid.cell(cursorX, cursorY);
	cell.el.classList.add('cursor');
	cell.mirror.el.classList.add('mirror');
	const clue = grid.clues[cell.subgrid];
	clue.el.classList.add('current');
	keyboard.innerHTML = '';
	for (const letter of clue.value) {
		const button = addEl(keyboard, 'button');
		setText(button, letter.toUpperCase());
		button.addEventListener('click', e => setCell(cell, letter));
	}
	addButton(keyboard, '•', e => toggleExplicitWhite(cell));
	addButton(keyboard, '⬛', e => toggleBlock(cell));
	addButton(keyboard, '⌫', e => emptyCell(cell));
	detectTwoLetterLights(grid.cells);
	detectIslands(grid.cells);
}

function getHash() {
	const title = titleBox.innerText
		|| document.getElementById('title-input')?.value
		|| 'Untitled';
	const author = authorBox.innerText
		|| document.getElementById('author-input')?.value
		|| 'Anonymous';
	return `#${encodeURIComponent(title)};${encodeURIComponent(author)};${grid.toSolvingString()}`;
}

function updateLink() {
	permalink.setAttribute('href', getHash());
}
