import { addEl } from './dom-tools.js';

const progressSpan = document.getElementById('progress'),
	board = document.getElementById('grid-table');

export function percentComplete(grid) {
	let done = 0, total = 0;
	for (const cell of grid.eachCell()) {
		++total;
		if (cell.block || cell.letter) ++done;
	}
	return done * 100 / total;
}

export default function updateProgressSpan(grid) {
	const pc = percentComplete(grid);
	progressSpan.innerHTML = `${Math.floor(pc)}% complete `;
	if (pc == 100) {
		const button = addEl(progressSpan, 'button');
		button.innerHTML = 'Let’s rotate the board!';
		button.addEventListener('click', () => {
			board.classList.add('rotating');
			setTimeout(() => board.classList.remove('rotating'), 2000);
		});
	}
}
