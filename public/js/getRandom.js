console.log("test");
let result;

const url = `https://api.jikan.moe/v3/top/anime/1`;
$.ajax(url).then(({ top }) => {
    console.log(top);
    result = top;
});

console.log(result);

$(".generate-anime").on("click", () => {
    console.log(result);
    let anime = result[getRandomAnime(result.length)];
    console.log(anime.image_url);
    let animeImg = $("#random-img").attr("src", anime.image_url);
    let form = $("form").attr("action", `/details/${anime.mal_id}`);
    console.log(animeImg);
    console.log(anime);
});

function getRandomAnime(length) {
    return Math.floor(Math.random() * length);
}
