export const Solving = Symbol("Solving");
export const SolvingPreset = Symbol("SolvingPreset");
export const Setting = Symbol("Setting");

export default class Grid {
	constructor(
		subGridsAcross, subGridsDown,
		subGridWidth, subGridHeight,
		mode, renderer,
		symmetry
	) {
		this.subGridsAcross = subGridsAcross;
		this.subGridsDown = subGridsDown;
		this.subGridWidth = subGridWidth;
		this.subGridHeight = subGridHeight;
		this.totalWidth = subGridWidth * subGridsAcross;
		this.totalHeight = subGridHeight * subGridsDown;
		this.mode = mode;
		this.renderer = renderer;
		this.symmetry = symmetry;

		this.clues = [];
		for (let y = 0; y < subGridsDown; ++y)
			for (let x = 0; x < subGridsAcross; ++x)
				this.clues.push({
					x, y,
					i: x + y * subGridsAcross,
					value: '',
					cells: []
				});

		this.cells = [];
		for (let xi = 0; xi < this.totalWidth; ++xi)
			this.cells[xi] = [];
		for (let yi = 0; yi < this.totalHeight; ++yi)
			for (let xi = 0; xi < this.totalWidth; ++xi) {
				const cell = this.cells[xi][yi] = {
					x: xi, y: yi,
					subgrid: ~~(yi / subGridHeight) * subGridsAcross
						+ ~~(xi / subGridWidth),
					block: false,
					letter: null,
					mirrors: []
				};
				this.clues[cell.subgrid].cells.push(cell);
			}
		switch (symmetry) {
			default: if (symmetry) {
				alert("Unknown symmetry: " + symmetry);
				throw new Error("Unknown symmetry: " + symmetry);
			} // otherwise fall through
			case '180':
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y: this.totalHeight - 1 - y }));
				break;
			case '90':
				this.addMirrors((x, y) => ({ x: y, y: this.totalWidth - 1 - x }));
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y: this.totalHeight - 1 - y }));
				this.addMirrors((x, y) => ({ x: this.totalHeight - 1 - y, y: x }));
				break;
			case 'h':
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y }));
				break;
			case 'v':
				this.addMirrors((x, y) => ({ x, y: this.totalHeight - 1 - y }));
				break;
			case 'hv':
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y }));
				this.addMirrors((x, y) => ({ x, y: this.totalHeight - 1 - y }));
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y: this.totalHeight - 1 - y }));
				break;
			case 'diag':
				this.addMirrors((x, y) => ({ x: y, y: x }));
				break;
			case 'antidiag':
				this.addMirrors((x, y) => ({ x: this.totalHeight - 1 - y, y: this.totalWidth - 1 - x }));
				break;
			case '2diag':
				this.addMirrors((x, y) => ({ x: y, y: x }));
				this.addMirrors((x, y) => ({ x: this.totalHeight - 1 - y, y: this.totalWidth - 1 - x }));
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y: this.totalHeight - 1 - y }));
				break;
			case 'hv2diag':
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y }));
				this.addMirrors((x, y) => ({ x: y, y: this.totalWidth - 1 - x }));
				this.addMirrors((x, y) => ({ x, y: this.totalHeight - 1 - y }));
				this.addMirrors((x, y) => ({ x: this.totalHeight - 1 - y, y: x }));
				this.addMirrors((x, y) => ({ x: this.totalWidth - 1 - x, y: this.totalHeight - 1 - y }));
				this.addMirrors((x, y) => ({ x: y, y: x }));
				this.addMirrors((x, y) => ({ x: this.totalHeight - 1 - y, y: this.totalWidth - 1 - x }));
				break;
			case 'none': break;
		}
	}

	addMirrors(tf) {
		for (let yi = 0; yi < this.totalHeight; ++yi)
			for (let xi = 0; xi < this.totalWidth; ++xi) {
				const cell = this.cell(xi, yi),
					{ x, y } = tf(xi, yi),
					mirror = this.cell(x, y);
				if (!mirror) throw new Error("Mirror algorithm failed");
				if (mirror != cell) cell.mirrors.push(mirror);
			}
	}

	cell(x, y) { return this.cells[x]?.[y]; }
	get solving() { return this.mode != Setting; }
	get setting() { return this.mode == Setting; }
	get preset() { return this.mode == SolvingPreset; }
	
	render() {
		if (this.renderEnqueued) return;
		this.renderEnqueued = true;
		window.requestAnimationFrame(() => {
			this.renderer(this);
			this.renderEnqueued = false;
		});
	}

	*eachCell() {
		for (let x = 0; x < this.totalWidth; ++x)
			for (let y = 0; y < this.totalHeight; ++y)
				yield this.cell(x, y);
	}

	setCell(cell, letter) {
		cell.letter = letter;
		cell.explicitWhite = false;
		cell.block = false;
		for (const mirror of cell.mirrors) {
			mirror.block = false;
			mirror.explicitWhite = false;
		}
		this.render();
	}

	emptyCell(cell) {
		cell.letter = null;
		cell.explicitWhite = false;
		cell.block = false;
		for (const mirror of cell.mirrors) {
			mirror.block = false;
			mirror.explicitWhite = false;
		}
		this.render();
	}

	toggleBlock(cell) {
		cell.letter = null;
		cell.explicitWhite = false;
		cell.block = !cell.block;
		for (const mirror of cell.mirrors) {
			mirror.letter = null;
			mirror.block = cell.block;
			mirror.explicitWhite = false;
		}
		this.render();
	}

	toggleExplicitWhite(cell) {
		if (cell.mirrors[0]?.letter) return;
		cell.letter = null;
		cell.block = false;
		cell.explicitWhite = !cell.explicitWhite;
		for (const mirror of cell.mirrors) {
			mirror.letter = null;
			mirror.block = false;
			mirror.explicitWhite = cell.explicitWhite;
		}
		this.render();
	}
	
	// true if there's a cell at {x,y} and it's not a block
	isOpen(x, y) { return !(this.cells[x]?.[y]?.block ?? true); }

	toSolvingJson(solutionHash) {
		const done = this.percentComplete() == 100;
		const j = {
			a: this.subGridsAcross,
			d: this.subGridsDown,
			w: this.subGridWidth,
			h: this.subGridHeight,
			c: (this.mode != Setting || done) ? this.clues.map(c => c.value) : undefined,
			p: done ? undefined : this.toProgressString(),
			s: this.symmetry,
		};
		if (solutionHash) j.sh = solutionHash;
		else if (this.mode == Setting && done) j.sh = this.toHashString();
		return j;
	}

	toProgressString() {
		let l = '';
		for (let y = 0; y < this.totalHeight; ++y)
			for (let x = 0; x < this.totalWidth; ++x) {
				const cell = this.cell(x, y);
				l += cell.block ? '=' : (cell.letter || '-');
			}
		return l;
	}

	toHashString() {
		let i = 0;
		for (const c of this.toProgressString().split(''))
			i = ~~(i * 111317 + c.charCodeAt(0) * 198733);
		return i.toString(36);
	}

	clueCellsText(clue) {
		let txt = '';
		for (const cell of clue.cells) {
			if (cell.block)
				continue;
			if (cell.letter)
				txt += cell.letter.toUpperCase();
			else if (cell.explicitWhite || cell.mirrors[0]?.letter)
				txt += '•';
			else
				txt += ' ';
		}
		return txt;
	}

	mightBe(clue) {
		return new RegExp(`^${
			this.clueCellsText(clue)
				.replace(/ /g, '.?')
				.replace(/•/g, '.')
		}\$`).test(
			clue.value.toUpperCase()
		);
	}

	isCorrect(clue) {
		return this.clueCellsText(clue).replace(/[• ]/g, '.') == clue.value.toUpperCase();
	}

	percentComplete() {
		let done = 0;
		for (const cell of this.eachCell())
			if (cell.block || cell.letter) ++done;
		return done * 100 / (this.totalWidth * this.totalHeight);
	}
}
