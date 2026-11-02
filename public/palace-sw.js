/* Public navigation fallback only. Never cache API responses, member pages,
   manuscripts, auth data or user-generated content. */
const PALACE_OFFLINE_CACHE='starry-palace-offline-v1';
const PALACE_OFFLINE_PAGE='/offline.html';
const PALACE_PUBLIC_ASSETS=[PALACE_OFFLINE_PAGE,'/palace-status.css','/favicon.svg'];

self.addEventListener('install',event=>{
  // Leave activation to the browser; never force an open writing session to reload.
  event.waitUntil(caches.open(PALACE_OFFLINE_CACHE).then(cache=>cache.addAll(PALACE_PUBLIC_ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(names=>Promise.all(names
      .filter(name=>name.startsWith('starry-palace-offline-')&&name!==PALACE_OFFLINE_CACHE)
      .map(name=>caches.delete(name))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  // Never intercept API writes, private data, or unrelated asset requests.
  if(request.method!=='GET')return;
  const destination=new URL(request.url);
  if(destination.origin!==self.location.origin)return;
  // These two pre-cached public assets must stay available while offline;
  // the status page needs its styling even without the browser HTTP cache.
  if(request.mode!=='navigate'){
    if(destination.pathname==='/palace-status.css'||destination.pathname==='/favicon.svg'){
      event.respondWith(caches.match(destination.pathname).then(cached=>cached||fetch(request)));
    }
    return;
  }
  event.respondWith((async()=>{
    try{
      // Network first: do not serve cached, possibly stale personalized pages.
      return await fetch(request);
    }catch{
      // A real network failure, not HTTP 404/500, leads to the public offline page.
      const page=await caches.match(PALACE_OFFLINE_PAGE);
      return page||Response.error();
    }
  })());
});
