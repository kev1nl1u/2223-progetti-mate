function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function openCredits() {
    document.documentElement.style.overflowY = "hidden";
    $("#blackWall").css("display", "flex");
    sleep(100).then(() => {
        $("#blackWall").css("opacity", "100%");
        sleep(300).then(() => {
            $("#creditsWindow").css("transform", "translate(-50%, -50%)");
        });
    });
}

function closeCredits() {
    document.documentElement.style.overflowY = "auto";
    $('#blackWall').on('click', function (event) {
        if (event.target === this) {
            $("#creditsWindow").css("transform", "translate(100%, -50%)");
            sleep(300).then(() => {
                $("#blackWall").css("opacity", "0");
                sleep(300).then(() => {
                    $("#blackWall").css("display", "none");
                });
            });
        }
    });

    $('#creditsWindow').on('mousedown', function (event) {
        event.stopPropagation();
    });
}

$(document).scroll(function() {
    var y = $(this).scrollTop();
    if (y > window.innerHeight/2) {
      $('#returnBtn').css("right", "20px");
    } else {
      $('#returnBtn').css("right", "-200px");
    }
  });

var deg = 0;
$("#spin").css("transition", "all 3s ease-out");
function spin() {
    deg = Math.floor(5000 + Math.random() * 5000);
    $("#spin").css("transform", "rotate(" + deg + "deg)");
    $("#spin").css("transition", "all 3s ease-out");
}