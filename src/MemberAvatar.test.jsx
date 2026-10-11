import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,waitFor,cleanup,act} from '@testing-library/react';
import MemberAvatar from './MemberAvatar';
const api=vi.hoisted(()=>({lookup:vi.fn(),viewer:'viewer'}));
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:api.viewer}}})}));
vi.mock('./memberChamberDecorData',()=>({getPaintedMemberFrame:api.lookup}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('shares one lookup for repeated member portraits',async()=>{
 api.lookup.mockResolvedValue({chamber_frame:'silver-ripple'});
 const {container}=render(<><MemberAvatar profile={{id:'one',avatar_url:'/portrait.png'}}/><MemberAvatar profile={{id:'one'}}/></>);
 await waitFor(()=>expect(container.querySelectorAll('.member-avatar-framed')).toHaveLength(2));
 expect(api.lookup).toHaveBeenCalledTimes(1);
 expect(container.querySelector('.member-avatar-photo img').getAttribute('src')).toBe('/portrait.png');
 expect(container.querySelector('.painted-chamber-frame').parentElement.classList.contains('member-avatar')).toBe(true);
});
it('removes the frame from every mounted portrait',async()=>{
 api.lookup.mockResolvedValue({chamber_frame:'bamboo-ink'});
 const {container}=render(<><MemberAvatar profile={{id:'two'}}/><MemberAvatar profile={{id:'two'}}/></>);
 await waitFor(()=>expect(container.querySelectorAll('.member-avatar-framed')).toHaveLength(2));
 act(()=>window.dispatchEvent(new CustomEvent('palace:frame-changed',{detail:{user_id:'two',chamber_frame:''}})));
 expect(container.querySelectorAll('.painted-chamber-frame')).toHaveLength(0);
});
it('does not transfer a previous member frame to another member',async()=>{
 api.lookup.mockResolvedValueOnce({chamber_frame:'bamboo-ink'}).mockResolvedValueOnce({chamber_frame:null});
 const {container,rerender}=render(<MemberAvatar profile={{id:'three'}}/>);
 await waitFor(()=>expect(container.querySelector('.member-avatar-framed')).not.toBeNull());
 rerender(<MemberAvatar profile={{id:'four'}}/>);
 expect(container.querySelector('.member-avatar-framed')).toBeNull();
 await waitFor(()=>expect(api.lookup).toHaveBeenCalledWith('four'));
});
it('keeps portraits visible when frame lookup fails',async()=>{
 api.lookup.mockRejectedValue(new Error('offline'));
 const {container}=render(<MemberAvatar profile={{id:'offline',avatar_url:'/still-visible.png'}}/>);
 await waitFor(()=>expect(api.lookup).toHaveBeenCalled());
 expect(container.querySelector('img').getAttribute('src')).toBe('/still-visible.png');
 expect(container.querySelector('.painted-chamber-frame')).toBeNull();
});
