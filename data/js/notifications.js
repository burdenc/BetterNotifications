var input = [];
self.port.on('onOpen', function(inputData) {
	//template = Mustache.parse(inputData['template']);
	inputData['view']['link2Text'] = function() {
		var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return this.content.replace(urlRegex, function(url) {
			return "<a href='"+url+"'>"+url+"</a>";
		}, 'g');
	};
	document.body.innerHTML = Mustache.render(inputData['template'], inputData['view']);
	
	self.port.emit('setHeight', document.body.offsetHeight);
});

$('body').on('click', 'a', function(event) {
	self.port.emit('click', $(this).attr('href'));
	event.preventDefault();
});