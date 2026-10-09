import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceChatDrawer from './PalaceChatDrawer';
import {getLetters,searchMembers} from './palaceData';
import {getPalaceGroupChatOverview,getPalaceGroupMessages,createPalaceGroupChat,respondPalaceGroupInvite,sendPalaceGroupMessage} from './palaceGroupChatData';

vi.mock('./palaceData',()=>({
 getLetters:vi.fn(),sendLetter:vi.fn(),searchMembers:vi.fn(),setConversationPreference:vi.fn().mockResolvedValue(undefined)
}));
vi.mock('./palaceGroupChatData',()=>({
 getPalaceGroupChatOverview:vi.fn(),getPalaceGroupMessages:vi.fn(),createPalaceGroupChat:vi.fn(),
 sendPalaceGroupMessage:vi.fn(),respondPalaceGroupInvite:vi.fn(),
 invitePalaceGroupMember:vi.fn(),removePalaceGroupMember:vi.fn(),leavePalaceGroupChat:vi.fn(),
 renamePalaceGroupChat:vi.fn(),setPalaceGroupMuted:vi.fn(),markPalaceGroupRead:vi.fn().mockResolvedValue(undefined)
}));
const user='member-one';
const direct={conversations:[{conversation_id:'direct-one',conversations:{kind:'direct'},correspondent:{id:'member-two',display_name:'River'},preference:{archived:false,muted:false},unread:false}],messages:[],requests:[]};
const groups={groups:[{id:'group-one',title:'Moonlight Readers',ownerId:user,members:[{id:user,display_name:'Host'},{id:'member-two',display_name:'River'}],muted:false,lastReadAt:null,lastMessageAt:null}],invitations:[{id:'group-invite',title:'Poetry Circle'}]};
function mount(){return render(<MemoryRouter><PalaceChatDrawer userId={user}/></MemoryRouter>)}
beforeEach(()=>{
 vi.clearAllMocks();
 getLetters.mockResolvedValue(direct);
 getPalaceGroupChatOverview.mockResolvedValue(groups);
 getPalaceGroupMessages.mockResolvedValue([{id:'m1',chat_id:'group-one',sender_id:'member-two',body:'Welcome to the circle',created_at:'2026-10-08T13:00:00Z',profiles:{display_name:'River'}}]);
 searchMembers.mockResolvedValue([{id:'member-three',username:'nightwind',display_name:'Night Wind'}]);
 createPalaceGroupChat.mockResolvedValue('group-created');
 respondPalaceGroupInvite.mockResolvedValue(undefined);
 sendPalaceGroupMessage.mockResolvedValue({id:'m2'});
});
afterEach(cleanup);
describe('Palace quick chat',()=>{
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
 it('sends the selected group message without exposing it in Direct chat',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Open Palace chat/}));
  fireEvent.click(screen.getByRole('button',{name:/Groups/}));
  await screen.findAllByText('Moonlight Readers');
  fireEvent.change(screen.getByRole('textbox',{name:'Write a group message'}),{target:{value:'We are gathering tonight.'}});
  fireEvent.click(screen.getByRole('button',{name:/Send/}));
  await waitFor(()=>expect(sendPalaceGroupMessage).toHaveBeenCalledWith('group-one',user,'We are gathering tonight.'));
 });
});
