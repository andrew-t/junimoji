export function clueCellsText(clue) {
	let txt = '';
	for (const cell of clue.cells)
		if (cell.letter && !cell.block)
			txt += cell.letter.toUpperCase();
	return txt;
}

export function percentComplete(cells) {
	let done = 0, total = 0;
	for (const row of cells)
		for (const cell of row) {
			++total;
			if (cell.block || cell.letter) ++done;
		}
	return done * 100 / total;
}
