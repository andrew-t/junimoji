const preForm = document.getElementById('before'),
	grid = document.getElementById('grid'),
	clueList = document.getElementById('clues');

let subGridsAcross,
	subGridsDown,
	subGridWidth,
	subGridHeight,
	totalWidth,
	totalHeight,
	solving, setting, preset;

const cells = [],
	clues = [];

preForm.addEventListener('submit', e => {
	e.preventDefault();
	subGridsAcross = inputInt('subgrids-across');
	subGridsDown = inputInt('subgrids-down');
	subGridWidth = inputInt('subgrid-width');
	subGridHeight = inputInt('subgrid-height');
	solving = document.getElementById('solve').checked;
	setting = !solving;
	preset = false;
	totalWidth = subGridWidth * subGridsAcross;
	totalHeight = subGridHeight * subGridsDown;
	start();
});

if (window.location.hash) {
	const [w,h,a,d,...c] = window.location.hash.substr(1).split(',');
	subGridWidth = parseInt(w, 10);
	subGridHeight = parseInt(h, 10);
	subGridsAcross = parseInt(a, 10);
	subGridsDown = parseInt(d, 10);
	totalWidth = subGridWidth * subGridsAcross;
	totalHeight = subGridHeight * subGridsDown;
	setting = false;
	solving = true;
	preset = true;
	start();
	for (const clue of clues)
		clue.value = c[clue.i];
	render();
}

function start() {
	console.log('Starting...', { subGridWidth, subGridHeight, subGridsAcross, subGridsDown });
	preForm.classList.add('hidden');
	for (let i = 0; i < subGridsAcross * subGridsDown; ++i) {
		const el = addEl(addEl(clueList, 'li'), 'input');
		el.i = i;
		el.cells = [];
		el.setAttribute('required', true);
		if (setting || preset) el.setAttribute('disabled', true);
		clues.push(el);
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
			cell.el.setAttribute('tabindex', 0);
			cell.el.addEventListener('keydown', cellKey(cell));
			if (xi % subGridWidth == 0) cell.el.classList.add('left');
			if (xi % subGridWidth == subGridWidth - 1) cell.el.classList.add('right');
			if (yi % subGridHeight == 0) cell.el.classList.add('top');
			if (yi % subGridHeight == subGridHeight - 1) cell.el.classList.add('bottom');
			if (((xi / subGridWidth) ^ (yi / subGridHeight)) & 1) cell.el.classList.add('checker');
			cell.el.addEventListener('focus', e => clues[cell.subgrid]?.classList.add('current'));
			cell.el.addEventListener('blur', e => clues[cell.subgrid]?.classList.remove('current'));
		}
	}
}

function cellKey(cell) {
	return e => {
		switch (e.key) {
			case ' ':
				cell.block = !cell.block;
				cells[totalWidth - 1 - cell.x][totalHeight - 1 - cell.y].block = cell.block;
				e.preventDefault();
				break;
			case 'ArrowUp':
				cells[cell.x]?.[cell.y - 1]?.el.focus();
				e.preventDefault();
				break;
			case 'ArrowDown':
				cells[cell.x]?.[cell.y + 1]?.el.focus();
				e.preventDefault();
				break;
			case 'ArrowLeft':
				cells[cell.x - 1]?.[cell.y]?.el.focus();
				e.preventDefault();
				break;
			case 'ArrowRight':
				cells[cell.x + 1]?.[cell.y]?.el.focus();
				e.preventDefault();
				break;
			case 'Backspace':
				cell.letter = null;
				e.preventDefault();
				break;
			default:
				if (/^[A-Z]$/i.test(e.key)) {
					cell.letter = e.key.toUpperCase();
					e.preventDefault();
				}
				else
					console.log('Unexpected key:', e);
		}
		render();
	};
}

function render() {
	for (let xi = 0; xi < totalWidth; ++xi)
		for (let yi = 0; yi < totalHeight; ++yi) {
			const cell = cells[xi][yi];
			if (cell.block) cell.el.classList.add('block');
			else cell.el.classList.remove('block');
			cell.el.innerHTML = !cell.block && cell.letter || '';
		}
	for (const clue of clues) {
		let txt = '';
		for (const cell of clue.cells)
			if (cell.letter && !cell.block)
				txt += cell.letter;
		if (solving) {
			if (txt.toUpperCase() == clue.value.toUpperCase())
				clue.classList.add('correct');
			else clue.classList.remove('correct');
		} else
			clue.value = txt.toUpperCase();
	}
	if (setting) {
		document.getElementById('permalink').setAttribute('href', `#${subGridWidth},${subGridHeight},${subGridsAcross},${subGridsDown},${clues.map(c => c.value).join(',')}`);
	}
}

function inputInt(id) {
	return parseInt(document.getElementById(id).value, 10);
}

function addEl(parent, tag) {
	const el = document.createElement(tag);
	parent.appendChild(el);
	return el;
}
