export function mightBe(guess, clue) {
	return new RegExp(`^${
		guess.replace(/ /g, '.?')
			.replace(/•/g, '.')
	}\$`).test(clue);
}
