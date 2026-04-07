// bridge.js //
import { fetchVideos } from "/api.js";

const statusTextEl =
document.getElementById("statusText");

const countdownEl =
document.getElementById("countdown");

const videoId = window.VIDEO_ID;

async function init(){

try{

const data = await fetchVideos({ id: videoId });

if(!data?.videos || data.videos.length===0){

statusTextEl.textContent =
"Video unavailable.";

return;

}

startCountdown(videoId);

}catch(err){

console.error(err);

statusTextEl.textContent =
"Error loading video.";

}

}

function startCountdown(id){

let remaining = 5;

countdownEl.textContent = remaining;

const timer = setInterval(()=>{

remaining--;

countdownEl.textContent = remaining;

if(remaining<=0){

clearInterval(timer);

/*****************
 TOKEN GENERATION
*****************/

const token = Date.now();

window.location.href =
`/v/${id}?t=${token}`;

}

},1000);

}

init();
