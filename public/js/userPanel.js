"use strict";
// initial state
$("#faveSec").show();
$("#watchingSec").hide();
$("#watchedSec").hide();
$("#followingSec").hide();

$(document).ready(() => {
    $(".tabs").on("click", function () {
        $(".tabs").removeClass("active");
        console.log($(this));
        $(this).addClass("active");
    });
    $("#fave").on("click", () => {
        $("#faveSec").show();
        $("#watchingSec").hide();
        $("#watchedSec").hide();
        $("#followingSec").hide();
    });
    $("#watching").on("click", () => {
        $("#faveSec").hide();
        $("#watchingSec").show();
        $("#watchedSec").hide();
        $("#followingSec").hide();
    });
    $("#watched").on("click", () => {
        $("#faveSec").hide();
        $("#watchingSec").hide();
        $("#watchedSec").show();
        $("#followingSec").hide();
    });
    $("#following").on("click", () => {
        $("#faveSec").hide();
        $("#watchingSec").hide();
        $("#watchedSec").hide();
        $("#followingSec").show();
    });
});
