// video.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { loadPlayer } from "/player.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE=20;
const UP_NEXT_COUNT=4;

const params=new URLSearchParams(location.search);
const videoId=params.get("id")||window.location.pathname.split('/').pop();

let offset=0;
let loading=false;
let activeSort="discover";

const watched=new Set(JSON.parse(localStorage.getItem("watched")||"[]"));

const grid=document.getElementById("discoverGrid");
const upNextGrid=document.getElementById("upNextGrid");
const loader=document.getElementById("loader");
const loadMoreBtn=document.getElementById("loadMore");
const resultsHintDesktop=document.getElementById("resultsHintDesktop");

async function loadVideo(){
  if(!videoId) return;

  const data=await fetchVideos({id:videoId});
  if(!data?.video) return;

  const v=data.video;
  document.getElementById("videoTitle").textContent=v.title;
  document.getElementById("videoMeta").textContent=`${v.duration} • ${v.views} views`;
  loadPlayer(v,document.getElementById("playerWrapper"),watched);
}

async function fetchBatch(limit){
  const data=await fetchVideos({
    limit,
    offset,
    sort:activeSort
  });

  if(!data.videos||data.videos.length<limit||data.nextOffset===-1)
    offset=null;
  else
    offset=data.nextOffset;

  return data.videos??[];
}

async function load(reset=false){
  if(loading) return;
  loading=true;

  if(reset){
    grid.innerHTML="";
    upNextGrid.innerHTML="";
    offset=0;
  }

  loader.style.display="block";
  loadMoreBtn.style.display="none";

  const batch=await fetchBatch(PAGE_SIZE);

  if(reset){
    batch.slice(0,UP_NEXT_COUNT).forEach(v=>
      upNextGrid.appendChild(createVideoCard(v,{compact:true,watched}))
    );
  }

  const fragment=document.createDocumentFragment();
  batch.forEach(v=>fragment.appendChild(createVideoCard(v,{watched})));
  grid.appendChild(fragment);

  if(resultsHintDesktop)
    resultsHintDesktop.textContent=`Showing ${grid.children.length} suggested`;

  loader.style.display="none";
  loading=false;

  loadMoreBtn.style.display=offset!==null?"block":"none";
}

loadVideo();
load(true);
loadMoreBtn.onclick=()=>load();
initBackToTop("backToTop");
