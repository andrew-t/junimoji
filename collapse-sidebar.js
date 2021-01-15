const button = document.getElementById('toggle-sidebar'),
	sidebar = document.getElementById('sidebar');

button.addEventListener('click',
	e => sidebar.classList.toggle('collapsed'));
