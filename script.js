import './hide-mirror.js';
import './collapse-sidebar.js';
import { addEl, setText, defaultText, inputInt, addInput, classIf } from './dom-tools.js';
import numberImage from './number-image.js';
import { mightBe } from './utils.js';
import isMobile from './mobile.js';
import updateProgressSpan from './progress.js';
import { detectTwoLetterLights, detectIslands } from './extra-rules.js';

const preForm = document.getElementById('before'),
	grid = document.getElementById('grid'),
	clueList = document.getElementById('clues'),
	titleBox = document.getElementById('title'),
	authorBox = document.getElementById('author'),
	progressSpan = document.getElementById('progress'),
	progressLink = document.getElementById('progress-link'),
	gridTable = document.getElementById('grid-table'),
	solveTickbox = document.getElementById('solve'),
	permalink = document.getElementById('permalink'),
	keyboard = document.getElementById('keyboard');

let subGridsAcross, subGridsDown,
	subGridWidth, subGridHeight,
	totalWidth, totalHeight,
	solving, setting, preset;

const cells = [],
	clues = [];

let cursorX = 0, cursorY = 0;

preForm.addEventListener('submit', e => {
	e.preventDefault();
	subGridsAcross = inputInt('subgrids-across');
	subGridsDown = inputInt('subgrids-down');
	subGridWidth = inputInt('subgrid-width');
	subGridHeight = inputInt('subgrid-height');
	solving = solveTickbox.checked;
	setting = !solving;
	preset = false;
	start();
});

if (window.location.hash) {
	const parts = window.location.hash.substr(1).split(';');
	const [w,h,a,d,...c] = parts.pop().split(',');
	const [title, author] = parts.map(decodeURIComponent);
	console.log({parts, title, author})
	if (title) setText(titleBox, title);
	if (author) setText(authorBox, author);
	subGridWidth = parseInt(w, 10);
	subGridHeight = parseInt(h, 10);
	subGridsAcross = parseInt(a, 10);
	subGridsDown = parseInt(d, 10);
	setting = false;
	solving = true;
	preset = true;
	start();
	for (const clue of clues) {
		clue.value = c[clue.i];
		if (clue.el.tagName == "SPAN")
			setText(clue.el, c[clue.i]);
		else clue.el.value = c[clue.i];
	}
	const progress = c[clues.length];
	if (progress)
		for (let x = 0; x < totalWidth; ++x)
			for (let y = 0; y < totalHeight; ++y) {
				const p = progress[x + y * totalWidth];
				if (p == '=') cells[x][y].block = true;
				else if (/[A-Z]/i.test(p)) cells[x][y].letter = p;
			}
	render();
}

function start() {
	preForm.classList.add('hidden');
	gridTable.addEventListener('keydown', cellKey);
	totalWidth = subGridWidth * subGridsAcross;
	totalHeight = subGridHeight * subGridsDown;
	if (setting) {
		progressSpan.classList.add('hidden');
		progressLink.classList.add('hidden');
		addInput(titleBox, 'title-input', 'Untitled', updateLink);
		addInput(authorBox, 'author-input', 'Anonymous', updateLink);
	} else
		defaultText(authorBox, 'unknown author');
	for (let i = 0; i < subGridsAcross * subGridsDown; ++i) {
		const el = addEl(addEl(clueList, 'li'),
			(setting || preset) ? 'span' : 'input');
		const clue = { el, i, value: '', cells: [] };
		el.classList.add('clue-text');
		if (el.tagName == "INPUT") {
			el.setAttribute('required', true);
			el.addEventListener('change', e => {
				clue.value = el.value;
				render();
			});
		}
		clues.push(clue);
		if (solving && !preset)
			el.addEventListener('change', updateLink);
	}
	for (let xi = 0; xi < totalWidth; ++xi)
		cells[xi] = [];
	for (let yi = 0; yi < totalHeight; ++yi) {
		const el = addEl(grid, 'tr');
		for (let xi = 0; xi < totalWidth; ++xi) {
			const cell = cells[xi][yi] = {
				x: xi,
				y: yi,
				subgrid: ~~(yi / subGridHeight) * subGridsAcross + ~~(xi / subGridWidth),
				block: false,
				letter: null,
				el: addEl(el, 'td')
			};
			clues[cell.subgrid].cells.push(cell);
			classIf(cell.el, 'left', xi % subGridWidth == 0);
			classIf(cell.el, 'right', xi % subGridWidth == subGridWidth - 1);
			classIf(cell.el, 'top', yi % subGridHeight == 0);
			classIf(cell.el, 'bottom', yi % subGridHeight == subGridHeight - 1);
			classIf(cell.el, 'checker', ((xi / subGridWidth) ^ (yi / subGridHeight)) & 1);
			cell.el.addEventListener('click', e => {
				grid.focus();
				cursorX = cell.x;
				cursorY = cell.y;
				render();
			});
		}
	}
	for (let x = 0; x < subGridsAcross; ++x)
		for (let y = 0; y < subGridsDown; ++y) {
			const backgroundImage = `url(${numberImage(
				x + y * subGridsAcross + 1,
				(x ^ y) & 1
			)})`;
			for (let u = 0; u < subGridWidth; ++u)
				for (let v = 0; v < subGridHeight; ++v) {
					const xx = (u - subGridWidth / 2) * 2,
						yy = (v - subGridHeight / 2) * 2;
					Object.assign(cells[x * subGridWidth + u][y * subGridHeight + v].el.style, {
						backgroundImage,
						backgroundScale: `
							calc(${subGridWidth * 2}rem + ${subGridWidth - 1}px)
							calc(${subGridHeight * 2}rem + ${subGridHeight - 1}px)`,
						backgroundPosition: `
							calc(${-100 - xx}px - ${xx}rem)
							calc(${-100 - yy}px - ${yy}rem)`
					});

				}
		}
}

function setCell(cell, letter) {
	cell.letter = letter;
	cell.explicitWhite = false;
	cell.block = false;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].block = false;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].explicitWhite = false;
	render();
}

function emptyCell(cell) {
	cell.letter = null;
	cell.explicitWhite = false;
	cell.block = false;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].block = false;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].explicitWhite = false;
	render();
}

function toggleBlock(cell) {
	cell.letter = null;
	cell.explicitWhite = false;
	cell.block = !cell.block;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].letter = null;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].block = cell.block;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].explicitWhite = false;
	render();
}

function toggleExplicitWhite(cell) {
	cell.letter = null;
	cell.block = false;
	cell.explicitWhite = !cell.explicitWhite;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].letter = null;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].block = false;
	cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].explicitWhite = cell.explicitWhite;
	render();
}

function moveCursor(x, y) {
	if (x >= 0 && y >= 0 && x < totalWidth && y < totalHeight) {
		cursorX = x;
		cursorY = y;
		render();
	}
}

function cellKey(e) {
	if (e.ctrlKey) return;
	const cell = cells[cursorX][cursorY];
	switch (e.key) {
		case ' ':
			toggleBlock(cell);
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
			emptyCell(cell);
			break;
		case 'Enter':
			moveCursor(totalWidth - cursorX - 1, totalHeight - cursorY - 1);
			break;
		case '.':
			toggleExplicitWhite(cell);
			break;
		default:
			if (/^[A-Z]$/i.test(e.key))
				setCell(cell, e.key.toUpperCase());
			else {
				console.log('Unexpected key:', e);
				return;
			}
	}
	e.preventDefault();
};

function render() {
	for (let xi = 0; xi < totalWidth; ++xi)
		for (let yi = 0; yi < totalHeight; ++yi) {
			const cell = cells[xi][yi];
			if (cell.block) {
				setText(cell.el, '');
				cell.el.classList.add('block');
			} else {
				cell.el.classList.remove('block');
				setText(cell.el, cell.letter || (
					(cell.explicitWhite ||
					cells[totalWidth - xi - 1][totalHeight - yi - 1].letter)
						? '•' : ''));
			}
		}
	for (const clue of clues) {
		const txt = clueCellsText(clue),
			visTxt = txt.replace(/•/g, '');
		if (solving) {
			classIf(clue.el, 'correct', visTxt == clue.value.toUpperCase());
			classIf(clue.el, 'wrong', !mightBe(txt, clue.value.toUpperCase()));
		} else {
			clue.value = visTxt;
			setText(clue.el, visTxt);
		}
	}
	if (solving) {
		updateProgressSpan(cells);
		let l = '';
		for (let y = 0; y < totalHeight; ++y)
			for (let x = 0; x < totalWidth; ++x)
				l += cells[x][y].block ? '=' : (cells[x][y].letter || '-');
		updateLink();
		progressLink.setAttribute('href', `${getHash()},${l}`);
	}
	if (setting) updateLink();
	document.querySelector('.cursor')?.classList.remove('cursor');
	document.querySelector('.current')?.classList.remove('current');
	document.querySelector('.mirror')?.classList.remove('mirror');
	const cell = cells[cursorX][cursorY];
	cell.el.classList.add('cursor');
	cells[totalWidth - cursorX - 1][totalHeight - cursorY - 1].el.classList.add('mirror');
	const clue = clues[cell.subgrid];
	clue.el.classList.add('current');
	keyboard.innerHTML = '';
	for (const letter of clue.value) {
		const button = addEl(keyboard, 'button');
		setText(button, letter.toUpperCase());
		button.addEventListener('click', e => setCell(cell, letter));
	}
	const dotButton = addEl(keyboard, 'button');
	setText(dotButton, '•');
	dotButton.addEventListener('click', e => toggleExplicitWhite(cell));
	const blackButton = addEl(keyboard, 'button');
	setText(blackButton, '⬛');
	blackButton.addEventListener('click', e => toggleBlock(cell));
	const deleteButton = addEl(keyboard, 'button');
	setText(deleteButton, '⌫');
	deleteButton.addEventListener('click', e => emptyCell(cell));
	detectTwoLetterLights(cells);
	detectIslands(cells);
}

function getHash() {
	const title = titleBox.innerText
		|| document.getElementById('title-input')?.value
		|| 'Untitled';
	const author = authorBox.innerText
		|| document.getElementById('author-input')?.value
		|| 'Anonymous';
	return `#${encodeURIComponent(title)};${encodeURIComponent(author)};${subGridWidth},${subGridHeight},${subGridsAcross},${subGridsDown},${clues.map(c => c.value).join(',')}`;
}

function updateLink() {
	permalink.setAttribute('href', getHash());
}

function clueCellsText(clue) {
	let txt = '';
	for (const cell of clue.cells) {
		if (cell.block)
			continue;
		if (cell.letter)
			txt += cell.letter.toUpperCase();
		else if (cell.explicitWhite ||
			cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].letter)
			txt += '•';
		else
			txt += ' ';
	}
	return txt;
}