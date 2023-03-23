var windowWidth = window.innerWidth;
var scrollArea = window.innerHeight;
var plane = document.getElementsByClassName('main-title-img')[0];

var left = plane.offsetLeft;
window.addEventListener('scroll', function() {
	var scrollTop = window.pageYOffset || window.scrollTop;
	var scrollPercent = scrollTop/scrollArea || 0;
	
	plane.style.left = left + scrollPercent*window.innerWidth + 'px';

	if(plane.offsetRight >= vw2px(100)){
		plane.style.display = "none";
	}
});


function vw2px(vw){
	return vw * window.innerWidth / 100;
}