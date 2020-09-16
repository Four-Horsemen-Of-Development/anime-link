$(".reminder").on("click", () => {
    console.log("hi");
    $(".reminder").hide();
    $(".noti-list").slideDown();
});
$(".reminder").on("click", () => {
    console.log("hi");
    $(".reminder").hide();
    $(".noti-list").slideDown();
});
$(".cancel").on("click", () => {
    console.log("hi");
    $(".noti-list").hide();
    $(".reminder").slideDown();
});