export function inputInt(id) {
	return parseInt(document.getElementById(id).value, 10);
}

export function addEl(parent, tag) {
	const el = document.createElement(tag);
	parent.appendChild(el);
	return el;
}

export function setText(el, text) {
	el.innerHTML = "";
	el.appendChild(document.createTextNode(text));
}

export function defaultText(el, text) {
	if (!el.innerText) setText(el, text);
}

export function addInput(parent, id, label, value, onChange) {
	const labelEl = addEl(parent, 'label');
	setText(labelEl, label);
	const input = addEl(labelEl, 'input');
	input.id = id;
	input.value = value;
	input.addEventListener('change', onChange);
}

export function addTextArea(parent, id, label, value, onChange) {
	const labelEl = addEl(parent, 'label');
	setText(labelEl, label);
	const input = addEl(labelEl, 'textarea');
	input.id = id;
	input.value = value;
	input.addEventListener('change', onChange);
}

export function classIf(el, className, condition) {
	if (condition) el.classList.add(className);
	else el.classList.remove(className);
}

export function clearClass(className) {
	for (const el of [...document.getElementsByClassName(className)])
		el.classList.remove(className);
}

export function addButton(parent, label, callback) {
	const button = addEl(parent, 'button');
	setText(button, label);
	button.addEventListener('click', callback);
}
