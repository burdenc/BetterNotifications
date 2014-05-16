// SDK Libraries
var { Cc, Ci } = require('chrome');
var system = require("sdk/system");
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var tabs = require('sdk/tabs');
var panels = require("sdk/panel");
var ss = require("sdk/simple-storage").storage;
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
	if(!ss.notifications)
		ss.notifications = [];
	
	// ToggleButton with Panel is Firefox 30+ only
	const versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
	if(versionChecker.compare(system.version, "30") >= 0) {
		ToggleButton = require('sdk/ui/button/toggle').ToggleButton;
	}
	else {
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
		contentScriptFile: [self.data.url('js/jquery.js'), self.data.url('js/mustache.js'), self.data.url('js/notifications.js')],
		width: 400,
		height: 1,
		onShow: function() {
			var template = self.data.load('notifications.mst');
			this.port.emit('onOpen', {'template':template, 'view':{'notifications':ss.notifications.slice(0,5)}});
			if(oldUI)
				button.contentURL = self.data.url('icon-32.png');
			else
				button.icon = self.data.url('icon-32.png');
		},
		onHide: function() {
			if(!oldUI)
				button.state('window', {checked: false});
		}
	});
	
	panel.port.on('setHeight', function(height) {
		panel.height = height;
	});
	
	panel.port.on('click', function(link) {
		tabs.open(link);
	});
	
	panel.port.on('clearNotifications', function() {
		ss.notifications = [];
	});

	if(!oldUI) {
		button = ToggleButton
		({
			id: 'betterNotifWidget',
			label: 'Notification Center',
			icon: self.data.url('icon-32.png'),
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
			label: 'Notification Center',
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
	
	ss.notifications.splice(0, 0, {'title':title, 'content':content, 'img':image, 'time':time});
	
	if(oldUI)
		button.contentURL = self.data.url('icon-32-alert.png');
	else
		button.icon = self.data.url('icon-32-alert.png');
}