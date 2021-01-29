// get a dictionary from https://sourceforge.net/projects/wordlist/files/speller/2020.12.07/ (in turn from http://wordlist.aspell.net/dicts/)

const fs = require('fs');
const treatWord = require('./treat-word.js');

const dict = fs.readFileSync('en_GB-large.dic', 'utf8')
	.split('\n')
	.map(x => x.split('/')[0]) // don't care about tags
	.filter(x => x.length > 2) // chec two-letter words yourself
	.filter(x => !/\d|[A-Z']/.test(x)) // numbers & capitals
	.map(treatWord);

for (const x of dict) {
	const xx = x.replace(/[a-z]/gi, '');
	if (xx) console.log(xx);
}

fs.writeFileSync(
	'dictionary.js',
	`export default new Set(${JSON.stringify(dict)});`
);
