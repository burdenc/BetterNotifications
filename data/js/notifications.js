var view = {};
var template;
var notifications;
var perPage;
var pageIndex;

self.port.on('onOpen', function(inputData) {
	pageIndex = 0;
	template = inputData['template'];
	notifications = inputData['notifications'];
	perPage = inputData['perPage'];
	if(perPage == 0) perPage = notifications.length;
	
	view['link2Text'] = function() {
		var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return this.content.replace(urlRegex, function(url) {
			return "<a href='"+url+"'>"+url+"</a>";
		}, 'g');
	};
	view['pages'] = function() {
			if(notifications.length <= perPage) return;
			return '<div class="small-text pages">Page '+(pageIndex+1)+'/'+(Math.ceil(notifications.length/perPage))+'</div>';
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
		if((pageIndex + 1) * perPage < notifications.length) return this;
		return;
	};
	
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
	pageIndex = ((pageIndex+1) * perPage >= notifications.length) ? pageIndex : pageIndex+1;
	reDraw();
});

$('body').on('click', '#prev', function(event) {
	pageIndex = (pageIndex == 0) ? 0 : pageIndex-1;
	reDraw();	
});

function reDraw() {
	view['notifications'] = notifications.slice(0 + perPage*pageIndex, perPage*(pageIndex+1));
	document.body.innerHTML = Mustache.render(template, view);
	self.port.emit('setHeight', document.body.offsetHeight);
}
