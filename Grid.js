export const Solving = Symbol("Solving");
export const SolvingPreset = Symbol("SolvingPreset");
export const Setting = Symbol("Setting");

export default class Grid {
	constructor(
		subGridsAcross, subGridsDown,
		subGridWidth, subGridHeight,
		mode, renderer
	) {
		this.subGridsAcross = subGridsAcross;
		this.subGridsDown = subGridsDown;
		this.subGridWidth = subGridWidth;
		this.subGridHeight = subGridHeight;
		this.totalWidth = subGridWidth * subGridsAcross;
		this.totalHeight = subGridHeight * subGridsDown;
		this.mode = mode;
		this.renderer = renderer;

		this.clues = [];
		for (let y = 0; y < subGridsAcross; ++y)
			for (let x = 0; x < subGridsDown; ++x)
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
					letter: null
				};
				this.clues[cell.subgrid].cells.push(cell);
			}
		for (let yi = 0; yi < this.totalHeight; ++yi)
			for (let xi = 0; xi < this.totalWidth; ++xi)
				this.cell(xi, yi).mirror = this.cell(
					this.totalWidth - 1 - xi,
					this.totalHeight - 1 - yi
				);
	}

	cell(x, y) { return this.cells[x]?.[y]; }
	get solving() { return this.mode != Setting; }
	get setting() { return this.mode == Setting; }
	get preset() { return this.mode == SolvingPreset; }
	render() { this.renderer(this); }

	*eachCell() {
		for (let x = 0; x < this.totalWidth; ++x)
			for (let y = 0; y < this.totalHeight; ++y)
				yield this.cell(x, y);
	}

	setCell(cell, letter) {
		cell.letter = letter;
		cell.explicitWhite = false;
		cell.block = false;
		cell.mirror.block = false;
		cell.mirror.explicitWhite = false;
		this.render();
	}

	emptyCell(cell) {
		cell.letter = null;
		cell.explicitWhite = false;
		cell.block = false;
		cell.mirror.block = false;
		cell.mirror.explicitWhite = false;
		this.render();
	}

	toggleBlock(cell) {
		cell.letter = null;
		cell.explicitWhite = false;
		cell.block = !cell.block;
		cell.mirror.letter = null;
		cell.mirror.block = cell.block;
		cell.mirror.explicitWhite = false;
		this.render();
	}

	toggleExplicitWhite(cell) {
		if (cell.mirror.letter) return;
		cell.letter = null;
		cell.block = false;
		cell.explicitWhite = !cell.explicitWhite;
		cell.mirror.letter = null;
		cell.mirror.block = false;
		cell.mirror.explicitWhite = cell.explicitWhite;
		this.render();
	}

	toSolvingString() {
		return `${this.subGridWidth},${this.subGridHeight},${this.subGridsAcross},${this.subGridsDown},${this.clues.map(c => c.value).join(',')}`;
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

	clueCellsText(clue) {
		let txt = '';
		for (const cell of clue.cells) {
			if (cell.block)
				continue;
			if (cell.letter)
				txt += cell.letter.toUpperCase();
			else if (cell.explicitWhite || cell.mirror.letter)
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
