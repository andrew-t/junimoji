import { clearClass } from './dom-tools.js';

const button = document.getElementById('toggle-sidebar'),
	sidebar = document.getElementById('sidebar');

button.addEventListener('click',
	e => sidebar.classList.toggle('collapsed'));

for (const tab of document.querySelectorAll('.tab')) {
	const toggle = tab.querySelector('.toggle');
	toggle.addEventListener('click', e => {
		clearClass('expanded');
		tab.scrollTo(0, 0);
		tab.classList.add('expanded');
	});
}
