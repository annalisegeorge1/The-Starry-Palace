import React from 'react';

export const DEFAULT_STORY_COVER='/assets/default-story-cover.svg';

export function storyCoverSource(source){
 return typeof source==='string'&&source.trim()?source.trim():DEFAULT_STORY_COVER;
}

/**
 * Decorative cover inside a card that already displays the work title.
 * The simple Palace book art appears only when the author has no cover,
 * or when the author's URL fails. This never changes stored cover_url.
 */
export default function StoryCoverImage({src,alt='',loading='lazy',decoding='async',...props}){
 const source=storyCoverSource(src);
 function handleError(event){
  const image=event.currentTarget;
  if(image.getAttribute('src')!==DEFAULT_STORY_COVER){
   image.setAttribute('src',DEFAULT_STORY_COVER);
  }
 }
 return <img {...props} src={source} alt={alt} loading={loading} decoding={decoding} onError={handleError}/>;
}
