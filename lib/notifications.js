var { Cc, Ci } = require('chrome');
const observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

function NotificationObserver(callback) {
	this._callback = callback;
	this.register();
}
NotificationObserver.prototype = {
	observe: function(subject, topic, data) {
		this._callback(data);
	},
	register: function() {
		observerService.addObserver(this, "notification-creation", false);
	},
	unregister: function() {
		observerService.removeObserver(this, "notification-creation");
	}
}

exports.NotificationObserver = NotificationObserver;