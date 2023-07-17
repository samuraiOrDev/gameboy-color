//ArrayBufeer -> El objeto ArrayBuffer se usa para representar un buffer genérico, de datos binarios brutos con una longitud específica.
function loadRom(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function() { callback(xhr.response) };
	xhr.send();
}
