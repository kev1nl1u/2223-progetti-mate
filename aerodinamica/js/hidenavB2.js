// vw to px
function vw2px(vw){
	return vw * window.innerWidth / 100;
}

var plane = document.getElementsByClassName('main-title-img')[0];
var hidden = false;
window.addEventListener("scroll", function(){
	if(plane.offsetLeft >= vw2px(70)){
		$(".nav-link").fadeOut(50);
		hidden = true;
	}else if(hidden){
		$(".nav-link").fadeIn(50);
		hidden = false;
	}
});