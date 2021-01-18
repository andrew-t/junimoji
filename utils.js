export function clueCellsText(clue) {
	let txt = '';
	for (const cell of clue.cells)
		if (cell.letter && !cell.block)
			txt += cell.letter.toUpperCase();
	return txt;
}
