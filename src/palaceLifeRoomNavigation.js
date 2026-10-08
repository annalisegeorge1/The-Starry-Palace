/**
 * Palace Life has six distinct member rooms. Keep URL navigation and rendered
 * room state in sync rather than mutating window.history behind React Router.
 */
export const PALACE_LIFE_ROOMS=['commons','clubs','forum','moonlight','stars','highlights'];

export function palaceLifeRoom(value){
 return PALACE_LIFE_ROOMS.includes(value)?value:'commons';
}

export function palaceLifeRoomFromSearch(search=''){
 try{return palaceLifeRoom(new URLSearchParams(search).get('room'))}
 catch{return 'commons'}
}

export function palaceLifeRoomUrl(value){
 return '/palace-life?room='+encodeURIComponent(palaceLifeRoom(value));
}
