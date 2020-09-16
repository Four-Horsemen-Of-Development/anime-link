console.log("test");
let result;

const url = `https://api.jikan.moe/v3/top/anime/1`;
$.ajax(url).then(({ top }) => {
    console.log(top);
    result = top;
});
let count = 0;
let interval;
$(".generate-anime").on("click", () => {
    console.log(result);
    // make the user not able to click and reset the
    $(".generate-anime").prop("disabled", true);
    $(".anime h2").text("");
    $(".anime button[type=submit]").removeClass("pointer");
    let anime = result[getRandomAnime(result.length)];
    // $("#random-img").attr("src", anime.image_url);
    $("form").attr("action", `/details/${anime.mal_id}`);
    //  refresh the image every 100 ms
    // after 25 times stop
    console.log(anime.image_url);
    interval = setInterval(() => {
        if (count === 25) {
            clearInterval(interval);
            $("#random-img").attr("src", anime.image_url);
            // make the submit able to be clicked to go to the info page
            $(".anime button[type=submit]").prop("disabled", false);
            $(".anime button[type=submit]").addClass("pointer");
            // cant click on gererate ultil finish the round
            $(".generate-anime").prop("disabled", false);
            $(".generate-anime").text("generate again");
            $(".rightRandom h2").text(anime.title);
            $(".rightRandom .episodes").text(`Episodes: ${anime.episodes}`);
            $(".rightRandom .rating").text(`Rank: ${anime.rank}`);

            count = 0;
        } else {
            $("#random-img").attr(
                "src",
                result[getRandomAnime(result.length)].image_url
            );
        }
        count++;
    }, 50);
});

function getRandomAnime(length) {
    return Math.floor(Math.random() * length);
}
