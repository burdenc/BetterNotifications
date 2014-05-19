// SDK Libraries
var { Cc, Ci } = require('chrome');
var system = require("sdk/system");
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var tabs = require('sdk/tabs');
var panels = require("sdk/panel");
var ss = require("sdk/simple-storage").storage;
var simplePrefs = require("sdk/simple-prefs");
var { NotificationObserver } = require('notifications');
var notifObserver = new NotificationObserver(onNewNotification);
var ToggleButton;
var Widget;

// UI variables
var oldUI = false;
var button;
var panel;

exports.startup = function(data, reason) {
	console.log('Starting Better Notifications');
	
	main();
}
 
exports.main = function(options) {
	if(options.staticArgs.debug == true) {
		var notifications = require("sdk/notifications");
		for(i = 0; i < 15; i++)
		notifications.notify({
		  title: "Jabberwocky",
		  text: "'Twas brillig, and the slithy toves",
		  data: "did gyre and gimble in the wabe",
		  onClick: function() {
		    console.log("Test");
		  }
		});
	}
	
	simplePrefs.on("enableNotifCenter", function () {
		if(simplePrefs.prefs.enableNotifCenter) {
			setupUI();
			notifObserver.register()
		}
		else {
			destroyUI();
			ss.notfications = [];
			notifObserver.unregister();
		}
	});

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
			this.port.emit('onOpen', {'template':template, 'notifications':ss.notifications});
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

function destroyUI() {
	button.destroy();
	panel.destroy();
}

function onNewNotification(data) {	
	// From chrome://global/content/alerts/alert.js
	data = JSON.parse(data);
	var image = data['image']
	var title = data['title'];
	var content = data['text'];
	
	
	var time = new Date();
	time = time.toLocaleTimeString();
	
	ss.notifications.splice(0, 0, {'title':title, 'content':content, 'img':image, 'time':time});
	
	if(oldUI)
		button.contentURL = self.data.url('icon-32-alert.png');
	else
		button.icon = self.data.url('icon-32-alert.png');
}