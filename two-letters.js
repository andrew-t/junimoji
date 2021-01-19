import { clearClass } from './dom-tools.js';

export default function detectTwoLetterLights(cells) {
	clearClass('two-letters');
	for (const row of cells) for (const cell of row) {
		if (cell.block) continue;
		const { x, y } = cell;
		if (!isOpen(cells, x - 1, y) &&
			isOpen(cells, x + 1, y) &&
			!isOpen(cells, x + 2, y)) {
			console.log('across two', cell)
			cells[x][y].el.classList.add('two-letters');
			cells[x + 1][y].el.classList.add('two-letters');
		}
		if (!isOpen(cells, x, y - 1) &&
			isOpen(cells, x, y + 1) &&
			!isOpen(cells, x, y + 2)) {
			console.log('down two', cell)
			cells[x][y].el.classList.add('two-letters');
			cells[x][y + 1].el.classList.add('two-letters');
		}
	}
}

function set(cells, x, y) {
	cells[x][y].el
}

function isOpen(cells, x, y) {
	return !(cells[x]?.[y]?.block ?? true);
}
