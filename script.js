import Grid, { Solving, SolvingPreset, Setting } from './Grid.js';
import './collapse-sidebar.js';
import { addEl, setText, defaultText, inputInt, addInput, classIf, addButton, addTextArea } from './dom-tools.js';
import numberImage from './number-image.js';
import updateProgressSpan from './progress.js';
import { detectTwoLetterLights, detectIslands } from './extra-rules.js';
import getCheckbox from './checkbox.js';
import checkSpelling from './dictionary.js';

const preForm = document.getElementById('before'),
	gridEl = document.getElementById('grid'),
	clueList = document.getElementById('clues'),
	titleBox = document.getElementById('title'),
	authorBox = document.getElementById('author'),
	blurbBox = document.getElementById('blurb'),
	progressSpan = document.getElementById('progress'),
	progressLink = document.getElementById('progress-link'),
	onTheCard = document.getElementById('on-the-card'),
	gridTable = document.getElementById('grid-table'),
	solveTickbox = document.getElementById('solve'),
	fastMode = getCheckbox('fast-mode', false),
	permalink = document.getElementById('permalink'),
	keyboard = document.getElementById('keyboard');

let grid, cursorX = 0, cursorY = 0, solutionHash;

preForm.addEventListener('submit', e => {
	e.preventDefault();
	grid = new Grid(
		inputInt('subgrids-across'),
		inputInt('subgrids-down'),
		inputInt('subgrid-width'),
		inputInt('subgrid-height'),
		solveTickbox.checked ? Solving : Setting,
		render);
	start();
});

const puzzleString = window.location.search.substr(1) || window.location.hash.substr(1);
if (puzzleString) {
	let j;
	try {
		j = JSON.parse(atob(puzzleString.replace(/=+$/, '')));
	} catch {
		const parts = puzzleString.split(';');
		const [w, h, a, d, ...c] = parts.pop().split(',');
		const [title, author, blurb] = parts.map(decodeURIComponent);
		const p = c.length > a * d ? c.pop() : undefined;
		j = {
			w: parseInt(w, 10),
			h: parseInt(h, 10),
			a: parseInt(a, 10),
			d: parseInt(d, 10),
			title, author, blurb,
			c: c.map(c => c.split('/')[0]),
			sh: c.map(c => c.split('/')[1]).find(h => h),
			p
		};
	}
	console.log("Starting puzzle", j);
	if (j.c) {
		if (j.title) setText(titleBox, j.title);
		if (j.author) setText(authorBox, j.author);
		if (j.blurb && blurb != 'Blurb') setText(blurbBox, j.blurb);
	}
	document.title = 'Junimoji'
		+ (j.title ? ` - "${j.title}"` : '')
		+ (j.author ? ` by ${j.author}` : '');
	grid = new Grid(j.a, j.d, j.w, j.h, j.c ? SolvingPreset : Setting, render);
	start(j);
	solutionHash = j.sh;
	if (j.c) for (const clue of grid.clues) {
		const { i, el } = clue;
		const clueValue = j.c[i];
		clue.value = clueValue;
		if (el.tagName == "SPAN")
			setText(el, clueValue);
		else el.value = clueValue;
	}
	if (j.p)
		for (const cell of grid.eachCell()) {
			const p = j.p[cell.x + cell.y * grid.totalWidth];
			if (p == '=') cell.block = true;
			else if (/[A-Z]/i.test(p)) cell.letter = p;
		}
	grid.render();
}
document.body.classList.add('loaded');

function start(j = {}) {
	window.__grid = grid; // for debug
	preForm.classList.add('hidden');
	gridTable.addEventListener('keydown', cellKey);
	if (grid.setting) {
		addInput(titleBox, 'title-input', 'Title', j.title ?? 'Untitled', e => updateLink());
		addInput(authorBox, 'author-input', 'Author', j.author ?? 'Anonymous', e => updateLink());
		addTextArea(blurbBox, 'blurb-input', 'Blurb', j.blurb ?? '', e => updateLink());
	} else {
		defaultText(titleBox, 'Junimoji');
		defaultText(authorBox, 'unknown author');
	}
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
			el.addEventListener('change', () => updateLink());
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
				cursorX = cell.x;
				cursorY = cell.y;
				if (fastMode.checked) {
					grid.toggleBlock(cell);
					for (const clue of grid.clues)
						if (grid.clueCellsText(clue).length == clue.value.length) {
							let c = clue.value.split('');
							for (const cell of clue.cells)
								if (!cell.block) grid.setCell(cell, c.shift());
						} else for (const cell of clue.cells)
							if (!cell.block) grid.emptyCell(cell);
				} else gridEl.focus();
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
	if (fastMode.checked || e.metaKey || e.ctrlKey) return;
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
	updateProgressSpan(grid);
	updateLink();
	document.querySelector('.cursor')?.classList.remove('cursor');
	document.querySelector('.current')?.classList.remove('current');
	document.querySelector('.mirror')?.classList.remove('mirror');
	const cell = grid.cell(cursorX, cursorY);
	cell.el.classList.add('cursor');
	cell.mirror.el.classList.add('mirror');
	const clue = grid.clues[cell.subgrid];
	clue.el.classList.add('current');
	keyboard.innerHTML = '';
	for (const letter of clue.value)
		addButton(keyboard, letter.toUpperCase(), e => grid.setCell(cell, letter)).classList.add('letter');
	addButton(keyboard, '•', e => grid.toggleExplicitWhite(cell));
	addButton(keyboard, '⬛', e => grid.toggleBlock(cell));
	addButton(keyboard, '⌫', e => grid.emptyCell(cell));
	classIf(keyboard, 'wrong', !grid.mightBe(clue));
	detectTwoLetterLights(grid);
	detectIslands(grid);
	checkSpelling(grid);
	if (solutionHash) {
		classIf(onTheCard, 'hidden', grid.percentComplete() < 100);
		setText(onTheCard, grid.toHashString() == solutionHash
			? "That's the answer on the card!"
			: "That's not the answer on the card.");
	}
}

function getValue(inputId, container, defaultValue) {
	const input = document.getElementById(inputId);
	return input ? input.value || defaultValue : container.innerText;
}

function getJson() {
	const title = getValue('title-input', titleBox, 'Untitled');
	const author = getValue('author-input', authorBox, 'Anonymous');
	const blurb = getValue('blurb-input', blurbBox, '');
	return {
		...grid.toSolvingJson(solutionHash),
		title, author, blurb
	};
}

function updateLink() {
	if (grid.mode != Setting) setText(permalink, 'Continue from here');
	else if (grid.percentComplete() == 100) setText(permalink, 'Link for solvers');
	else setText(permalink, 'Continue setting from here');
	permalink.setAttribute('href', '?' + btoa(JSON.stringify(getJson())));
}

getCheckbox('hide-mirror', false);
getCheckbox('disable-dark-mode', false);
getCheckbox('mobile',
	window.matchMedia('screen and (hover: none) and (pointer: coarse)').matches,
	checked => window.scrollTo(0, 0));
