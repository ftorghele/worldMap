$(function() {
    $( "#slider" ).slider({
        orientation: "horizontal",
        range: "min",
        min: 2010,
        max: 2050,
		step: 10,
        value: 2030,
        slide: function (event, ui) {
            var currentYear = "current year: " + ui.value;
            $("#current-year").html(currentYear);
        }
    });
    $("#current-year").html("current year: 2030");
});