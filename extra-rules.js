import { classIf, clearClass } from './dom-tools.js';
import getCheckbox from './checkbox.js';

getCheckbox('extra-rules', true);

export function detectTwoLetterLights(grid) {
	clearClass('two-letters');
	for (const cell of grid.eachCell()) {
		if (cell.block) continue;
		const { x, y } = cell;
		if (!grid.isOpen(x - 1, y) &&
			grid.isOpen(x + 1, y) &&
			!grid.isOpen(x + 2, y)) {
			grid.cell(x, y).el.classList.add('two-letters');
			grid.cell(x + 1, y).el.classList.add('two-letters');
		}
		if (!grid.isOpen(x, y - 1) &&
			grid.isOpen(x, y + 1) &&
			!grid.isOpen(x, y + 2)) {
			grid.cell(x, y).el.classList.add('two-letters');
			grid.cell(x, y + 1).el.classList.add('two-letters');
		}
	}
}

export function detectIslands(grid) {
	clearClass('island');
	const islands = [];
	for (const cell of grid.eachCell()) {
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
		const cell = grid.cell(x, y);
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

function removeArrEl(all, one) {
	all.splice(all.indexOf(one), 1);
}
