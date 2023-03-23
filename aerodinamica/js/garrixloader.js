function onReady(callback) {
	var intervalID = window.setInterval(checkReady, 1000);

	function checkReady() {
		if (document.getElementsByTagName('body')[0] !== undefined) {
			window.clearInterval(intervalID);
			callback.call(this);
		}
	}
}

onReady(function () {
	$("#loading").fadeOut(500);
	$("body").css("overflow-y", "scroll")
});