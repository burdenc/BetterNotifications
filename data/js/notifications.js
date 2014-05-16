var view;
var template;
var count = 0;

self.port.on('onOpen', function(inputData) {
	//template = Mustache.parse(inputData['template']);
	document.getElementsByTagName("style")[0].innerHTML += inputData['style'];
	console.log(inputData['style']);
	console.log(document.getElementsByTagName("style")[0].innerHTML);
	inputData['view']['link2Text'] = function() {
		var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return this.content.replace(urlRegex, function(url) {
			return "<a href='"+url+"'>"+url+"</a>";
		}, 'g');
	};
	inputData['view']['clearButton'] = function() {
		if(this.notifications.length == 0) return;
		return this;
	};
	inputData['view']['hrCheck'] = function() {
		count++;
		if(count == view.notifications.length) return;
		return this;
	};
	view = inputData['view'];
	template = inputData['template'];
	
	document.body.innerHTML = Mustache.render(inputData['template'], inputData['view']);
	
	self.port.emit('setHeight', document.body.offsetHeight);
});

$('body').on('click', 'a', function(event) {
	self.port.emit('click', $(this).attr('href'));
	event.preventDefault();
});

$('body').on('click', '.clearButton', function(event) {
	self.port.emit('clearNotifications');
	view['notifications'] = [];
	document.body.innerHTML = Mustache.render(template, view);
	self.port.emit('setHeight', document.body.offsetHeight);
});