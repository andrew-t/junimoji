export function clueCellsText(clue) {
	let txt = '';
	for (const cell of clue.cells)
		if (cell.letter && !cell.block)
			txt += cell.letter.toUpperCase();
		else if (!cell.block)
			txt += '•';
	return txt;
}

export function mightBe(guess, clue) {
	return new RegExp(`^${guess.replace(/•/g, '.?')}\$`).test(clue);
}
