// SDK Libraries
var notifications = require('sdk/notifications');
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var tabs = require('sdk/tabs');
var panels = require("sdk/panel");
var prefsService = require("sdk/preferences/service");
const { observer: windowObserver } = require("sdk/windows/observer");
var ToggleButton;
var Widget;

// UI variables
var oldUI = false;
var button;
var panel;

// Misc variables
var savedNotifications = {};


exports.startup = function(data, reason) {
	console.log('Starting Better Notifications');
	
	main();
}
 
exports.main = function() {
	if(!prefsService.has('alerts.alertDisplayTime'))
		prefsService.set('alerts.alertDisplayTime', 4000);

	// ToggleButton is Firefox 29+ only
	try {
		ToggleButton = require('sdk/ui/button/toggle').ToggleButton;
	}
	catch(exception) {
		console.log('Better Notifications: Australis UI not available, defaulting to widgets.');
		oldUI = true;
		Widget = require('sdk/widget').Widget;
	}
	
	setupUI();
	
	savedNotifications['notifications'] = [];
	
	windowObserver.on("open", onNewWindow);
}

function setupUI() {
	panel = panels.Panel
	({
		contentURL: self.data.url("notifications.html"),
		contentScriptFile: [self.data.url('js/mustache.js'), self.data.url('js/notifications.js')],
		width: 400,
		onShow: function() {
			var template = self.data.load('notifications.mst');
			this.port.emit('onOpen', {'template':template, 'view':{'notifications':savedNotifications['notifications'].slice(0,5)}, 'bootstrap':self.data.load('css/bootstrap.min.css')});
		},
		onHide: function() {
			if(!oldUI)
				button.state('window', {checked: false});
		}
	});
	
	panel.port.on('setHeight', function(height) {
		panel.height = height+20;
	});

	if(!oldUI) {
		button = ToggleButton
		({
			id: "betterNotifWidget",
			label: "Better Notif Widget",
			icon: {
				'16' : self.data.url('icon-32.png')
			},
			onChange: function(state) {
				if(state.checked) {
					panel.show({position: button});
				}
			}
		});
	}
	else {
		button = Widget
		({
			id: 'betterNotifWidget',
			label: 'Better Notifications',
			panel: panel,
			contentURL: self.data.url('icon-32.png')
		});
	}	
}

function onNewWindow(chromeWindow) {
	if(chromeWindow.document.URL != "chrome://global/content/alerts/alert.xul")
		return;
	
	//Prevent normal
	chromeWindow.onclick = function(event) {
		if(event.button == 0 && event.shiftKey == false) {
			chromeWindow.onAlertClick();
		}

		if(event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
			event.stopPropogation();
		}

		chromeWindow.close();
	};
	
	
	// From chrome://global/content/alerts/alert.js
	// arguments[0] --> the image src url
	// arguments[1] --> the alert title
	// arguments[2] --> the alert text
	var image = chromeWindow.arguments[0];
	//Image applied via CSS (most likely stored in chrome)
	if(!image) {
		var imageElem = chromeWindow.document.getElementById('alertImage');
		var style = chromeWindow.getComputedStyle(imageElem);
		image = style.listStyleImage || style.backgroundImage;
		image = image.slice(5, -2);
	}
	var title = chromeWindow.arguments[1];
	var content = chromeWindow.arguments[2];
	
	
	var time = new Date();
	time = time.toLocaleTimeString();
	
	savedNotifications['notifications'].splice(0, 0, {'title':title, 'content':content, 'img':image, 'time':time});
}