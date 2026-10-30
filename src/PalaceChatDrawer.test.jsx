import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceChatDrawer from './PalaceChatDrawer';
import {watchPalaceChatRoom} from './palaceChatRealtime';
import {getLetters,getDirectConversationMessages,sendLetter,searchMembers,editLetterMessage,setConversationPreference,getMemberBoundary,setMemberBoundary,reportConversation} from './palaceData';
import {getPalaceGroupChatOverview,getPalaceGroupMessages,createPalaceGroupChat,respondPalaceGroupInvite,sendPalaceGroupMessage,editPalaceGroupMessage,setPalaceGroupIdentity,pinPalaceGroupMessage,searchShareablePalaceStories} from './palaceGroupChatData';

vi.mock('./palaceChatRealtime',()=>({watchPalaceChatRoom:vi.fn(()=>()=>{})}));
vi.mock('./palaceData',()=>({
 getLetters:vi.fn(),getDirectConversationMessages:vi.fn(),DIRECT_HISTORY_PAGE_SIZE:60,sendLetter:vi.fn(),sendLetterPhoto:vi.fn(),editLetterMessage:vi.fn(),searchMembers:vi.fn(),setConversationPreference:vi.fn().mockResolvedValue(undefined),getMemberBoundary:vi.fn(),setMemberBoundary:vi.fn(),reportConversation:vi.fn()
}));
vi.mock('./palaceGroupChatData',()=>({
 getPalaceGroupChatOverview:vi.fn(),getPalaceGroupMessages:vi.fn(),createPalaceGroupChat:vi.fn(),
 sendPalaceGroupMessage:vi.fn(),sendPalaceGroupPhoto:vi.fn(),editPalaceGroupMessage:vi.fn(),respondPalaceGroupInvite:vi.fn(),
 invitePalaceGroupMember:vi.fn(),removePalaceGroupMember:vi.fn(),leavePalaceGroupChat:vi.fn(),
 renamePalaceGroupChat:vi.fn(),setPalaceGroupMuted:vi.fn(),markPalaceGroupRead:vi.fn().mockResolvedValue(undefined),
 PALACE_GROUP_COLOURS:[{key:'moonlit',label:'Moonlit violet'},{key:'glacier',label:'Glacier blue'}],
 setPalaceGroupIdentity:vi.fn(),pinPalaceGroupMessage:vi.fn(),getPinnedPalaceGroupMessage:vi.fn(),searchShareablePalaceStories:vi.fn()
}));
const user='member-one';
const direct={conversations:[{conversation_id:'direct-one',conversations:{kind:'direct'},correspondent:{id:'member-two',display_name:'River'},preference:{archived:false,muted:false},unread:false}],messages:[],requests:[]};
const groups={groups:[{id:'group-one',title:'Moonlight Readers',description:'For gentle stories',colorKey:'glacier',pinnedMessageId:null,ownerId:user,members:[{id:user,display_name:'Host'},{id:'member-two',display_name:'River'}],muted:false,lastReadAt:null,lastMessageAt:null}],invitations:[{id:'group-invite',title:'Poetry Circle'}]};
function mount(){return render(<MemoryRouter><PalaceChatDrawer userId={user}/></MemoryRouter>)}
beforeEach(()=>{
 vi.clearAllMocks();
 getLetters.mockResolvedValue(direct);
 getDirectConversationMessages.mockResolvedValue([]);
 getMemberBoundary.mockResolvedValue({muted:false,blocked:false});
 setMemberBoundary.mockResolvedValue({muted:false,blocked:true});
 reportConversation.mockResolvedValue({id:'report-test'});
 getPalaceGroupChatOverview.mockResolvedValue(groups);
 getPalaceGroupMessages.mockResolvedValue([{id:'m1',chat_id:'group-one',sender_id:'member-two',body:'Welcome to the circle',created_at:'2026-10-08T13:00:00Z',profiles:{display_name:'River'}}]);
 searchMembers.mockResolvedValue([{id:'member-three',username:'nightwind',display_name:'Night Wind'}]);
 createPalaceGroupChat.mockResolvedValue('group-created');
 respondPalaceGroupInvite.mockResolvedValue(undefined);
 sendPalaceGroupMessage.mockResolvedValue({id:'m2'});
 setPalaceGroupIdentity.mockResolvedValue(undefined);pinPalaceGroupMessage.mockResolvedValue(undefined);
 searchShareablePalaceStories.mockResolvedValue([{id:'work-1',title:'Blue River',slug:'blue-river'}]);
 watchPalaceChatRoom.mockReturnValue(()=>{});
});
afterEach(cleanup);
describe('Palace quick chat',()=>{

 it('makes full Messenger unmistakable from the quick-chat inbox and a thread',async()=>{
  mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  expect(screen.getByRole('link',{name:'Open the full Palace Messenger page'}).getAttribute('href')).toBe('/chat');
  expect(screen.getByText('Palace Chat')).toBeTruthy();
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  const tools=screen.getByRole('group',{name:'Conversation tools'});
  expect(within(tools).getByRole('link',{name:'Switch to full Palace Messenger'}).getAttribute('href')).toBe('/chat');
  expect(within(tools).getByRole('button',{name:'Search messages in this conversation'})).toBeTruthy();
  expect(within(tools).getByRole('button',{name:'Add conversation to favourites'})).toBeTruthy();
 });
 it('opens the full Messenger directly without showing a second quick launcher',async()=>{
  render(<MemoryRouter><PalaceChatDrawer userId={user} workspace/></MemoryRouter>);
  expect(await screen.findByRole('region',{name:'Palace Chat'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Open Palace chat/})).toBeNull();
  expect(screen.getByRole('link',{name:'Return to Palace home'}).getAttribute('href')).toBe('/');
  expect(screen.getByText('Palace Messenger')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Close Palace chat'})).toBeNull();
 });
 it('opens the full Messenger from quick chat without replacing ongoing conversations',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  const link=await screen.findByRole('link',{name:'Open full Palace Messenger'});
  expect(link.getAttribute('href')).toBe('/chat');
 });
 it('confirms member blocking and disables direct-message sending until unblocked',async()=>{
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Conversation safety tools'}));
  fireEvent.click(screen.getByRole('button',{name:'Block this member'}));
  await waitFor(()=>expect(setMemberBoundary).toHaveBeenCalledWith(user,'member-two',{muted:false,blocked:true}));
  expect(screen.getByText(/You blocked this member/)).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox',{name:'Write a private message'}),{target:{value:'Hello'}});
  expect(screen.getByRole('button',{name:/Send/}).disabled).toBe(true);
  confirm.mockRestore();
 });
 it('reports a private conversation through the existing Council moderation workflow',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Conversation safety tools'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Reason for reporting this conversation'}),{target:{value:'Repeated unwanted contact'}});
  fireEvent.click(screen.getByRole('button',{name:'Submit report'}));
  await waitFor(()=>expect(reportConversation).toHaveBeenCalledWith(user,'direct-one','member-two','Repeated unwanted contact'));
  expect(screen.getByText(/Report submitted to Palace moderators/)).toBeTruthy();
 });
 it('mutes a direct conversation using the existing member preference without removing its messages',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Mute this conversation'}));
  await waitFor(()=>expect(setConversationPreference).toHaveBeenCalledWith(user,'direct-one',expect.objectContaining({muted:true,archived:false})));
  expect(screen.getByRole('button',{name:'Unmute this conversation'})).toBeTruthy();
  expect(screen.getByRole('log',{name:'Conversation messages'})).toBeTruthy();
 });
 it('archives a direct conversation and restores it from the archived inbox',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Archive this conversation'}));
  await waitFor(()=>expect(setConversationPreference).toHaveBeenCalledWith(user,'direct-one',expect.objectContaining({archived:true})));
  expect(screen.queryByRole('button',{name:'River'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/Archived \(1\)/}));
  const restore=screen.getByRole('button',{name:'Restore archived conversation with River'});
  fireEvent.click(restore);
  await waitFor(()=>expect(setConversationPreference).toHaveBeenLastCalledWith(user,'direct-one',expect.objectContaining({archived:false})));
  fireEvent.click(screen.getByRole('button',{name:/Archived/}));
  expect(screen.getByRole('button',{name:'River'})).toBeTruthy();
 });
 it('stars a direct conversation and filters favourites from existing private records',async()=>{
  getLetters.mockResolvedValue({...direct,conversations:[direct.conversations[0]]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Add conversation to favourites'}));
  await waitFor(()=>expect(setConversationPreference).toHaveBeenCalledWith(user,'direct-one',expect.objectContaining({starred:true,archived:false})));
  await screen.findByRole('button',{name:'Remove conversation from favourites'});
  fireEvent.click(screen.getByRole('button',{name:'Back to inbox'}));
  fireEvent.click(screen.getByRole('button',{name:/Favourites/}));
  expect(screen.getByRole('button',{name:'River'})).toBeTruthy();
 });
 it('does not suggest a duplicate send after a successful write when inbox sync fails',async()=>{
  let sent=false;
  sendLetter.mockImplementation(async()=>{sent=true});
  getLetters.mockImplementation(()=>sent?Promise.reject(new Error('offline during refresh')):Promise.resolve(direct));
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Write a private message'}),{target:{value:'Important note'}});
  fireEvent.click(screen.getByRole('button',{name:/Send/}));
  await waitFor(()=>expect(sendLetter).toHaveBeenCalledTimes(1));
  await screen.findByText(/Message sent\. The conversation is syncing/);
  expect(screen.getByRole('textbox',{name:'Write a private message'}).value).toBe('');
 });
 it('searches only locally loaded message text within the opened thread',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{id:'moon-note',conversation_id:'direct-one',sender_id:'member-two',body:'The Moonlit Orchard',created_at:'2026-10-21T12:00:00Z'}]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Search messages in this conversation'}));
  fireEvent.change(screen.getByRole('searchbox',{name:'Find in loaded messages'}),{target:{value:'moonlit'}});
  expect(screen.getByText('1 matching loaded message')).toBeTruthy();
 });


 it('opens shared media for only the currently loaded conversation and returns to message search',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{id:'gallery-note',conversation_id:'direct-one',sender_id:'member-two',body:'A normal private note',created_at:'2026-10-21T12:00:00Z'}]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(screen.getByRole('button',{name:'Show shared media'}));
  expect(screen.getByRole('region',{name:'Shared media in this conversation'})).toBeTruthy();
  expect(screen.getByText(/No shared items in the messages loaded here/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Photos'}));
  expect(screen.getByText(/No photos in the messages loaded here/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Search messages in this conversation'}));
  expect(screen.queryByRole('region',{name:'Shared media in this conversation'})).toBeNull();
  expect(screen.getByRole('searchbox',{name:'Find in loaded messages'})).toBeTruthy();
 });
 it('keeps unread Direct conversations unread until the person opens that thread',async()=>{
  getLetters.mockResolvedValue({
   ...direct,
   conversations:[{...direct.conversations[0],unread:true}],
   messages:[{id:'unread-note',conversation_id:'direct-one',sender_id:'member-two',body:'A note from River',created_at:'2026-10-13T13:15:00Z'}]
  });
  const {container}=mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  const river=await screen.findByRole('button',{name:'River'});
  expect(container.querySelector('.palace-chat-dock.is-thread-open')).toBeNull();
  expect(setConversationPreference).not.toHaveBeenCalled();
  fireEvent.click(river);
  await waitFor(()=>expect(setConversationPreference).toHaveBeenCalledWith(user,'direct-one',expect.objectContaining({last_read_at:expect.any(String)})));
  expect(container.querySelector('.palace-chat-dock.is-thread-open')).toBeTruthy();
 });
 it('has a real expandable feature guide and accessible message menu by Enter',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{
   id:'own-help',conversation_id:'direct-one',sender_id:user,body:'Help example',created_at:'2026-10-13T13:00:00Z'
  }]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  const help=screen.getByLabelText('How Palace Chat works');
  fireEvent.click(help);
  expect(help.closest('details').open).toBe(true);
  expect(screen.getByText('Palace Chat guide')).toBeTruthy();
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  const bubble=(await within(screen.getByRole('log',{name:'Conversation messages'})).findByText('Help example')).closest('.palace-chat-bubble');
  fireEvent.keyDown(bubble,{key:'Enter'});
  expect(screen.getByRole('menu',{name:'Message actions'})).toBeTruthy();
 });
 it('keeps message actions hidden until the bubble is held or context-clicked',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{
   id:'own-1',conversation_id:'direct-one',sender_id:user,body:'My private hello',
   created_at:'2026-10-10T12:00:00.000Z',edited_at:null
  },{
   id:'theirs-1',conversation_id:'direct-one',sender_id:'member-two',body:'Hello back',
   created_at:'2026-10-10T12:01:00.000Z'
  }]});
  mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  await screen.findByText('My private hello');
  expect(screen.queryByRole('button',{name:'Edit your message'})).toBeNull();
  expect(screen.queryByRole('menu',{name:'Message actions'})).toBeNull();
  fireEvent.contextMenu(within(screen.getByRole('log',{name:'Conversation messages'})).getByText('Hello back').closest('.palace-chat-bubble'));
  expect(screen.getByRole('menu',{name:'Message actions'})).toBeTruthy();
  expect(screen.queryByRole('menuitem',{name:'Edit message'})).toBeNull();
  fireEvent.click(screen.getByRole('menuitem',{name:'Cancel'}));
  fireEvent.contextMenu(screen.getByText('My private hello').closest('.palace-chat-bubble'));
  fireEvent.click(screen.getByRole('menuitem',{name:'Edit message'}));
  expect(screen.getByRole('textbox',{name:'Edit your message'}).value).toBe('My private hello');
  expect(screen.queryByRole('menu',{name:'Message actions'})).toBeNull();
 });
 it('supports keyboard message menus as well as touch-based long press',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{
   id:'own-2',conversation_id:'direct-one',sender_id:user,body:'Quiet note',
   created_at:'2026-10-10T12:01:00.000Z'
  }]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  const log=await screen.findByRole('log',{name:'Conversation messages'});
  const bubble=(await within(log).findByText('Quiet note')).closest('.palace-chat-bubble');
  fireEvent.keyDown(bubble,{key:'F10',shiftKey:true});
  expect(screen.getByRole('menuitem',{name:'Edit message'})).toBeTruthy();
  fireEvent.click(screen.getByRole('menuitem',{name:'Cancel'}));
  vi.useFakeTimers();
  try{
   fireEvent.pointerDown(bubble,{button:0,pointerType:'touch',clientX:100,clientY:330});
   act(()=>{vi.advanceTimersByTime(500)});
   expect(screen.getByRole('menu',{name:'Message actions'})).toBeTruthy();
   fireEvent.pointerUp(bubble,{button:0,pointerType:'touch'});
  }finally{vi.useRealTimers()}
 });
 it('opens an existing Direct conversation explicitly on mobile instead of silently reselecting it',async()=>{
  getLetters.mockResolvedValue({
   conversations:[
    {conversation_id:'direct-one',conversations:{kind:'direct'},correspondent:{display_name:'River'},preference:{archived:false,muted:false},unread:false},
    {conversation_id:'direct-two',conversations:{kind:'direct'},correspondent:{display_name:'Juniper'},preference:{archived:false,muted:false},unread:false}
   ],
   messages:[
    {id:'message-one',conversation_id:'direct-one',sender_id:'member-two',body:'River letter',created_at:'2026-10-09T12:00:00Z'},
    {id:'message-two',conversation_id:'direct-two',sender_id:'member-three',body:'Juniper letter',created_at:'2026-10-09T13:00:00Z'}
   ],requests:[]
  });
  const {container}=mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  await screen.findByRole('button',{name:'Juniper'});
  expect(container.querySelector('.palace-chat-dock.is-thread-open')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Juniper'}));
  expect(container.querySelector('.palace-chat-dock.is-thread-open')).toBeTruthy();
  expect(within(screen.getByRole('log',{name:'Conversation messages'})).getByText('Juniper letter')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Back to conversations'}));
  expect(container.querySelector('.palace-chat-dock.is-thread-open')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'River'}));
  expect(within(screen.getByRole('log',{name:'Conversation messages'})).getByText('River letter')).toBeTruthy();
  expect(within(screen.getByRole('log',{name:'Conversation messages'})).queryByText('Juniper letter')).toBeNull();
 });
 it('shows a retry rather than claiming zero conversations when Direct loading fails',async()=>{
  getLetters.mockRejectedValue(new Error('Inbox temporarily unavailable'));
  mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByText('Could not load direct conversations')).toBeTruthy();
  expect(screen.queryByText('0 direct conversations')).toBeNull();
  getLetters.mockResolvedValue(direct);
  fireEvent.click(screen.getByRole('button',{name:'Retry loading conversations'}));
  await screen.findByRole('button',{name:'River'});
  expect(screen.queryByRole('button',{name:'Retry loading conversations'})).toBeNull();
 });
 it('offers both a visible header minimize button and a mobile-friendly footer close control',()=>{
  mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  expect(screen.getByRole('button',{name:'Minimize Palace chat'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Close Palace chat'}));
  expect(screen.getByRole('button',{name:/Open Palace chat/})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:'Minimize Palace chat'}));
  expect(screen.getByRole('button',{name:/Open Palace chat/})).toBeTruthy();
 });

 it('filters circles by a member name and can focus on unread groups without hiding chat features',async()=>{
  const older={...groups.groups[0],lastMessageAt:'2026-10-09T14:00:00Z',lastReadAt:'2026-10-09T13:00:00Z'};
  const quiet={...older,id:'quiet-two',title:'Quiet Writers',description:'Writers only',members:[{id:user,display_name:'Host'}],lastMessageAt:null};
  getPalaceGroupChatOverview.mockResolvedValue({groups:[older,quiet],invitations:[]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  expect(await screen.findByRole('button',{name:/Quiet Writers/})).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox',{name:'Find a conversation'}),{target:{value:'River'}});
  expect(screen.getByRole('button',{name:/Moonlight Readers/})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Quiet Writers/})).toBeNull();
  fireEvent.change(screen.getByRole('textbox',{name:'Find a conversation'}),{target:{value:''}});
  fireEvent.click(screen.getByRole('button',{name:'Unread only'}));
  expect(screen.getByRole('button',{name:/Moonlight Readers/})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Quiet Writers/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));
  expect(screen.getByRole('button',{name:/Quiet Writers/})).toBeTruthy();
 });
 it('quotes a direct message in the draft without sending or inventing a linked reply',async()=>{
  getLetters.mockResolvedValue({...direct,messages:[{
   id:'quote-one',conversation_id:'direct-one',sender_id:'member-two',
   body:'We will meet at the palace',created_at:'2026-10-20T12:00:00Z',status:'active'
  }]});
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.contextMenu(screen.getByRole('log',{name:'Conversation messages'}).querySelector('[data-chat-message="quote-one"]'));
  fireEvent.click(screen.getByRole('menuitem',{name:'Quote in draft'}));
  expect(screen.getByRole('textbox',{name:'Write a private message'}).value).toContain('↩ Quoting River: “We will meet at the palace”');
  expect(sendLetter).not.toHaveBeenCalled();
  expect(screen.getByText(/text quote, not a linked reply/)).toBeTruthy();
 });
 it('loads and retains older direct messages beyond the inbox preview',async()=>{
  const recent=Array.from({length:60},(_,index)=>({
   id:'dm-'+index,conversation_id:'direct-one',sender_id:'member-two',body:'Private letter '+index,
   created_at:new Date(Date.UTC(2026,9,12,12,0,index)).toISOString(),status:'active'
  }));
  const older=[{id:'original-letter',conversation_id:'direct-one',sender_id:'member-two',
   body:'A much older private note',created_at:'2026-10-11T09:00:00.000Z',status:'active'}];
  getDirectConversationMessages.mockImplementation((member,id,limit,before)=>Promise.resolve(before?older:recent));
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(await screen.findByRole('button',{name:'River'}));
  fireEvent.click(await screen.findByRole('button',{name:'Load earlier direct messages'}));
  expect(await screen.findByText('A much older private note')).toBeTruthy();
  expect(getDirectConversationMessages).toHaveBeenCalledWith(user,'direct-one',60,recent[0].created_at);
  const connection=watchPalaceChatRoom.mock.calls.find(call=>call[1]?.kind==='direct')?.[1];
  await act(async()=>{await connection.onChange()});
  expect(screen.getByText('A much older private note')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Load earlier direct messages'})).toBeNull();
 });
 it('loads earlier group messages, preserves them on a fresh live fetch and stops at history end',async()=>{
  const latest=Array.from({length:100},(_,index)=>({
   id:'recent-'+index,chat_id:'group-one',sender_id:'member-two',
   body:'Recent group message '+index,created_at:new Date(Date.UTC(2026,9,9,12,0,index)).toISOString(),
   profiles:{display_name:'River'}
  }));
  const older=[{id:'older-1',chat_id:'group-one',sender_id:'member-two',
   body:'An earlier memory of our first discussion',created_at:'2026-10-07T09:00:00.000Z',profiles:{display_name:'River'}}];
  getPalaceGroupMessages.mockImplementation((chatId,limit,before)=>Promise.resolve(before?older:latest));
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  const fetchMore=await screen.findByRole('button',{name:'Load earlier group messages'});
  fireEvent.click(fetchMore);
  expect(await screen.findByText('An earlier memory of our first discussion')).toBeTruthy();
  expect(getPalaceGroupMessages).toHaveBeenCalledWith('group-one',60,latest[0].created_at);
  const connection=watchPalaceChatRoom.mock.calls.find(call=>call[1]?.kind==='groups')?.[1];
  await act(async()=>{await connection.onChange()});
  expect(screen.getByText('An earlier memory of our first discussion')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Load earlier group messages'})).toBeNull();
 });
 it('keeps Direct and private Groups separate and displays group sender names',async()=>{
  mount();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  expect((await screen.findAllByText('River')).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  expect(await screen.findByText('Poetry Circle')).toBeTruthy();
  expect(screen.getAllByText('Moonlight Readers').length).toBeGreaterThan(0);
  expect(await screen.findByText('Welcome to the circle')).toBeTruthy();
  expect(screen.getByText('2 members · Invitation-only group')).toBeTruthy();
 });
 it('starts groups with selected invitees rather than silently adding members',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  fireEvent.click(screen.getByRole('button',{name:'＋ Group'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Group name'}),{target:{value:'Writers Tea Room'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Search people to invite'}),{target:{value:'Night'}});
  fireEvent.click(screen.getByRole('button',{name:'Find'}));
  await screen.findByText('@nightwind');
  fireEvent.click(screen.getByRole('button',{name:/Night Wind/}));
  fireEvent.click(screen.getByRole('button',{name:/Create group/}));
  await waitFor(()=>expect(createPalaceGroupChat).toHaveBeenCalledWith('Writers Tea Room',['member-three']));
  expect(await screen.findByText(/invitations are waiting for acceptance/)).toBeTruthy();
 });
 it('requires an explicit Join action for pending group invitations',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findByText('Poetry Circle');
  fireEvent.click(screen.getByRole('button',{name:'Join'}));
  await waitFor(()=>expect(respondPalaceGroupInvite).toHaveBeenCalledWith('group-invite',true));
 });
 it('replies to a specific group message and clears the reply after sending',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findByText('Welcome to the circle');
  fireEvent.contextMenu(screen.getByText('Welcome to the circle').closest('.palace-chat-bubble'));
  expect(screen.getByRole('menu',{name:'Message actions'})).toBeTruthy();
  fireEvent.click(screen.getByRole('menuitem',{name:/Reply/}));
  expect(screen.getByText(/Replying to: Welcome to the circle/)).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox',{name:'Write a group message'}),{target:{value:'I will bring the tea.'}});
  fireEvent.click(screen.getByRole('button',{name:/Send/}));
  await waitFor(()=>expect(sendPalaceGroupMessage).toHaveBeenCalledWith('group-one',user,'I will bring the tea.',{replyToId:'m1'}));
  await waitFor(()=>expect(screen.queryByText(/Replying to:/)).toBeNull());
 });
 it('lets the host save a description and group colour',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findAllByText('Moonlight Readers');
  fireEvent.click(screen.getByRole('button',{name:/Members & settings/}));
  expect(screen.getAllByText('For gentle stories').length).toBeGreaterThan(0);
  fireEvent.change(screen.getByRole('textbox',{name:'Group description'}),{target:{value:'Poems, tales and tea.'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Group colour'}),{target:{value:'moonlit'}});
  fireEvent.click(screen.getByRole('button',{name:'Save appearance'}));
  await waitFor(()=>expect(setPalaceGroupIdentity).toHaveBeenCalledWith('group-one',{
   title:'Moonlight Readers',description:'Poems, tales and tea.',colorKey:'moonlit'
  }));
 });
 it('places a Reading Circle question into an editable unsent draft',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  fireEvent.click(await screen.findByRole('button',{name:'Moonlight Readers'}));
  fireEvent.click(screen.getByRole('button',{name:/Reading Circle ideas/}));
  expect(screen.getByRole('region',{name:'Reading Circle discussion ideas'})).toBeTruthy();
  expect(screen.getByText(/Nothing is sent automatically/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Which moment stayed with you/}));
  expect(screen.getByRole('textbox',{name:'Write a group message'}).value).toMatch(/Which moment stayed with you/);
  expect(sendPalaceGroupMessage).not.toHaveBeenCalled();
  expect(screen.queryByRole('region',{name:'Reading Circle discussion ideas'})).toBeNull();
 });
 it('shares only a selected published story with a structured story reference',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  fireEvent.click(await screen.findByRole('button',{name:'Moonlight Readers'}));
  fireEvent.click(screen.getByRole('button',{name:/Share a Palace story/}));
  fireEvent.change(screen.getByRole('textbox',{name:'Find a published story to share'}),{target:{value:'Blue'}});
  fireEvent.click(screen.getByRole('button',{name:'Find'}));
  await screen.findByText('Blue River');
  fireEvent.click(screen.getByRole('button',{name:/Blue River/}));
  await waitFor(()=>expect(sendPalaceGroupMessage).toHaveBeenCalledWith('group-one',user,'✧ A Palace story to read: Blue River',{sharedWorkId:'work-1'}));
 });
 it('allows only the host to pin a group message',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findByText('Welcome to the circle');
  fireEvent.contextMenu(screen.getByText('Welcome to the circle').closest('.palace-chat-bubble'));
  fireEvent.click(screen.getByRole('menuitem',{name:'Pin message'}));
  await waitFor(()=>expect(pinPalaceGroupMessage).toHaveBeenCalledWith('group-one','m1'));
 });
 it('subscribes only while a selected chat is open and labels an active connection honestly',async()=>{
  mount();
  expect(watchPalaceChatRoom).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  await waitFor(()=>expect(watchPalaceChatRoom).toHaveBeenCalledWith(null,expect.objectContaining({
   kind:'direct',roomId:'direct-one',userId:user
  })));
  const directConfig=watchPalaceChatRoom.mock.calls.find(call=>call[1]?.kind==='direct')?.[1];
  await act(async()=>{directConfig.onStatus('SUBSCRIBED')});
  expect(await screen.findByText('Live updates')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await waitFor(()=>expect(watchPalaceChatRoom).toHaveBeenCalledWith(null,expect.objectContaining({
   kind:'groups',roomId:'group-one',userId:user
  })));
 });
 it('does not drag readers to new messages when they are scrolled up, and offers a jump button',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  fireEvent.click(await screen.findByRole('button',{name:'Moonlight Readers'}));
  await screen.findByText('Welcome to the circle');
  const log=screen.getByRole('log',{name:'Conversation messages'});
  Object.defineProperties(log,{
   scrollHeight:{configurable:true,value:900},
   clientHeight:{configurable:true,value:100},
   scrollTop:{configurable:true,writable:true,value:0}
  });
  fireEvent.scroll(log);
  getPalaceGroupMessages.mockResolvedValue([
   {id:'m1',chat_id:'group-one',sender_id:'member-two',body:'Welcome to the circle',created_at:'2026-10-08T13:00:00Z',profiles:{display_name:'River'}},
   {id:'m2',chat_id:'group-one',sender_id:'member-two',body:'Another story to read',created_at:'2026-10-08T13:03:00Z',profiles:{display_name:'River'}}
  ]);
  const groupConfig=watchPalaceChatRoom.mock.calls.find(call=>call[1]?.kind==='groups')?.[1];
  await act(async()=>{await groupConfig.onChange();});
  expect(await screen.findByText('Another story to read')).toBeTruthy();
  const jump=await screen.findByRole('button',{name:/Jump to latest/});
  fireEvent.click(jump);
  expect(screen.queryByRole('button',{name:/Jump to latest/})).toBeNull();
 });
 it('sends the selected group message without exposing it in Direct chat',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findAllByText('Moonlight Readers');
  fireEvent.change(screen.getByRole('textbox',{name:'Write a group message'}),{target:{value:'We are gathering tonight.'}});
  fireEvent.click(screen.getByRole('button',{name:/Send/}));
  await waitFor(()=>expect(sendPalaceGroupMessage).toHaveBeenCalledWith('group-one',user,'We are gathering tonight.',{}));
 });
});
