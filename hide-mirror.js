const checkbox = document.getElementById('hide-mirror');

if (localStorage.getItem('hide-mirror') === true)
	checkbox.checked = true;
update();

checkbox.addEventListener('click', update);

function update() {
	if (checkbox.checked)
		document.body.classList.add('hide-mirror');
	else
		document.body.classList.remove('hide-mirror');
	localStorage.setItem('hide-mirror', checkbox.checked);
}
