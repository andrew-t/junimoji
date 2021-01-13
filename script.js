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
	console.log('Starting...', { subGridWidth, subGridHeight, subGridsAcross, subGridsDown });
	preForm.classList.add('hidden');
	if (!solving) {
		document.getElementById('progress').classList.add('hidden');
		document.getElementById('progress-link').classList.add('hidden');
	}
	for (let i = 0; i < subGridsAcross * subGridsDown; ++i) {
		const el = addEl(addEl(clueList, 'li'), 'input');
		el.i = i;
		el.cells = [];
		el.setAttribute('required', true);
		if (setting || preset) el.setAttribute('disabled', true);
		clues.push(el);
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
	const canvas = document.createElement('canvas');
	canvas.width = 200;
	canvas.height = 200;
	const ctx = canvas.getContext('2d');
	ctx.font = "100px sans-serif";
	ctx.transform(0.6, 0, 0, 1, 40, 0);
	ctx.textAlign = 'center';
	for (let x = 0; x < subGridsAcross; ++x)
		for (let y = 0; y < subGridsDown; ++y) {
			const check = ((x ^ y) & 1);
			ctx.fillStyle = check ? '#FDD' : '#FFF';
			ctx.fillRect(-1, -2, 202, 202);
			ctx.fillStyle = check ? '#FFF' : '#FDD';
			ctx.fillText(x + y * subGridsAcross + 1, 100, 135, 200);
			const img = canvas.toDataURL();
			for (let u = 0; u < subGridWidth; ++u)
				for (let v = 0; v < subGridHeight; ++v) {
					const xx = (u - subGridWidth / 2) * 2,
						yy = (v - subGridHeight / 2) * 2;
					Object.assign(cells[x * subGridWidth + u][y * subGridHeight + v].el.style, {
						backgroundImage: `url(${img})`,
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
				txt += cell.letter.toUpperCase();
		if (solving) {
			if (txt == clue.value.toUpperCase())
				clue.classList.add('correct');
			else clue.classList.remove('correct');
			if (mightBe(txt, clue.value.toUpperCase()))
				clue.classList.remove('wrong');
			else clue.classList.add('wrong');
		} else
			clue.value = txt.toUpperCase();
	}
	if (solving) {
		const p = cells.reduce(
			(a, b) => b.reduce(
				(a, b) => (b.block || b.letter) ? a + 1 : a,
				a),
			0) / (totalWidth * totalHeight);
		document.getElementById('progress').innerHTML = `${Math.floor(p * 100)}% complete`;
		let l = '';
		for (let y = 0; y < totalHeight; ++y)
			for (let x = 0; x < totalWidth; ++x)
				l += cells[x][y].block ? '=' : (cells[x][y].letter || '-');
		updateLink();
		document.getElementById('progress-link').setAttribute('href', `${getHash()},${l}`);
	}
	if (setting) updateLink();
}

function getHash() {
	return `#${subGridWidth},${subGridHeight},${subGridsAcross},${subGridsDown},${clues.map(c => c.value).join(',')}`;
}

function updateLink() {
	document.getElementById('permalink').setAttribute('href', getHash());
}

function inputInt(id) {
	return parseInt(document.getElementById(id).value, 10);
}

function addEl(parent, tag) {
	const el = document.createElement(tag);
	parent.appendChild(el);
	return el;
}

function mightBe(guess, clue) {
	guess = guess.split('');
	while (guess.length) {
		const i = clue.indexOf(guess.shift());
		if (i < 0) return false;
		clue = clue.substr(i + 1);
	}
	return true;
}
