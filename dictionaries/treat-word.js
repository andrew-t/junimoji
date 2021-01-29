export default function treatDictionaryWord(word) {
	return word.trim()
		.toUpperCase()
		.replace(/[ÉÊÈ]/g, 'E')
		.replace(/[Ç]/g, 'C')
		.replace(/[Ñ]/g, 'N')
		.replace(/[ÛÜ]/g, 'U')
		.replace(/[ÁÂÄÀÅ]/g, 'A')
		.replace(/[Ï]/g, 'I')
		.replace(/[ÓÖ]/g, 'O');
}
