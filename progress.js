import { addEl } from './dom-tools.js';

const progressSpan = document.getElementById('progress'),
	board = document.getElementById('grid-table');

export default function updateProgressSpan(grid) {
	const pc = grid.percentComplete();
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
