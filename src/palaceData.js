import { supabase } from './supabase';

function needClient(){if(!supabase) throw new Error('The Palace data connection is not configured.');return supabase}
export async function getMyProfile(userId){const{data,error}=await needClient().from('profiles').select('id,username,display_name,title,bio,avatar_url,cover_url,visibility,message_policy,pronouns,status_line,availability,roles,featured_genres,featured_fandoms,accent,cover_position').eq('id',userId).single();if(error)throw error;return data}
export async function updateMyProfile(userId,patch){
 const username=patch.username?.trim().toLowerCase().replace(/^@/,'');
 if(username&&!/^[a-z0-9_]{3,30}$/.test(username))throw new Error('Your Palace handle may use 3–30 lowercase letters, numbers and underscores.');
 const allowed={
  display_name:patch.display_name?.trim(),
  title:patch.title?.trim()||null,
  bio:patch.bio?.trim()||'',
  visibility:patch.visibility,
  message_policy:patch.message_policy,
  pronouns:patch.pronouns?.trim()||null,
  status_line:patch.status_line?.trim()||null,
  availability:patch.availability?.trim()||null,
  roles:Array.isArray(patch.roles)?patch.roles.filter(Boolean).map(x=>String(x).trim()).filter(Boolean):[],
  featured_genres:Array.isArray(patch.featured_genres)?patch.featured_genres.filter(Boolean).map(x=>String(x).trim()).filter(Boolean):[],
  featured_fandoms:Array.isArray(patch.featured_fandoms)?patch.featured_fandoms.filter(Boolean).map(x=>String(x).trim()).filter(Boolean):[],
  accent:patch.accent||'moon-violet',
  cover_position:Number.isFinite(Number(patch.cover_position))?Math.max(0,Math.min(100,Number(patch.cover_position))):48
 };
 if(username)allowed.username=username;
 const{data,error}=await needClient().from('profiles').update(allowed).eq('id',userId).select().single();
 if(error?.code==='23505')throw new Error('That Palace handle is already taken.');
 if(error)throw error;return data
}
export async function uploadProfileMedia(userId,file,kind='avatar'){
 if(!file)throw new Error('Choose an image first.');
 if(file.size>6291456)throw new Error('Profile images must be 6 MB or smaller.');
 const ext=(file.name?.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
 const path=userId+'/'+kind+'-'+Date.now()+'.'+ext;
 const{error}=await needClient().storage.from('profile-media').upload(path,file,{upsert:false,contentType:file.type||undefined});
 if(error)throw error;
 const{data}=needClient().storage.from('profile-media').getPublicUrl(path);
 const url=data?.publicUrl;if(!url)throw new Error('Profile image URL could not be created.');
 const column=kind==='cover'?'cover_url':'avatar_url';
 const{data:profile,error:profileError}=await needClient().from('profiles').update({[column]:url}).eq('id',userId).select().single();
 if(profileError)throw profileError;
 return profile
}
export async function getMyPrivacy(userId){const{data,error}=await needClient().from('privacy_preferences').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return data}
export async function ensureMyPrivacy(userId){const current=await getMyPrivacy(userId);if(current)return current;const{data,error}=await needClient().from('privacy_preferences').insert({user_id:userId}).select().single();if(error)throw error;return data}
export async function getChamberSnapshot(userId){
 const [profile,privacy,works,progress,notices,letterRequests,savedCount,giftCount,eventCount,comicCount,subscriptions,followedWriters,savedComics,recentStops]=await Promise.all([
  getMyProfile(userId),ensureMyPrivacy(userId),
  needClient().from('works').select('id,title,slug,publication_status,completion_status,updated_at').eq('author_id',userId).order('updated_at',{ascending:false}).limit(4),
  needClient().from('reading_progress').select('work_id,chapter_id,progress_percent,completed,updated_at,works(id,title,slug,cover_url)').eq('user_id',userId).eq('completed',false).order('updated_at',{ascending:false}).limit(3),
  needClient().from('notifications').select('id,title,body,notice_type,created_at,unread').eq('user_id',userId).eq('dismissed',false).order('created_at',{ascending:false}).limit(4),
  needClient().from('message_requests').select('id',{count:'exact',head:true}).eq('recipient_id',userId).eq('status','pending'),
  needClient().from('saved_works').select('work_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('user_gift_inventory').select('gift_id',{count:'exact',head:true}).eq('user_id',userId).gt('copies',0),
  needClient().from('event_rsvps').select('event_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('comics').select('id',{count:'exact',head:true}).eq('creator_id',userId),
  needClient().from('story_subscriptions').select('work_id',{count:'exact',head:true}).eq('user_id',userId).eq('enabled',true),
  needClient().from('member_follows').select('followed_id',{count:'exact',head:true}).eq('follower_id',userId),
  needClient().from('saved_comics').select('comic_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('reading_progress').select('work_id',{count:'exact',head:true}).eq('user_id',userId)
 ]);
 for(const r of[works,progress,notices,letterRequests,savedCount,giftCount,eventCount,comicCount,subscriptions,followedWriters,savedComics,recentStops])if(r.error)throw r.error;
 return{profile,privacy,works:works.data||[],progress:progress.data||[],notices:notices.data||[],counts:{
  letterRequests:letterRequests.count||0,saved:savedCount.count||0,gifts:giftCount.count||0,events:eventCount.count||0,comics:comicCount.count||0,
  subscriptions:subscriptions.count||0,followedWriters:followedWriters.count||0,savedComics:savedComics.count||0,recentStops:recentStops.count||0
 }}
}
export async function getPublishedWorks(){const{data,error}=await needClient().from('works').select('id,title,slug,summary,rating,language,completion_status,cover_url,last_published_at,profiles!works_author_id_fkey(username,display_name)').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(24);if(error)throw error;return data||[]}
export async function getMyWorks(userId){const{data,error}=await needClient().from('works').select('id,title,slug,summary,publication_status,completion_status,visibility,updated_at,chapters(id,status,word_count)').eq('author_id',userId).order('updated_at',{ascending:false});if(error)throw error;return data||[]}
export async function createDraft(userId,title){const clean=title.trim();if(!clean)throw new Error('Give your work a title first.');const slug=(clean.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'untitled')+'-'+Date.now().toString(36);const{data,error}=await needClient().from('works').insert({author_id:userId,title:clean,slug,publication_status:'draft',visibility:'private'}).select().single();if(error)throw error;return data}

export async function getSettings(userId){const [privacy,notifications,exports,deletions]=await Promise.all([ensureMyPrivacy(userId),needClient().from('notification_preferences').select('*').eq('user_id',userId).maybeSingle(),needClient().from('account_export_requests').select('id,status,format,requested_at,ready_at,expires_at').eq('user_id',userId).order('requested_at',{ascending:false}).limit(3),needClient().from('account_deletion_requests').select('id,status,requested_at,scheduled_for,cancelled_at').eq('user_id',userId).order('requested_at',{ascending:false}).limit(1)]);for(const r of[notifications,exports,deletions])if(r.error)throw r.error;let np=notifications.data;if(!np){const created=await needClient().from('notification_preferences').insert({user_id:userId}).select().single();if(created.error)throw created.error;np=created.data}return{privacy,notifications:np,exports:exports.data||[],deletion:deletions.data?.[0]||null}}
export async function updatePrivacy(userId,patch){const{data,error}=await needClient().from('privacy_preferences').update({...patch,updated_at:new Date().toISOString()}).eq('user_id',userId).select().single();if(error)throw error;return data}
export async function updateNotifications(userId,patch){const{data,error}=await needClient().from('notification_preferences').update({...patch,updated_at:new Date().toISOString()}).eq('user_id',userId).select().single();if(error)throw error;return data}
export async function requestAccountExport(format='json'){const{data,error}=await needClient().rpc('request_account_export',{p_format:format});if(error)throw error;return data}
export async function requestAccountDeletion(){const{data,error}=await needClient().rpc('request_account_deletion');if(error)throw error;return data}
export async function cancelAccountDeletion(requestId){const{data,error}=await needClient().rpc('cancel_account_deletion',{p_request_id:requestId});if(error)throw error;return data}

export async function getActivity(userId){const{data,error}=await needClient().from('notifications').select('id,title,body,notice_type,route_name,route_param,unread,saved,created_at').eq('user_id',userId).eq('dismissed',false).order('created_at',{ascending:false}).limit(50);if(error)throw error;return data||[]}
export async function markNoticeRead(userId,id){const{error}=await needClient().from('notifications').update({unread:false,read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId);if(error)throw error}
export async function markAllNoticesRead(userId){const{error}=await needClient().from('notifications').update({unread:false,read_at:new Date().toISOString()}).eq('user_id',userId).eq('unread',true);if(error)throw error}

export async function getLibrary(userId){const [saved,progress,subs,savedComics,comicProgress,comicSubs,follows]=await Promise.all([
 needClient().from('saved_works').select('saved_at,works(id,title,slug,summary,cover_url,completion_status,profiles!works_author_id_fkey(username,display_name))').eq('user_id',userId).order('saved_at',{ascending:false}),
 needClient().from('reading_progress').select('work_id,chapter_id,progress_percent,completed,updated_at,works(id,title,slug,cover_url)').eq('user_id',userId).order('updated_at',{ascending:false}),
 needClient().from('story_subscriptions').select('work_id,enabled,frequency,works(id,title,slug)').eq('user_id',userId).eq('enabled',true),
 needClient().from('saved_comics').select('saved_at,comics(id,title,slug,summary,completion_status,cover_path)').eq('user_id',userId).order('saved_at',{ascending:false}),
 needClient().from('comic_reading_progress').select('comic_id,episode_id,page_id,completed,updated_at,comics(id,title,slug,cover_path)').eq('user_id',userId).order('updated_at',{ascending:false}),
 needClient().from('comic_subscriptions').select('comic_id,enabled,frequency,comics(id,title,slug)').eq('user_id',userId).eq('enabled',true),
 needClient().from('member_follows').select('followed_id,created_at,profiles!member_follows_followed_id_fkey(id,username,display_name,title,avatar_url)').eq('follower_id',userId).order('created_at',{ascending:false})
]);for(const r of [saved,progress,subs,savedComics,comicProgress,comicSubs,follows])if(r.error)throw r.error;
 const comics=await Promise.all((savedComics.data||[]).map(async x=>({...x,cover_url:await signedAsset('comic-covers',x.comics?.cover_path)})));
 const comicHistory=await Promise.all((comicProgress.data||[]).map(async x=>({...x,cover_url:await signedAsset('comic-covers',x.comics?.cover_path)})));
 return{saved:saved.data||[],progress:progress.data||[],subscriptions:subs.data||[],savedComics:comics,comicProgress:comicHistory,comicSubscriptions:comicSubs.data||[],followedWriters:follows.data||[]}}
export async function getTagConstellation(){const{data,error}=await needClient().from('tags').select('id,name,category,status,canonical_tag_id').eq('status','canonical').order('name').limit(250);if(error)throw error;return data||[]}
export async function getWorksForTag(tagId){const{data,error}=await needClient().from('work_tags').select('position,works(id,title,slug,summary,rating,completion_status,cover_url,publication_status,profiles!works_author_id_fkey(username,display_name))').eq('tag_id',tagId).order('position').limit(50);if(error)throw error;return(data||[]).filter(x=>x.works?.publication_status==='published')}

export async function getPalaceLife(userId){
 const [clubs,threads,chat,intros,clubInvites,clubRequests,subscriptions,mutes,savedThreads,highlights,highlightChampions,communityIntros,introReactions]=await Promise.all([
  needClient().from('clubs').select('id,name,slug,club_type,privacy,description,club_members!inner(user_id,status,role)').eq('club_members.user_id',userId).eq('club_members.status','active').limit(24),
  needClient().from('forum_threads').select('id,author_id,title,body,room,created_at,updated_at,profiles!forum_threads_author_id_fkey(username,display_name,avatar_url)').eq('status','active').order('updated_at',{ascending:false}).limit(30),
  needClient().from('public_chat_messages').select('id,author_id,body,created_at,profiles!public_chat_messages_author_id_fkey(username,display_name,avatar_url)').eq('status','active').order('created_at',{ascending:false}).limit(30),
  needClient().from('member_introductions').select('id,title,body,highlighted,created_at,profiles!member_introductions_author_id_fkey(username,display_name,avatar_url)').eq('status','active').order('created_at',{ascending:false}).limit(16),
  needClient().from('club_invitations').select('id,club_id,sender_id,recipient_id,note,status,created_at,clubs(id,name,slug,club_type,privacy),profiles!club_invitations_sender_id_fkey(username,display_name,avatar_url)').eq('recipient_id',userId).eq('status','pending').order('created_at',{ascending:false}).limit(12),
  needClient().from('club_membership_requests').select('id,club_id,requester_id,note,status,created_at,clubs(id,name,slug),profiles!club_membership_requests_requester_id_fkey(username,display_name,avatar_url)').eq('status','pending').order('created_at',{ascending:false}).limit(30),
  needClient().from('forum_thread_subscriptions').select('thread_id').eq('user_id',userId),
  needClient().from('forum_thread_mutes').select('thread_id').eq('user_id',userId),
  needClient().from('forum_saved_threads').select('thread_id').eq('user_id',userId),
  needClient().from('community_highlights').select('id,member_id,created_by,reason,status,created_at,profiles!community_highlights_member_id_fkey(username,display_name,avatar_url,title)').in('status',['nominated','approved','featured']).order('created_at',{ascending:false}).limit(20),
  needClient().from('community_highlight_champions').select('highlight_id,user_id'),
  needClient().from('community_introductions').select('id,member_id,title,body,tags,visibility,created_at,profiles!community_introductions_member_id_fkey(username,display_name,avatar_url,title)').in('visibility',['public','members']).order('created_at',{ascending:false}).limit(20),
  needClient().from('community_introduction_reactions').select('introduction_id,user_id,reaction')
 ]);
 for(const r of[clubs,threads,chat,intros,clubInvites,clubRequests,subscriptions,mutes,savedThreads,highlights,highlightChampions,communityIntros,introReactions])if(r.error)throw r.error;

 const joined=clubs.data||[];
 const stewardClubIds=joined.filter(c=>(c.club_members||[]).some(m=>m.role==='steward'||m.role==='owner')).map(c=>c.id);
 const stewardRequests=(clubRequests.data||[]).filter(r=>stewardClubIds.includes(r.club_id));
 const subSet=new Set((subscriptions.data||[]).map(x=>x.thread_id));
 const muteSet=new Set((mutes.data||[]).map(x=>x.thread_id));
 const saveSet=new Set((savedThreads.data||[]).map(x=>x.thread_id));
 const championRows=highlightChampions.data||[];
 const reactionRows=introReactions.data||[];

 return{
  clubs:joined,
  threads:(threads.data||[]).map(x=>({...x,subscribed:subSet.has(x.id),muted:muteSet.has(x.id),saved:saveSet.has(x.id)})),
  chat:(chat.data||[]).reverse(),
  introductions:intros.data||[],
  clubInvites:clubInvites.data||[],
  stewardRequests,
  highlights:(highlights.data||[]).map(h=>({...h,champion_count:championRows.filter(x=>x.highlight_id===h.id).length,championed:championRows.some(x=>x.highlight_id===h.id&&x.user_id===userId)})),
  communityIntroductions:(communityIntros.data||[]).map(i=>({...i,reaction_count:reactionRows.filter(x=>x.introduction_id===i.id).length,reacted:reactionRows.some(x=>x.introduction_id===i.id&&x.user_id===userId)}))
 }
}
export async function postMoonlight(userId,body){const text=body.trim();if(!text)throw new Error('Write something before sending it into the room.');const{data,error}=await needClient().from('public_chat_messages').insert({author_id:userId,body:text}).select().single();if(error)throw error;return data}
export async function createForumThread(userId,title,body){const{data,error}=await needClient().from('forum_threads').insert({author_id:userId,title:title.trim(),body:body.trim(),room:'Palace Commons'}).select().single();if(error)throw error;return data}
export async function getLetters(userId){const [members,requests,prefs]=await Promise.all([needClient().from('conversation_members').select('conversation_id,joined_at,conversations(id,kind,status,last_message_at,direct_user_a,direct_user_b)').eq('user_id',userId).is('left_at',null),needClient().from('message_requests').select('id,sender_id,recipient_id,intro_text,status,created_at,profiles!message_requests_sender_id_fkey(username,display_name)').eq('recipient_id',userId).eq('status','pending').order('created_at',{ascending:false}),needClient().from('conversation_preferences').select('*').eq('user_id',userId)]);for(const r of[members,requests,prefs])if(r.error)throw r.error;const conversations=members.data||[];const ids=conversations.map(x=>x.conversation_id);let messages=[];if(ids.length){const r=await needClient().from('messages').select('id,conversation_id,sender_id,body,created_at,status').in('conversation_id',ids).eq('status','active').order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;messages=r.data||[]}const prefMap=Object.fromEntries((prefs.data||[]).map(p=>[p.conversation_id,p]));return{conversations:conversations.map(c=>({...c,preference:prefMap[c.conversation_id]||{starred:false,archived:false,muted:false}})),requests:requests.data||[],messages}}
export async function sendLetter(userId,conversationId,body){const text=body.trim();if(!text)throw new Error('Your letter is empty.');const{data,error}=await needClient().from('messages').insert({conversation_id:conversationId,sender_id:userId,body:text}).select().single();if(error)throw error;return data}
export async function respondToLetterRequest(userId,requestId,status){if(!['accepted','declined'].includes(status))throw new Error('Unknown request response.');const{error}=await needClient().from('message_requests').update({status,resolved_at:new Date().toISOString()}).eq('id',requestId).eq('recipient_id',userId).eq('status','pending');if(error)throw error}
export async function requestPalaceLetter(userId,recipientId,introText=''){
 const text=introText.trim();const{data,error}=await needClient().from('message_requests').insert({sender_id:userId,recipient_id:recipientId,intro_text:text||'A Palace member would like to begin a correspondence.'}).select('id,status,conversation_id,recipient_id,created_at').single();if(error)throw error;return data
}
export async function reportConversation(userId,conversationId,reportedUserId,reason){
 const text=reason.trim();if(!text)throw new Error('Tell the Council what happened first.');const{data,error}=await needClient().from('conversation_reports').insert({reporter_id:userId,conversation_id:conversationId,reported_user_id:reportedUserId,reason:text,status:'open'}).select().single();if(error)throw error;return data
}



export async function getEventsHeritage(userId){const [events,heritage,rsvps,saved]=await Promise.all([needClient().from('events').select('id,title,slug,event_type,summary,starts_at,ends_at,timezone,access_level,participation,accessibility_notes').eq('publication_status','published').order('starts_at',{ascending:true}).limit(30),needClient().from('heritage_observances').select('id,title,slug,summary,why_in_palace,observance_type,community_key,country_code,region_key,month,day,end_month,end_day,recurring,year,context_notes').eq('editorial_status','verified').order('month').order('day').limit(100),userId?needClient().from('event_rsvps').select('event_id,status').eq('user_id',userId):Promise.resolve({data:[],error:null}),userId?needClient().from('user_heritage_calendar').select('observance_id,saved,reminder_enabled').eq('user_id',userId).eq('saved',true):Promise.resolve({data:[],error:null})]);for(const r of[events,heritage,rsvps,saved])if(r.error)throw r.error;return{events:events.data||[],heritage:heritage.data||[],rsvps:rsvps.data||[],saved:saved.data||[]}}
export async function getEventProposals(userId){if(!userId)return[];const{data,error}=await needClient().from('event_proposals').select('id,proposer_id,title,proposal_type,summary,proposed_start,proposed_end,timezone,audience,accessibility_plan,purpose,status,council_note,created_at,event_proposal_champions(user_id)').neq('status','withdrawn').order('created_at',{ascending:false}).limit(40);if(error)throw error;return(data||[]).map(p=>({...p,champion_count:p.event_proposal_champions?.length||0,championed:p.event_proposal_champions?.some(x=>x.user_id===userId)}))}
export async function createEventProposal(userId,proposal){const{data,error}=await needClient().from('event_proposals').insert({proposer_id:userId,title:proposal.title.trim(),proposal_type:proposal.proposal_type,summary:proposal.summary.trim(),proposed_start:proposal.proposed_start||null,proposed_end:proposal.proposed_end||null,timezone:proposal.timezone||'UTC',audience:proposal.audience?.trim()||'',accessibility_plan:proposal.accessibility_plan?.trim()||'',purpose:proposal.purpose?.trim()||'',status:'gathering_champions'}).select().single();if(error)throw error;return data}
export async function setProposalChampion(userId,proposalId,champion){if(champion){const{error}=await needClient().from('event_proposal_champions').insert({proposal_id:proposalId,user_id:userId});if(error&&error.code!=='23505')throw error}else{const{error}=await needClient().from('event_proposal_champions').delete().eq('proposal_id',proposalId).eq('user_id',userId);if(error)throw error}}
export async function setEventRsvp(userId,eventId,status='going'){const{error}=await needClient().from('event_rsvps').upsert({user_id:userId,event_id:eventId,status,updated_at:new Date().toISOString()},{onConflict:'event_id,user_id'});if(error)throw error}
export async function saveHeritage(userId,observanceId){const{error}=await needClient().from('user_heritage_calendar').upsert({user_id:userId,observance_id:observanceId,saved:true,updated_at:new Date().toISOString()},{onConflict:'user_id,observance_id'});if(error)throw error}
export async function getCouncilRoom(userId){const [role,reports,archive,proposals,conversation]=await Promise.all([needClient().rpc('is_council_member'),needClient().from('community_reports').select('id,reporter_id,target_kind,target_id,reason,status,created_at,resolved_at,review_note').order('created_at',{ascending:false}).limit(40),needClient().from('archive_review_requests').select('id,record_id,requester_id,request_type,summary,requested_language,status,council_note,created_at,reviewed_at').order('created_at',{ascending:false}).limit(40),needClient().from('event_proposals').select('id,proposer_id,title,proposal_type,summary,status,council_note,created_at,reviewed_at').in('status',['council_review','accepted','declined']).order('created_at',{ascending:false}).limit(40),needClient().from('conversation_reports').select('id,reporter_id,conversation_id,reported_user_id,reason,status,created_at,resolved_at').eq('reporter_id',userId).order('created_at',{ascending:false}).limit(30)]);for(const r of[role,reports,archive,proposals,conversation])if(r.error)throw r.error;return{isCouncil:!!role.data,reports:reports.data||[],archive:archive.data||[],proposals:proposals.data||[],conversation:conversation.data||[]}}
export async function reviewCommunityReport(id,status,review_note=''){const{data,error}=await needClient().from('community_reports').update({status,review_note,resolved_at:['resolved','dismissed'].includes(status)?new Date().toISOString():null}).eq('id',id).select().single();if(error)throw error;return data}
export async function reviewArchiveRequest(id,status,council_note=''){const{data,error}=await needClient().from('archive_review_requests').update({status,council_note,reviewed_at:['accepted','declined','closed'].includes(status)?new Date().toISOString():null}).eq('id',id).select().single();if(error)throw error;return data}

export async function getHonour(userId){const periods=await needClient().from('monthly_court_periods').select('id,month_start,category,status,finalized_at').order('month_start',{ascending:false}).limit(12);if(periods.error)throw periods.error;const ids=(periods.data||[]).map(p=>p.id);let rankings=[];if(ids.length){const r=await needClient().from('monthly_court_rankings').select('period_id,user_id,rank,score,calculated_at,profiles!monthly_court_rankings_user_id_fkey(username,display_name,title,avatar_url)').in('period_id',ids).order('rank');if(r.error)throw r.error;rankings=r.data||[]}let pref=null;if(userId){const pr=await needClient().from('ranking_preferences').select('*').eq('user_id',userId).maybeSingle();if(pr.error)throw pr.error;pref=pr.data;if(!pref){const made=await needClient().from('ranking_preferences').insert({user_id:userId}).select().single();if(made.error)throw made.error;pref=made.data}}return{periods:periods.data||[],rankings,preferences:pref}}
export async function updateRankingPreferences(userId,patch){const{data,error}=await needClient().from('ranking_preferences').upsert({user_id:userId,...patch,updated_at:new Date().toISOString()},{onConflict:'user_id'}).select().single();if(error)throw error;return data}

export async function getTreasury(userId){const [ach,gifts,showA,showG,pref]=await Promise.all([needClient().from('user_achievement_progress').select('current_value,bronze_unlocked_at,silver_unlocked_at,gold_unlocked_at,platinum_unlocked_at,emerald_unlocked_at,achievement_families(id,name,description,thresholds,art_status,catalogue_number)').eq('user_id',userId),needClient().from('user_gift_inventory').select('tier,copies,virtual_gifts(id,name,description,court_name,catalogue_number,art_status,upgrade_copies)').eq('user_id',userId).gt('copies',0),needClient().from('profile_achievement_showcase').select('achievement_id,display_tier,position').eq('user_id',userId).order('position'),needClient().from('profile_gift_showcase').select('gift_id,display_tier,position').eq('user_id',userId).order('position'),needClient().from('ranking_preferences').select('*').eq('user_id',userId).maybeSingle()]);for(const r of[ach,gifts,showA,showG,pref])if(r.error)throw r.error;return{achievements:ach.data||[],gifts:gifts.data||[],achievementShowcase:showA.data||[],giftShowcase:showG.data||[],rankingPreferences:pref.data}}
export async function getArchive(){const{data,error}=await needClient().from('archive_records').select('id,accession_number,slug,title,creator_name,record_nature,category,summary,original_language,languages,surviving_extent,known_gaps,provenance_summary,rights_status,hosting_basis,host_mode,continuation_status,verified_at').eq('publication_status','published').order('updated_at',{ascending:false}).limit(100);if(error)throw error;return data||[]}
export async function saveArchiveRecord(userId,recordId){const{error}=await needClient().from('user_archive_records').upsert({user_id:userId,record_id:recordId,saved:true,visited_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,record_id'});if(error)throw error}

export async function getMemberProfile(username,viewerId){
 const{data:profile,error}=await needClient().from('profiles').select('id,username,display_name,title,bio,avatar_url,cover_url,visibility,message_policy,pronouns,status_line,availability,roles,featured_genres,featured_fandoms,accent,cover_position').eq('username',username).maybeSingle();
 if(error)throw error;if(!profile)return null;
 const own=viewerId===profile.id;
 const [privacy,works,follow,counting,seriesCount,clubCount,showA,showG]=await Promise.all([
  own?getMyPrivacy(profile.id):Promise.resolve(null),
  needClient().from('works').select('id,title,slug,summary,cover_url,completion_status,last_published_at').eq('author_id',profile.id).eq('publication_status','published').order('last_published_at',{ascending:false}).limit(12),
  viewerId&&!own?needClient().from('member_follows').select('followed_id').eq('follower_id',viewerId).eq('followed_id',profile.id).maybeSingle():Promise.resolve({data:null,error:null}),
  needClient().from('member_follows').select('follower_id',{count:'exact',head:true}).eq('followed_id',profile.id),
  needClient().from('series').select('id',{count:'exact',head:true}).eq('owner_id',profile.id),
  needClient().from('club_members').select('club_id',{count:'exact',head:true}).eq('user_id',profile.id).eq('status','active'),
  needClient().from('profile_achievement_showcase').select('achievement_id,display_tier,position,achievement_families(id,name,description,catalogue_number,art_status)').eq('user_id',profile.id).order('position'),
  needClient().from('profile_gift_showcase').select('gift_id,display_tier,position,virtual_gifts(id,name,description,court_name,catalogue_number,art_status)').eq('user_id',profile.id).order('position')
 ]);
 for(const r of[works,follow,counting,seriesCount,clubCount,showA,showG])if(r.error)throw r.error;
 return{
  profile,privacy:privacy||null,works:works.data||[],following:!!follow.data,followerCount:counting.count||0,
  showcase:{achievements:showA.data||[],gifts:showG.data||[]},
  counts:{works:works.data?.length||0,series:seriesCount.count||0,clubs:clubCount.count||0,honours:(showA.data?.length||0)+(showG.data?.length||0)}
 }
}
export async function setFollow(viewerId,memberId,follow){if(follow){const{error}=await needClient().from('member_follows').insert({follower_id:viewerId,followed_id:memberId});if(error)throw error}else{const{error}=await needClient().from('member_follows').delete().eq('follower_id',viewerId).eq('followed_id',memberId);if(error)throw error}}
export async function searchMembers(term){const q=term.trim();if(!q)return[];const{data,error}=await needClient().from('profiles').select('id,username,display_name,title,avatar_url,visibility').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq('visibility','hidden').limit(20);if(error)throw error;return data||[]}

export async function getWorkBySlug(slug){const{data,error}=await needClient().from('works').select('id,author_id,title,slug,summary,work_type,rating,language,completion_status,publication_status,visibility,comment_policy,constructive_criticism,translation_policy,download_policy,cover_url,first_published_at,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url),chapters(id,title,position,status,word_count,published_at)').eq('slug',slug).maybeSingle();if(error)throw error;if(!data)return null;data.chapters=(data.chapters||[]).sort((a,b)=>a.position-b.position);return data}
export async function getChapter(workSlug,chapterId){const work=await getWorkBySlug(workSlug);if(!work)return null;const{data,error}=await needClient().from('chapters').select('id,work_id,title,position,body_html,status,revision,revision_note,published_at,word_count,updated_at').eq('id',chapterId).eq('work_id',work.id).maybeSingle();if(error)throw error;return data?{work,chapter:data}:null}
export async function saveWork(userId,workId,patch){const allowed={title:patch.title?.trim(),summary:patch.summary??'',rating:patch.rating,language:patch.language?.trim()||'en',completion_status:patch.completion_status,visibility:patch.visibility,comment_policy:patch.comment_policy,constructive_criticism:!!patch.constructive_criticism,translation_policy:patch.translation_policy,download_policy:patch.download_policy,updated_at:new Date().toISOString()};const{data,error}=await needClient().from('works').update(allowed).eq('id',workId).eq('author_id',userId).select().single();if(error)throw error;return data}
export async function createChapter(userId,workId,title){const clean=title.trim();if(!clean)throw new Error('Give the chapter a title first.');const pos=await needClient().from('chapters').select('position').eq('work_id',workId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;const position=(pos.data?.[0]?.position||0)+1;const{data,error}=await needClient().from('chapters').insert({work_id:workId,title:clean,position,status:'draft'}).select().single();if(error)throw error;return data}
function plainWordCount(text){return text.replace(/<[^>]*>/g,' ').trim().split(/\s+/).filter(Boolean).length}
export async function saveChapter(userId,chapterId,patch){const body=patch.body_html??'';const{data,error}=await needClient().from('chapters').update({title:patch.title?.trim(),body_html:body,word_count:plainWordCount(body),revision_note:patch.revision_note??'',updated_at:new Date().toISOString()}).eq('id',chapterId).select().single();if(error)throw error;return data}
export async function publishChapter(userId,chapterId){const now=new Date().toISOString();const{data,error}=await needClient().from('chapters').update({status:'published',published_at:now,updated_at:now}).eq('id',chapterId).select('id,work_id').single();if(error)throw error;const{data:work,error:we}=await needClient().from('works').select('first_published_at').eq('id',data.work_id).single();if(we)throw we;const update={publication_status:'published',last_published_at:now,updated_at:now};if(!work.first_published_at)update.first_published_at=now;const wr=await needClient().from('works').update(update).eq('id',data.work_id).eq('author_id',userId);if(wr.error)throw wr.error;return data}
export async function saveWorkToLibrary(userId,workId){const{error}=await needClient().from('saved_works').upsert({user_id:userId,work_id:workId},{onConflict:'user_id,work_id'});if(error)throw error}
export async function subscribeWork(userId,workId){const{error}=await needClient().from('story_subscriptions').upsert({user_id:userId,work_id:workId,enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id,work_id'});if(error)throw error}
export async function recordReadingProgress(userId,workId,chapterId,percent=0,completed=false){const next=Math.max(0,Math.min(100,percent));const current=await needClient().from('reading_progress').select('progress_percent,completed').eq('user_id',userId).eq('work_id',workId).maybeSingle();if(current.error)throw current.error;const progress=Math.max(Number(current.data?.progress_percent||0),next);const done=Boolean(current.data?.completed||completed);const{error}=await needClient().from('reading_progress').upsert({user_id:userId,work_id:workId,chapter_id:chapterId,progress_percent:progress,completed:done,updated_at:new Date().toISOString()},{onConflict:'user_id,work_id'});if(error)throw error}

export async function getWorkCommunity(workId){const [tags,comments]=await Promise.all([needClient().from('work_tags').select('position,tags(id,name,category,status)').eq('work_id',workId).order('position'),needClient().from('comments').select('id,work_id,chapter_id,author_id,parent_comment_id,comment_type,body,spoiler,status,created_at,profiles!comments_author_id_fkey(username,display_name,avatar_url)').eq('work_id',workId).order('created_at')]);if(tags.error)throw tags.error;if(comments.error)throw comments.error;return{tags:(tags.data||[]).filter(x=>x.tags?.status==='canonical'),comments:comments.data||[]}}
export async function addWorkTag(userId,workId,tagId){const{error}=await needClient().from('work_tags').insert({work_id:workId,tag_id:tagId});if(error&&error.code!=='23505')throw error}
export async function removeWorkTag(userId,workId,tagId){const{error}=await needClient().from('work_tags').delete().eq('work_id',workId).eq('tag_id',tagId);if(error)throw error}
export async function proposeTag(userId,name,category){const clean=name.trim();if(!clean)throw new Error('Name the tag first.');const{data,error}=await needClient().from('tags').insert({name:clean,category,status:'pending',created_by:userId}).select().single();if(error)throw error;return data}
export async function addComment(userId,workId,chapterId,body,type='response',spoiler=false,parentId=null){const text=body.trim();if(!text)throw new Error('Write a response first.');const{data,error}=await needClient().from('comments').insert({work_id:workId,chapter_id:chapterId||null,author_id:userId,parent_comment_id:parentId,comment_type:type,body:text,spoiler,status:'pending'}).select().single();if(error)throw error;return data}
export async function moderateComment(commentId,status){const{data,error}=await needClient().from('comments').update({status,updated_at:new Date().toISOString()}).eq('id',commentId).select().single();if(error)throw error;return data}

export async function searchWorksByTags(includeIds=[],excludeIds=[],text=''){let q=needClient().from('works').select('id,title,slug,summary,rating,language,completion_status,cover_url,profiles!works_author_id_fkey(username,display_name),work_tags(tag_id,tags(id,name,category,status))').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(100);if(text.trim())q=q.or(`title.ilike.%${text.trim()}%,summary.ilike.%${text.trim()}%`);const{data,error}=await q;if(error)throw error;return(data||[]).filter(w=>{const ids=(w.work_tags||[]).filter(x=>x.tags?.status==='canonical').map(x=>x.tag_id);return includeIds.every(id=>ids.includes(id))&&!excludeIds.some(id=>ids.includes(id))})}


async function signedAsset(bucket,path,expiresIn=3600){
 if(!path)return null;
 try{const{data,error}=await needClient().storage.from(bucket).createSignedUrl(path,expiresIn);if(error)return null;return data?.signedUrl||data?.signedURL||null}catch{return null}
}
export async function getPublishedComics(){
 const{data,error}=await needClient().from('comics').select('id,creator_id,title,slug,summary,rating,completion_status,reading_direction,download_policy,required_credit_line,comment_policy,cover_path,last_published_at').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(30);
 if(error)throw error;const comics=data||[];const creators=[...new Set(comics.map(c=>c.creator_id).filter(Boolean))];let profiles=[];
 if(creators.length){const p=await needClient().from('profiles').select('id,username,display_name,avatar_url').in('id',creators);if(p.error)throw p.error;profiles=p.data||[]}
 return Promise.all(comics.map(async c=>({...c,creator:profiles.find(p=>p.id===c.creator_id)||null,cover_url:await signedAsset('comic-covers',c.cover_path)})));
}
export async function getComicBySlug(slug){
 const{data:comic,error}=await needClient().from('comics').select('*').eq('slug',slug).maybeSingle();if(error)throw error;if(!comic)return null;
 const[episodes,profile,tags]=await Promise.all([
  needClient().from('comic_episodes').select('*').eq('comic_id',comic.id).order('position'),
  needClient().from('profiles').select('id,username,display_name,avatar_url').eq('id',comic.creator_id).maybeSingle(),
  needClient().from('comic_tags').select('position,tags(id,name,category,status)').eq('comic_id',comic.id).order('position')
 ]);for(const r of[episodes,profile,tags])if(r.error)throw r.error;
 const eps=episodes.data||[];const ids=eps.map(e=>e.id);let pages=[];
 if(ids.length){const pr=await needClient().from('comic_pages').select('*').in('episode_id',ids).order('position');if(pr.error)throw pr.error;pages=pr.data||[]}
 const signedPages=await Promise.all(pages.map(async p=>({...p,reader_url:await signedAsset('comic-pages',p.reader_path)})));
 return{...comic,creator:profile.data||null,cover_url:await signedAsset('comic-covers',comic.cover_path),tags:(tags.data||[]).filter(x=>x.tags?.status==='canonical'),episodes:eps.map(e=>({...e,pages:signedPages.filter(p=>p.episode_id===e.id).sort((a,b)=>a.position-b.position)}))};
}
export async function getComicProgress(userId,comicId){
 if(!userId)return null;const{data,error}=await needClient().from('comic_reading_progress').select('*').eq('user_id',userId).eq('comic_id',comicId).maybeSingle();if(error)throw error;return data
}
export async function recordComicProgress(userId,comicId,episodeId,pageId,completed=false){
 if(!userId)return;const{error}=await needClient().from('comic_reading_progress').upsert({user_id:userId,comic_id:comicId,episode_id:episodeId,page_id:pageId,completed,updated_at:new Date().toISOString()},{onConflict:'user_id,comic_id'});if(error)throw error
}
export async function saveComic(userId,comicId){
 const{error}=await needClient().from('saved_comics').upsert({user_id:userId,comic_id:comicId},{onConflict:'user_id,comic_id'});if(error)throw error
}
export async function subscribeComic(userId,comicId,frequency='instant'){
 const{error}=await needClient().from('comic_subscriptions').upsert({user_id:userId,comic_id:comicId,frequency,enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id,comic_id'});if(error)throw error
}
export async function requestComicDownload(userId,comicId,requested_scope='images',note=''){
 const{data,error}=await needClient().from('comic_download_requests').insert({comic_id:comicId,requester_id:userId,requested_scope,note:note.trim(),status:'pending'}).select().single();if(error)throw error;return data
}
export async function setConversationPreference(userId,conversationId,patch){
 const{data,error}=await needClient().from('conversation_preferences').upsert({user_id:userId,conversation_id:conversationId,...patch,updated_at:new Date().toISOString()},{onConflict:'user_id,conversation_id'}).select().single();if(error)throw error;return data
}

export async function getMyComics(userId){
 const{data,error}=await needClient().from('comics').select('*,comic_episodes(id,title,position,status,revision,published_at,comic_pages(id,position,caption,alt_text,decorative,reader_path,width,height))').eq('creator_id',userId).order('updated_at',{ascending:false});if(error)throw error;
 return Promise.all((data||[]).map(async c=>({...c,cover_url:await signedAsset('comic-covers',c.cover_path),comic_episodes:(c.comic_episodes||[]).sort((a,b)=>a.position-b.position).map(e=>({...e,comic_pages:(e.comic_pages||[]).sort((a,b)=>a.position-b.position)}))})));
}
function comicSlug(title){const base=title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'comic';return base+'-'+crypto.randomUUID().slice(0,8)}
export async function createComicDraft(userId,title){
 const clean=title.trim();if(!clean)throw new Error('Give your comic a title first.');
 const{data,error}=await needClient().from('comics').insert({creator_id:userId,title:clean,slug:comicSlug(clean),summary:'',publication_status:'draft',visibility:'public',rating:'general',completion_status:'in_progress',reading_direction:'ltr',download_policy:'off',comment_policy:'moderated'}).select().single();if(error)throw error;return data
}
export async function saveComicStudio(userId,comicId,patch){
 const allowed={title:patch.title?.trim(),summary:patch.summary??'',rating:patch.rating,completion_status:patch.completion_status,visibility:patch.visibility,reading_direction:patch.reading_direction,download_policy:patch.download_policy,required_credit_line:patch.required_credit_line??'',comment_policy:patch.comment_policy,updated_at:new Date().toISOString()};
 const{data,error}=await needClient().from('comics').update(allowed).eq('id',comicId).eq('creator_id',userId).select().single();if(error)throw error;return data
}
export async function createComicEpisode(userId,comicId,title){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const pos=await needClient().from('comic_episodes').select('position').eq('comic_id',comicId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const{data,error}=await needClient().from('comic_episodes').insert({comic_id:comicId,title:title.trim()||'Untitled episode',position:(pos.data?.[0]?.position||0)+1,status:'draft'}).select().single();if(error)throw error;return data
}
export async function saveComicEpisode(userId,comicId,episodeId,patch){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const{data,error}=await needClient().from('comic_episodes').update({title:patch.title?.trim(),revision_note:patch.revision_note??'',scheduled_for:patch.scheduled_for||null,updated_at:new Date().toISOString()}).eq('id',episodeId).eq('comic_id',comicId).select().single();if(error)throw error;return data
}
export async function publishComicEpisode(userId,comicId,episodeId){
 const own=await needClient().from('comics').select('first_published_at').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const now=new Date().toISOString();const ep=await needClient().from('comic_episodes').update({status:'published',published_at:now,updated_at:now}).eq('id',episodeId).eq('comic_id',comicId).select().single();if(ep.error)throw ep.error;
 const patch={publication_status:'published',last_published_at:now,updated_at:now};if(!own.data.first_published_at)patch.first_published_at=now;
 const c=await needClient().from('comics').update(patch).eq('id',comicId).eq('creator_id',userId);if(c.error)throw c.error;return ep.data
}
function safeAssetName(name){return(name||'image').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120)}
export async function uploadComicPage(userId,comicId,episodeId,file,meta={}){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const pos=await needClient().from('comic_pages').select('position').eq('episode_id',episodeId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const path=`${userId}/${comicId}/${episodeId}/${crypto.randomUUID()}-${safeAssetName(file.name)}`;
 const up=await needClient().storage.from('comic-pages').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;
 const{data,error}=await needClient().from('comic_pages').insert({episode_id:episodeId,position:(pos.data?.[0]?.position||0)+1,caption:meta.caption?.trim()||'',alt_text:meta.alt_text?.trim()||'',decorative:!!meta.decorative,reader_path:path}).select().single();if(error){await needClient().storage.from('comic-pages').remove([path]).catch(()=>{});throw error}return data
}
export async function uploadComicCover(userId,comicId,file){
 const path=`${userId}/${comicId}/cover-${crypto.randomUUID()}-${safeAssetName(file.name)}`;const up=await needClient().storage.from('comic-covers').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(up.error)throw up.error;
 const{data,error}=await needClient().from('comics').update({cover_path:path,updated_at:new Date().toISOString()}).eq('id',comicId).eq('creator_id',userId).select().single();if(error)throw error;return data
}
export async function deleteComicPage(userId,comicId,page){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const del=await needClient().from('comic_pages').delete().eq('id',page.id);if(del.error)throw del.error;if(page.reader_path)await needClient().storage.from('comic-pages').remove([page.reader_path]);return true
}
export async function getMemberBoundary(userId,otherUserId){
 if(!userId||!otherUserId||userId===otherUserId)return{muted:false,blocked:false};
 const{data,error}=await needClient().from('user_member_boundaries').select('muted,blocked').eq('user_id',userId).eq('other_user_id',otherUserId).maybeSingle();if(error)throw error;return data||{muted:false,blocked:false}
}
export async function setMemberBoundary(userId,otherUserId,patch){
 const row={user_id:userId,other_user_id:otherUserId,muted:!!patch.muted,blocked:!!patch.blocked,updated_at:new Date().toISOString()};
 const{data,error}=await needClient().from('user_member_boundaries').upsert(row,{onConflict:'user_id,other_user_id'}).select().single();if(error)throw error;
 if(row.blocked)await needClient().from('member_follows').delete().eq('follower_id',userId).eq('followed_id',otherUserId);
 return data
}
export async function sendMessageRequest(userId,recipientId,introText){
 const text=introText.trim();if(!text)throw new Error('Write a short introduction first.');
 const{data,error}=await needClient().from('message_requests').insert({sender_id:userId,recipient_id:recipientId,intro_text:text,status:'pending'}).select().single();if(error)throw error;return data
}

export async function getLuckyDrawState(userId){
 const month=new Date().toISOString().slice(0,7)+'-01';
 const [catalogue,claim]=await Promise.all([
  needClient().from('virtual_gifts').select('id,catalogue_number,name,description,court_name,collection_type,art_status',{count:'exact'}).eq('catalogue_status','catalogued').eq('reward_eligible',true).order('catalogue_number').limit(8),
  needClient().from('lucky_draw_claims').select('id,draw_month,gift_id,tier,claimed_at,virtual_gifts(id,catalogue_number,name,description,court_name,art_status)').eq('user_id',userId).eq('draw_month',month).maybeSingle()
 ]);
 if(catalogue.error)throw catalogue.error;if(claim.error)throw claim.error;
 const history=await needClient().from('lucky_draw_claims').select('id,draw_month,tier,claimed_at,virtual_gifts(id,catalogue_number,name,court_name)').eq('user_id',userId).order('draw_month',{ascending:false}).limit(12);
 if(history.error)throw history.error;
 return{catalogueCount:catalogue.count||0,preview:catalogue.data||[],claim:claim.data||null,history:history.data||[]}
}
export async function claimLuckyDraw(){
 const{data,error}=await needClient().rpc('claim_monthly_lucky_draw');if(error)throw error;return data?.[0]||null
}

export async function getWritingExtras(userId){
 const [incoming,outgoing,comments,downloads]=await Promise.all([
  needClient().from('work_collaborators').select('work_id,user_id,role,status,invited_by,created_at,responded_at,works(id,title,slug,author_id,publication_status)').eq('user_id',userId).order('created_at',{ascending:false}),
  needClient().from('work_collaborators').select('work_id,user_id,role,status,invited_by,created_at,responded_at,works(id,title,slug,author_id,publication_status)').eq('invited_by',userId).order('created_at',{ascending:false}),
  needClient().from('comments').select('id,work_id,chapter_id,author_id,comment_type,body,spoiler,status,created_at,works!inner(id,title,slug,author_id),profiles!comments_author_id_fkey(username,display_name,avatar_url)').eq('works.author_id',userId).order('created_at',{ascending:false}).limit(100),
  needClient().from('comic_download_requests').select('id,comic_id,requester_id,requested_scope,note,status,created_at,decided_at,comics!inner(id,title,slug,creator_id)').eq('comics.creator_id',userId).order('created_at',{ascending:false}).limit(100)
 ]);for(const r of[incoming,outgoing,comments,downloads])if(r.error)throw r.error;
 const profileIds=[...new Set([...(incoming.data||[]).map(x=>x.invited_by),...(outgoing.data||[]).map(x=>x.user_id),...(downloads.data||[]).map(x=>x.requester_id)].filter(Boolean))];let profiles=[];
 if(profileIds.length){const p=await needClient().from('profiles').select('id,username,display_name,avatar_url,title').in('id',profileIds);if(p.error)throw p.error;profiles=p.data||[]}
 const byId=id=>profiles.find(p=>p.id===id)||null;
 return{
  incoming:(incoming.data||[]).map(x=>({...x,inviter:byId(x.invited_by)})),
  outgoing:(outgoing.data||[]).map(x=>({...x,collaborator:byId(x.user_id)})),
  comments:comments.data||[],
  downloads:(downloads.data||[]).map(x=>({...x,requester:byId(x.requester_id)}))
 }
}
export async function inviteWorkCollaborator(userId,workId,username,role='co_writer'){
 const handle=username.trim().toLowerCase().replace(/^@/,'');if(!handle)throw new Error('Enter a Palace handle.');
 const p=await needClient().from('profiles').select('id,username,display_name').eq('username',handle).maybeSingle();if(p.error)throw p.error;if(!p.data)throw new Error('No Palace member uses that handle.');if(p.data.id===userId)throw new Error('You already own this work.');
 const{data,error}=await needClient().from('work_collaborators').upsert({work_id:workId,user_id:p.data.id,role,status:'invited',invited_by:userId,responded_at:null,updated_at:new Date().toISOString()},{onConflict:'work_id,user_id'}).select().single();if(error)throw error;return data
}
export async function respondWorkCollaboration(userId,workId,status){
 if(!['accepted','declined'].includes(status))throw new Error('Unknown collaboration response.');
 const{data,error}=await needClient().from('work_collaborators').update({status,responded_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('work_id',workId).eq('user_id',userId).select().single();if(error)throw error;return data
}
export async function removeWorkCollaborator(userId,workId,otherUserId){
 const{error}=await needClient().from('work_collaborators').delete().eq('work_id',workId).eq('user_id',otherUserId);if(error)throw error;return true
}
export async function respondComicDownloadRequest(userId,requestId,status){
 if(!['approved','declined'].includes(status))throw new Error('Unknown permission response.');
 const{data,error}=await needClient().from('comic_download_requests').update({status,decided_at:new Date().toISOString()}).eq('id',requestId).select().single();if(error)throw error;return data
}

export async function getWorkCollaborationAccess(userId,workId){
 const{data,error}=await needClient().from('work_collaborators').select('work_id,user_id,role,status,invited_by').eq('work_id',workId).eq('user_id',userId).maybeSingle();if(error)throw error;return data
}

export async function getLibraryOrganizers(userId){
 const [collections,lists,notes]=await Promise.all([
  needClient().from('library_collections').select('id,name,description,is_public,created_at,updated_at,library_collection_items(id,work_id,comic_id,note,added_at,works(id,title,slug,cover_url),comics(id,title,slug,cover_path))').eq('user_id',userId).order('updated_at',{ascending:false}),
  needClient().from('reading_lists').select('id,name,description,created_at,updated_at,reading_list_items(id,work_id,comic_id,position,added_at,works(id,title,slug,cover_url),comics(id,title,slug,cover_path))').eq('user_id',userId).order('updated_at',{ascending:false}),
  needClient().from('reader_notes').select('id,work_id,chapter_id,comic_id,episode_id,page_id,note_text,bookmark_label,created_at,updated_at,works(id,title,slug),comics(id,title,slug)').eq('user_id',userId).order('updated_at',{ascending:false})
 ]);for(const r of[collections,lists,notes])if(r.error)throw r.error;
 async function signRows(rows,key){return Promise.all((rows||[]).map(async row=>({...row,[key]:await Promise.all((row[key]||[]).map(async item=>({...item,comic_cover_url:await signedAsset('comic-covers',item.comics?.cover_path)})))})))}
 return{collections:await signRows(collections.data,'library_collection_items'),lists:await signRows(lists.data,'reading_list_items'),notes:notes.data||[]}
}
export async function createLibraryCollection(userId,name,description=''){
 const clean=name.trim();if(!clean)throw new Error('Give the collection a name.');
 const{data,error}=await needClient().from('library_collections').insert({user_id:userId,name:clean,description:description.trim()}).select().single();if(error)throw error;return data
}
export async function createReadingList(userId,name,description=''){
 const clean=name.trim();if(!clean)throw new Error('Give the reading list a name.');
 const{data,error}=await needClient().from('reading_lists').insert({user_id:userId,name:clean,description:description.trim()}).select().single();if(error)throw error;return data
}
export async function addToLibraryOrganizer(kind,containerId,item){
 const table=kind==='collection'?'library_collection_items':'reading_list_items';
 const key=kind==='collection'?'collection_id':'reading_list_id';
 const row={[key]:containerId,work_id:item.type==='work'?item.id:null,comic_id:item.type==='comic'?item.id:null};
 const{data,error}=await needClient().from(table).insert(row).select().single();if(error?.code==='23505')throw new Error('That item is already in this shelf.');if(error)throw error;return data
}
export async function addReaderNote(userId,item,noteText,label=''){
 const text=noteText.trim();if(!text)throw new Error('Write a note first.');
 const row={user_id:userId,note_text:text,bookmark_label:label.trim(),work_id:item.type==='work'?item.id:null,comic_id:item.type==='comic'?item.id:null};
 const{data,error}=await needClient().from('reader_notes').insert(row).select().single();if(error)throw error;return data
}
export async function deleteReaderNote(userId,id){const{error}=await needClient().from('reader_notes').delete().eq('id',id).eq('user_id',userId);if(error)throw error;return true}

export async function getEventMemberRooms(userId){
 const [invitations,reminders,ballots,votes]=await Promise.all([
  needClient().from('event_invitations').select('id,event_id,sender_id,recipient_id,note,status,created_at,resolved_at,events(id,title,slug,starts_at,event_type),profiles!event_invitations_sender_id_fkey(id,username,display_name,avatar_url)').eq('recipient_id',userId).order('created_at',{ascending:false}),
  needClient().from('event_reminders').select('event_id,user_id,remind_at,channel,delivered_at,events(id,title,slug,starts_at)').eq('user_id',userId).order('remind_at',{ascending:true}),
  needClient().from('member_ballots').select('id,title,description,ballot_scope,event_id,opens_at,closes_at,status,max_selections,results_visibility').in('status',['open','closed']).order('opens_at',{ascending:false}),
  needClient().from('member_ballot_votes').select('ballot_id,option_id,user_id,created_at').eq('user_id',userId)
 ]);
 for(const r of[invitations,reminders,ballots,votes])if(r.error)throw r.error;
 const ballotRows=ballots.data||[];
 let optionRows=[];
 if(ballotRows.length){
  const options=await needClient().from('member_ballot_options').select('id,ballot_id,label,description,position').in('ballot_id',ballotRows.map(b=>b.id)).order('position',{ascending:true});
  if(options.error)throw options.error;
  optionRows=options.data||[];
 }
 const ballotsWithOptions=ballotRows.map(b=>({...b,member_ballot_options:optionRows.filter(o=>o.ballot_id===b.id)}));
 return{invitations:invitations.data||[],reminders:reminders.data||[],ballots:ballotsWithOptions,votes:votes.data||[]}
}
export async function respondEventInvitation(userId,id,status){
 if(!['accepted','declined'].includes(status))throw new Error('Unknown invitation response.');
 const{data,error}=await needClient().from('event_invitations').update({status,resolved_at:new Date().toISOString()}).eq('id',id).eq('recipient_id',userId).select().single();if(error)throw error;return data
}
export async function setEventReminder(userId,eventId,remindAt){
 if(!remindAt){const{error}=await needClient().from('event_reminders').delete().eq('event_id',eventId).eq('user_id',userId);if(error)throw error;return null}
 const{data,error}=await needClient().from('event_reminders').upsert({event_id:eventId,user_id:userId,remind_at:remindAt,channel:'in_app'},{onConflict:'event_id,user_id'}).select().single();if(error)throw error;return data
}
export async function castMemberBallotVote(userId,ballotId,optionId){
 const ballot=await needClient().from('member_ballots').select('id,status,opens_at,closes_at,max_selections').eq('id',ballotId).single();if(ballot.error)throw ballot.error;
 if(ballot.data.status!=='open'||new Date(ballot.data.opens_at)>new Date()||new Date(ballot.data.closes_at)<new Date())throw new Error('This ballot is not open.');
 const existing=await needClient().from('member_ballot_votes').select('option_id').eq('ballot_id',ballotId).eq('user_id',userId);if(existing.error)throw existing.error;
 if((existing.data||[]).some(v=>v.option_id===optionId)){const{error}=await needClient().from('member_ballot_votes').delete().eq('ballot_id',ballotId).eq('option_id',optionId).eq('user_id',userId);if(error)throw error;return false}
 if((existing.data||[]).length>=Number(ballot.data.max_selections||1))throw new Error('You have reached this ballot’s selection limit.');
 const{error}=await needClient().from('member_ballot_votes').insert({ballot_id:ballotId,option_id:optionId,user_id:userId});if(error)throw error;return true
}

export async function getSeriesLibrary(userId){
 const q=needClient().from('series').select('id,owner_id,title,slug,summary,visibility,created_at,updated_at,profiles!series_owner_id_fkey(username,display_name),series_works(work_id,position,works(id,title,slug,summary,cover_url,publication_status,completion_status))').order('updated_at',{ascending:false});
 const{data,error}=await q;if(error)throw error;
 return(data||[]).map(s=>({...s,series_works:(s.series_works||[]).sort((a,b)=>a.position-b.position)}))
}
export async function createSeries(userId,title,summary=''){
 const clean=title.trim();if(!clean)throw new Error('Give the series a title.');
 const slug=(clean.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'series')+'-'+Date.now().toString(36);
 const{data,error}=await needClient().from('series').insert({owner_id:userId,title:clean,slug,summary:summary.trim(),visibility:'public'}).select().single();if(error)throw error;return data
}
export async function addWorkToSeries(userId,seriesId,workId){
 const pos=await needClient().from('series_works').select('position').eq('series_id',seriesId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const{data,error}=await needClient().from('series_works').insert({series_id:seriesId,work_id:workId,position:(pos.data?.[0]?.position||0)+1}).select().single();if(error?.code==='23505')throw new Error('That work is already in the series.');if(error)throw error;return data
}
export async function removeWorkFromSeries(userId,seriesId,workId){const{error}=await needClient().from('series_works').delete().eq('series_id',seriesId).eq('work_id',workId);if(error)throw error;return true}

export async function setAchievementShowcase(userId,achievementId,displayTier,show){
 if(show){
  const pos=await needClient().from('profile_achievement_showcase').select('position').eq('user_id',userId).order('position',{ascending:false}).limit(1);
  if(pos.error)throw pos.error;
  const{error}=await needClient().from('profile_achievement_showcase').upsert({user_id:userId,achievement_id:achievementId,display_tier:displayTier,position:(pos.data?.[0]?.position||0)+1},{onConflict:'user_id,achievement_id'});
  if(error)throw error;
 }else{
  const{error}=await needClient().from('profile_achievement_showcase').delete().eq('user_id',userId).eq('achievement_id',achievementId);
  if(error)throw error;
 }
 return true
}
export async function setGiftShowcase(userId,giftId,displayTier,show){
 if(show){
  const pos=await needClient().from('profile_gift_showcase').select('position').eq('user_id',userId).order('position',{ascending:false}).limit(1);
  if(pos.error)throw pos.error;
  const{error}=await needClient().from('profile_gift_showcase').upsert({user_id:userId,gift_id:giftId,display_tier:displayTier,position:(pos.data?.[0]?.position||0)+1},{onConflict:'user_id,gift_id'});
  if(error)throw error;
 }else{
  const{error}=await needClient().from('profile_gift_showcase').delete().eq('user_id',userId).eq('gift_id',giftId);
  if(error)throw error;
 }
 return true
}
