import { classIf, clearClass } from './dom-tools.js';
import getCheckbox from './checkbox.js';

getCheckbox('extra-rules', true);

export function detectTwoLetterLights(cells) {
	clearClass('two-letters');
	for (const row of cells) for (const cell of row) {
		if (cell.block) continue;
		const { x, y } = cell;
		if (!isOpen(cells, x - 1, y) &&
			isOpen(cells, x + 1, y) &&
			!isOpen(cells, x + 2, y)) {
			cells[x][y].el.classList.add('two-letters');
			cells[x + 1][y].el.classList.add('two-letters');
		}
		if (!isOpen(cells, x, y - 1) &&
			isOpen(cells, x, y + 1) &&
			!isOpen(cells, x, y + 2)) {
			cells[x][y].el.classList.add('two-letters');
			cells[x][y + 1].el.classList.add('two-letters');
		}
	}
}

export function detectIslands(cells) {
	clearClass('island');
	const islands = [];
	for (const row of cells) for (const cell of row) {
		if (cell.block) continue;
		const island = new Set([ cell ]);
		check(cell, -1, 0, island);
		check(cell, 1, 0, island);
		check(cell, 0, -1, island);
		check(cell, 0, 1, island);
		islands.push(island);
	}
	if (islands.length > 1) {
		islands.sort((a, b) => b.size - a.size);
		for (const island of islands.slice(1))
			for (const cell of island.values())
				cell.el.classList.add('island');
	}
	function check(preCell, dx, dy, preIsland) {
		const x = preCell.x + dx,
			y = preCell.y + dy;
		const cell = cells[x]?.[y];
		if (!cell || cell.block) return;
		for (const island of islands)
			if (island.has(cell)) {
				for (const c of island.values())
					preIsland.add(c);
				removeArrEl(islands, island);
				return;
			}
	}
}

function set(cells, x, y) {
	cells[x][y].el
}

function isOpen(cells, x, y) {
	return !(cells[x]?.[y]?.block ?? true);
}

function removeArrEl(all, one) {
	all.splice(all.indexOf(one), 1);
}
