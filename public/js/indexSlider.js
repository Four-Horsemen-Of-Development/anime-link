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
                        label: "members",
                        backgroundColor: "#E58A96",
                        data: topAnimeArr.map((item)=>{return item.members}),
                    }
                ]
            },
            options: {
                legend: { 
                    display: false ,
                    labels:{
                        fontColor : "white"
                    }
                 },
                title: {
                    display: false,
                    text: 'Top 10 Animes'
                },
                scales: {
                    yAxes: [{
                        // gridLines:{
                        //     display: true ,
                        //     color : 'rgb(200,200,200)'
                        // },
        
                        ticks: {
                            fontColor: "white",
                            fontSize: 18,
                            stepSize: 1,
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        gridLines:{
                            display: true ,
                            color : 'rgb(200,200,200)'
                        },

                        ticks: {
                            fontColor: "white",
                            fontSize: 14,
                        }
                    }]
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
