var input = [];
self.port.on('onOpen', function(inputData) {
	//template = Mustache.parse(inputData['template']);	
	document.body.innerHTML = Mustache.render(inputData['template'], inputData['view']);
	
	self.port.emit('setHeight', document.body.offsetHeight);
});