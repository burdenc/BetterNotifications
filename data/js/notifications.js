var view = {};
var template;
var notifications;
var pageIndex;

self.port.on('onOpen', function(inputData) {
	pageIndex = 0;
	//template = Mustache.parse(inputData['template']);
	view['link2Text'] = function() {
		var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return this.content.replace(urlRegex, function(url) {
			return "<a href='"+url+"'>"+url+"</a>";
		}, 'g');
	};
	view['haveNotifications'] = function() {
		if(this.notifications.length == 0) return;
		return this;
	};
	view['showPrev'] = function() {
		if(pageIndex != 0) return this;
		return;
	};
	view['showNext'] = function() {
		if((pageIndex + 1) * 5 < notifications.length) return this;
		return;
	};
	template = inputData['template'];
	notifications = inputData['notifications'];
	
	reDraw();
});

$('body').on('click', 'a', function(event) {
	self.port.emit('click', $(this).attr('href'));
	event.preventDefault();
});

$('body').on('click', '#clear', function(event) {
	self.port.emit('clearNotifications');
	pageIndex = 0;
	notifications = [];
	reDraw();
});

$('body').on('click', '#next', function(event) {
	pageIndex = ((pageIndex+1) * 5 >= notifications.length) ? pageIndex : pageIndex+1;
	reDraw();
});

$('body').on('click', '#prev', function(event) {
	pageIndex = (pageIndex == 0) ? 0 : pageIndex-1;
	reDraw();	
});

function reDraw() {
	view['notifications'] = notifications.slice(0 + 5*pageIndex, 5*(pageIndex+1));
	document.body.innerHTML = Mustache.render(template, view);
	self.port.emit('setHeight', document.body.offsetHeight);
}
