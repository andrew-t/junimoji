import { classIf } from './dom-tools.js';

export default function checkbox(id, defaultValue, onUpdate) {
	const checkbox = document.getElementById(id);
	const val = localStorage.getItem(id);
	checkbox.checked = val ? val == 'true' : defaultValue;
	update();
	checkbox.addEventListener('click', update);
	function update() {
		classIf(document.body, id, checkbox.checked);
		onUpdate?.(checkbox.checked);
		localStorage.setItem(id, checkbox.checked);
	}
}
