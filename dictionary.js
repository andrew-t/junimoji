import inBuiltWordList from './dictionaries/dictionary.js';
import treatWord from './dictionaries/treat-word.js';
import getCheckbox from './checkbox.js';
import { setText, addEl, addButton, clearClass } from './dom-tools.js';

getCheckbox('spellcheck', false);
getCheckbox('detect-repeated-words', false);

const list = document.getElementById('misteaks'),
	upload = document.getElementById('learn-words'),
	reset = document.getElementById('reset-dictionary'),
	lookupInput = document.getElementById('schottenator-input'),
	lookupOutput = document.getElementById('schottenator-output');

const storedWords = localStorage.getItem('word-list');
let wordList = storedWords ? storedWords.split(',') : [...inBuiltWordList],
	dictionary = new Set(wordList);

window.addEventListener('storage', e => {
	const storedWords = localStorage.getItem('word-list');
	wordList = storedWords ? storedWords.split(',') : wordList;
	dictionary = new Set(wordList);
	__grid.render();
});

export default function checkSpelling(grid) {
	clearClass('misteak');
	clearClass('repeated-word');
	setText(list, '');
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
	let li;
	if (seenWords[str]) {
		for (const el of seenWords[str])
			el.classList.add('repeated-word');
		for (const el of els)
			el.classList.add('repeated-word');
	} else {
		seenWords[str] = els;
		li = addWordItem(list, str);
	}
	if (!dictionary.has(str)) {
		for (const el of els)
			el.classList.add('misteak');
		if (li) {
			li.classList.add('misteak');
			addButton(li, 'Learn', e => {
				wordList.push(str);
				dictionary.add(str);	
				localStorage.setItem('word-list', wordList);
				grid.render();
			});
		}
	} else if (li) {
		li.classList.add('valid');
		addButton(li, 'Forget', e => {
			wordList = wordList.filter(x => x != str);
			dictionary.delete(str);	
			localStorage.setItem('word-list', wordList);
			grid.render();
		});
	}
}

upload.addEventListener('submit', e => {
	const files = upload.elements[0]?.files;
	if (!files?.length) alert('No files found');
	else if (files.length > 1) alert('Upload one file only');
	else if (files.type?.indexOf('text') < 0) alert('Upload text files only');
	else {
		const reader = new FileReader();
		reader.addEventListener('load', e => {
			const words = reader.result.split('\n').map(treatWord).filter(x => x);
			console.log(words.slice(0, 50));
			if (words.length > 100) {
				wordList = words;
				dictionary = new Set(wordList);
				localStorage.setItem('word-list', wordList);
				// TODO: pass this in in a nice way:
				__grid.render();
			} else
				alert('Seems like the wrong format?');
		});
		reader.addEventListener('error', e => alert(e.message));
		reader.readAsText(files[0]);
	}
	e.preventDefault();
});

reset.addEventListener('submit', e => {
	e.preventDefault();
	wordList = [...inBuiltWordList];
	dictionary = new Set(wordList);
	localStorage.setItem('word-list', inBuiltWordList);
	__grid.render();
});

let t;
lookupInput.addEventListener('input', e => {
	if (t) clearTimeout(t);
	t = setTimeout(() => {
		setText(lookupOutput, '');
		const matcher = new RegExp(
			`^${lookupInput.value.replace(/\?/g, '.')}$`,
			'ig');
		for (const word of wordList)
			if (matcher.test(word))
				addWordItem(lookupOutput, word);
	}, 300);
});

function addWordItem(list, str) {
	const li = addEl(list, 'li');
	const a = addEl(li, 'a');
	a.setAttribute('href', `https://en.wiktionary.org/wiki/${str.toLowerCase()}`);
	a.setAttribute('target', '_blank');
	setText(a, str);
	return li;
}
