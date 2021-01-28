import dictionary from './dictionaries/dictionary.js';
import getCheckbox from './checkbox.js';
import { clearClass } from './dom-tools.js';

getCheckbox('spellcheck', true);
getCheckbox('detect-repeated-words', false);

export default function checkSpelling(grid) {
	clearClass('misteak');
	clearClass('repeated-word');
	const seenWords = {};
	for (const start of grid.eachCell()) {
		if (!grid.isOpen(start.x, start.y)) continue;
		if (!grid.isOpen(start.x - 1, start.y))
			check(grid, start, { x: 1, y: 0 }, seenWords);
		if (!grid.isOpen(start.x, start.y - 1))
			check(grid, start, { x: 0, y: 1 }, seenWords);
	}
}

function check(grid, start, { x, y }, seenWords) {
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
	if (seenWords[str]) {
		for (const el of seenWords[str])
			el.classList.add('repeated-word');
		for (const el of els)
			el.classList.add('repeated-word');
	} else seenWords[str] = els;
	if (!dictionary.has(str))
		for (const el of els)
			el.classList.add('misteak');
}
