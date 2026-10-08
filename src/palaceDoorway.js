import {safePalaceReturnPath} from './palaceReturnPath';

/**
 * An invitation into a members-only room should survive sign-in.
 * The existing auth gate reads ?next= and validates it again before redirecting.
 */
export function palaceSignInDoor(destination){
 const safe=safePalaceReturnPath(destination,null);
 return safe?'/login?next='+encodeURIComponent(safe):'/login';
}

/** Honest, gentle context for people arriving at the Palace gates. */
export function palaceDoorDestinationMessage(candidate){
 const path=safePalaceReturnPath(candidate,null);
 if(!path)return '';
 const root=path.split(/[?#]/,1)[0];
 if(root==='/writing'||root.startsWith('/writing/'))
  return 'Your Writing Chamber will be here after you sign in. Private drafts stay private until you choose otherwise.';
 if(root==='/library')
  return 'Your Library is just beyond the gates. Return to saved stories and the places you left off.';
 if(root==='/palace-life'||root.startsWith('/club/'))
  return 'Palace Life awaits: find conversations, clubs and fellow readers after you sign in.';
 if(root==='/grand-palaces')
  return 'Your Grand Palace is ready to explore once you enter.';
 if(root==='/treasury')
  return 'Your Royal Treasury is waiting beyond the gates.';
 if(root==='/chamber'||root.startsWith('/member/'))
  return 'Your personal chamber is waiting. Continue into the Palace to make yourself at home.';
 return '';
}
