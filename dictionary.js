import dictionary from './dictionaries/dictionary.js';
import getCheckbox from './checkbox.js';
import { clearClass } from './dom-tools.js';

getCheckbox('spellcheck', true);

export default function checkSpelling(grid) {
	clearClass('misteak');
	for (const start of grid.eachCell()) {
		if (!grid.isOpen(start.x, start.y)) continue;
		if (!grid.isOpen(start.x - 1, start.y))
			check(grid, start, { x: 1, y: 0 });
		if (!grid.isOpen(start.x, start.y - 1))
			check(grid, start, { x: 0, y: 1 });
	}
}

function check(grid, start, { x, y }) {
	const els = [];
	let str = '';
	for (let cell = start;
		cell && grid.isOpen(cell.x, cell.y);
		cell = grid.cell(cell.x + x, cell.y + y))
	{
		els.push(cell.el);
		if (!cell.letter) return;
		str += cell.letter;
	}
	if (str.length < 2) return;
	if (!dictionary.has(str))
		for (const el of els)
			el.classList.add('misteak');
}
