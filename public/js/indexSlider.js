'use strict';

let topAnimeArr=[];

$('#seasonal').slick({

    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 6000,    
    dots: true,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 4,
    responsive: [
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 3,
                infinite: true,
                dots: true
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ]
});
getTopAnime();
function getTopAnime(){
    let url2 ='https://api.jikan.moe/v3/top/anime';
    $.ajax(url2).then((result)=>{
        for (let i = 0; i < 10; i++) {

            topAnimeArr.push({title: result.top[i].title,
                members: result.top[i].members,
                id: result.top[i].mal_id
            })
        }
    topAnimeArr.sort(sortByMembers);
    }).then(()=>{
        new Chart($('#topAnimesChart'), {
            type: 'horizontalBar',
            data: {
                labels: topAnimeArr.map((item)=>{return item.title}),
        
                datasets: [
                    {
                        label: "Population (millions)",
                        backgroundColor: "#2c2048",
                        data: topAnimeArr.map((item)=>{return item.members})
                    }
                ]
            },
            options: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Top 10 Animes'
                }
            }
        })
        
    })


}

function sortByMembers(a,b){
    if (a.members > b.members) {
        return -1;
      }
      if (a.members < b.members) {
        return 1;
      }
      if(a.members == b.members){
        return 0;

      }
}
