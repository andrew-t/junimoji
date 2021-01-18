import { classIf } from './dom-tools.js';

const checkbox = document.getElementById('mobile');

checkbox.addEventListener('click', update);

function update() {
	classIf(document.body, 'mobile', isMobile());
	localStorage.setItem('mobile', isMobile());
	window.scrollTo(0, 0);
}

switch (localStorage.getItem('mobile')) {
	case 'true': checkbox.checked = true; break;
	case 'false': checkbox.checked = false; break;
	default:
		checkbox.checked = window.matchMedia(
			'screen and (hover: none) and (pointer: coarse)'
		).matches;
		break;
}

update();

export default function isMobile() {
	return checkbox.checked;
}
