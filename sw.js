const CACHE='my-world-v3-9';
const SIDDUR_CACHE='my-world-siddur-pages-v1';
const SIDDUR_PATH='/assets/siddur/siddur.pdf';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./app-icon-1024.png','./logo-master.png','./cosmos-wallpaper.jpg','./assets/siddur/cover.png',...Array.from({length:18},(_,i)=>`./assets/siddur/pages/page-${String(i+1).padStart(2,'0')}.jpg`),'./assets/audio/deep-space.mp3','./assets/audio/interstellar.mp3','./assets/audio/cyber-galaxy.mp3'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==SIDDUR_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function cachedRangeResponse(response,range){
  const bytes=await response.arrayBuffer();const size=bytes.byteLength;const match=/bytes=(\d*)-(\d*)/.exec(range);
  if(!match)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));let end=match[2]?Number(match[2]):size-1;
  if(start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  end=Math.min(end,size-1);return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'application/pdf','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin===self.location.origin&&url.pathname.endsWith(SIDDUR_PATH)){
    e.respondWith((async()=>{const cache=await caches.open(SIDDUR_CACHE);const cached=await cache.match(url.pathname);if(cached){const range=e.request.headers.get('range');return range?cachedRangeResponse(cached,range):cached;}const response=await fetch(e.request);if(response.ok&&response.status===200)await cache.put(url.pathname,response.clone());return response;})());return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('./index.html'))));
});
