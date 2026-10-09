import {describe,expect,it,vi} from 'vitest';
import {watchPalaceChatRoom} from './palaceChatRealtime';

describe('private Palace Chat live subscriptions',()=>{
 it('limits group events to the active chat and re-fetches rather than exposing event bodies',()=>{
  const onChange=vi.fn(),onStatus=vi.fn(),on=vi.fn(),subscribe=vi.fn();
  const channel={on,subscribe};
  on.mockReturnValue(channel);
  const client={channel:vi.fn().mockReturnValue(channel),removeChannel:vi.fn().mockResolvedValue(undefined)};
  const stop=watchPalaceChatRoom(client,{userId:'reader-1',kind:'groups',roomId:'group-1',onChange,onStatus});
  expect(on).toHaveBeenCalledWith('postgres_changes',{
   event:'INSERT',schema:'public',table:'palace_group_chat_messages',filter:'chat_id=eq.group-1'
  },expect.any(Function));
  const received=on.mock.calls[0][2];
  received({new:{body:'This should never render directly'}});
  expect(onChange).toHaveBeenCalledTimes(1);
  subscribe.mock.calls[0][0]('SUBSCRIBED');
  expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED');
  stop();
  received({new:{body:'Stale message'}});
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(client.removeChannel).toHaveBeenCalledWith(channel);
 });
 it('uses direct message conversation IDs without listening to other letters',()=>{
  const on=vi.fn(),channel={on,subscribe:vi.fn()};
  on.mockReturnValue(channel);
  const client={channel:vi.fn().mockReturnValue(channel),removeChannel:vi.fn()};
  watchPalaceChatRoom(client,{userId:'writer-1',kind:'direct',roomId:'letter-1'});
  expect(on.mock.calls[0][1]).toEqual({
   event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.letter-1'
  });
 });
 it('does not create channels without an authenticated client and selected conversation',()=>{
  const client={channel:vi.fn()};
  watchPalaceChatRoom(client,{userId:null,kind:'groups',roomId:'group-1'});
  watchPalaceChatRoom(client,{userId:'user-1',kind:'groups',roomId:''});
  watchPalaceChatRoom(null,{userId:'user-1',kind:'groups',roomId:'group-1'});
  expect(client.channel).not.toHaveBeenCalled();
 });
});
