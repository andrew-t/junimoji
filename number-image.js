const canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 200;

const ctx = canvas.getContext('2d');
ctx.font = "100px sans-serif";
ctx.transform(0.6, 0, 0, 1, 40, 0);
ctx.textAlign = 'center';

export default function numberImage(n, check) {
	ctx.fillStyle = check ? '#FDD' : '#FFF';
	ctx.fillRect(-1, -2, 202, 202);
	ctx.fillStyle = check ? '#FFF' : '#FDD';
	ctx.fillText(n, 100, 135, 200);
	return canvas.toDataURL();
}
