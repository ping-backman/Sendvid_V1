// homepage.js
import { fetchVideos } from "/api.js";
import { createVideoCard } from "/cards.js";
import { initBackToTop } from "/ui-backtotop.js";

const PAGE_SIZE = 20;

let offset = 0;
let activeSort = "discover";
let currentQuery = "";
let loading = false;

const watched = new Set(JSON.parse(localStorage.getItem("watched") || "[]"));

const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("loadMore");
const emptyState = document.getElementById("emptyState");
const resultsHintDesktop = document.getElementById("resultsHintDesktop");
const resultsHintMobile = document.getElementById("resultsHintMobile");

async function fetchBatch(limit){
  const data = await fetchVideos({
    limit,
    offset,
    sort: activeSort,
    q: currentQuery
  });

  if (!data.videos || data.videos.length < limit || data.nextOffset === -1)
    offset = null;
  else
    offset = data.nextOffset;

  return data.videos ?? [];
}

async function load(reset=false){
  if (loading) return;
  loading=true;

  if (reset){
    gallery.innerHTML="";
    offset=0;
  }

  loader.style.display="block";
  loadMoreBtn.style.display="none";

  const batch = await fetchBatch(PAGE_SIZE);

  const fragment=document.createDocumentFragment();
  batch.forEach(v=>fragment.appendChild(createVideoCard(v,{watched})));
  gallery.appendChild(fragment);

  const count = gallery.children.length;
  if(resultsHintDesktop) resultsHintDesktop.textContent=`Showing ${count} videos`;
  if(resultsHintMobile) resultsHintMobile.textContent=`Showing ${count}`;

  loader.style.display="none";
  loading=false;

  loadMoreBtn.style.display = offset!==null?"block":"none";
}

document.querySelectorAll(".filter-btn").forEach(btn=>{
  btn.onclick=()=>{
    activeSort=btn.dataset.sort;
    load(true);
  };
});

load(true);
loadMoreBtn.onclick=()=>load();
initBackToTop("backToTop");
