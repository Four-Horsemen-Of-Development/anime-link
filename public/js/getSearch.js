'use strict'

function Anime(anime) {
    this.title = anime.title;
    this.image_url = anime.image_url;
    this.mal_id = anime.mal_id;
}

let templateId = '#anime-template';

Anime.prototype.toHTML = function(){
    let template = $('#anime-template').html();
    let html = Mustache.render(template,this);
    $('#searchResults').append(html);
}



$('#searchForm').submit(getResults)

function getResults(e){
    e.preventDefault();
    $('#searchResults').html('');
    let searchQuery = $('#searchQuery').val();
    let genre = $('#genre option:selected').val();
    let rated =$('#rated option:selected').val();
    let status = $('#status option:selected').val();
    let url = `https://api.jikan.moe/v3/search/anime?q=${searchQuery}${genre}${rated}${status}&limit=30`
    $.ajax(url).then((list) => {
        if(list.results.length == 0) {
            $('#searchResults').append('<p> No results found </p>');
        }
        (list.results).forEach(animeObject => {
            console.log(animeObject);
            var newAnime = new Anime(animeObject);
            newAnime.toHTML()
        });
    });   
}


// $('#searched-anime').on('click', () => {
//     let form = $("#searched-form").attr("action", `/details/${anime.mal_id}`);
// })