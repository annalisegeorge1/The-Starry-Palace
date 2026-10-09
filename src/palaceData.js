import { supabase } from './supabase';
import {INITIAL_FANDOM_DIRECTORY} from './palaceFandomCatalogue';

function needClient(){if(!supabase) throw new Error('The Palace data connection is not configured.');return supabase}
const identityMarkCache=new Map();
async function getIdentityMarks(userIds=[]){
 const ids=[...new Set((userIds||[]).filter(Boolean))];if(!ids.length)return{};
 const now=Date.now();const fresh={};const missing=[];
 for(const id of ids){const hit=identityMarkCache.get(id);if(hit&&now-hit.at<120000)fresh[id]=hit.value;else missing.push(id)}
 if(missing.length){
  const[ach,gifts]=await Promise.all([
   needClient().from('profile_achievement_showcase').select('user_id,display_tier,position,achievement_families(id,name,catalogue_number)').in('user_id',missing).order('position',{ascending:true}),
   needClient().from('profile_gift_showcase').select('user_id,display_tier,position,virtual_gifts(id,name,court_name,catalogue_number)').in('user_id',missing).order('position',{ascending:true})
  ]);
  if(ach.error)throw ach.error;if(gifts.error)throw gifts.error;
  for(const id of missing){
   const achievement=(ach.data||[]).filter(x=>x.user_id===id).sort((a,b)=>a.position-b.position)[0]||null;
   const gift=(gifts.data||[]).filter(x=>x.user_id===id).sort((a,b)=>a.position-b.position)[0]||null;
   const value={achievement,gift};identityMarkCache.set(id,{at:now,value});fresh[id]=value;
  }
 }
 return fresh
}
function withIdentity(profile,userId,marks){return profile?{...profile,identity:marks?.[userId]||null}:profile}
export async function getMyProfile(userId){const{data,error}=await needClient().from('profiles').select('id,username,display_name,title,bio,avatar_url,cover_url,visibility,message_policy,pronouns,status_line,availability,roles,featured_genres,featured_fandoms,accent,cover_position,support_enabled,support_label,support_url').eq('id',userId).single();if(error)throw error;return data}
export async function getOnboardingState(userId){
 const [profile,settings]=await Promise.all([
  getMyProfile(userId),
  needClient().from('user_settings').select('settings,recommendation_learning,discovery_visibility').eq('user_id',userId).maybeSingle()
 ]);
 if(settings.error)throw settings.error;
 const prefs=settings.data?.settings||{};
 return{
  completed:!!prefs.onboarding_completed,
  version:Number(prefs.onboarding_version||0),
  profile,
  interests:Array.isArray(prefs.discovery_interests)?prefs.discovery_interests:[],
  fandoms:Array.isArray(prefs.discovery_fandoms)?prefs.discovery_fandoms:[],
  intentions:Array.isArray(prefs.palace_intentions)?prefs.palace_intentions:[],
  recommendationLearning:settings.data?.recommendation_learning!==false,
  discoveryVisibility:settings.data?.discovery_visibility!==false
 }
}
export async function saveOnboardingState(userId,{displayName,title,interests=[],fandoms=[],intentions=[],recommendationLearning=true,discoveryVisibility=true}={}){
 const clean=(list,max=10,len=60)=>Array.isArray(list)?list.map(x=>String(x||'').trim().slice(0,len)).filter(Boolean).slice(0,max):[];
 const current=await needClient().from('user_settings').select('settings').eq('user_id',userId).maybeSingle();
 if(current.error)throw current.error;
 const settings={...(current.data?.settings||{}),onboarding_completed:true,onboarding_version:1,onboarding_completed_at:new Date().toISOString(),discovery_interests:clean(interests),discovery_fandoms:clean(fandoms),palace_intentions:clean(intentions,6,32)};
 const updates=await needClient().from('user_settings').upsert({user_id:userId,settings,recommendation_learning:!!recommendationLearning,discovery_visibility:!!discoveryVisibility,updated_at:new Date().toISOString()},{onConflict:'user_id'}).select('settings').single();
 if(updates.error)throw updates.error;
 if(displayName?.trim()){
  const profilePatch={display_name:displayName.trim().slice(0,80),featured_genres:clean(interests),featured_fandoms:clean(fandoms)};if(title?.trim())profilePatch.title=title.trim();
  const profile=await needClient().from('profiles').update(profilePatch).eq('id',userId).select('id').single();
  if(profile.error)throw profile.error;
 }
 return updates.data
}
export async function getPalaceTitleOptions(userId){
 const [catalogue,entitlements]=await Promise.all([
  needClient().from('palace_titles').select('title,category,description,public_selectable,sort_order,celestial_points_required').order('sort_order',{ascending:true}),
  needClient().from('profile_title_entitlements').select('title,source').eq('user_id',userId)
 ]);
 if(catalogue.error)throw catalogue.error;
 if(entitlements.error)throw entitlements.error;
 const entitled=new Set((entitlements.data||[]).map(x=>x.title));
 return (catalogue.data||[]).filter(x=>x.public_selectable||entitled.has(x.title)).map(x=>({...x,entitled:entitled.has(x.title)}))
}
/**
 * Change only the signed-in member's displayed title. Do not rewrite their
 * onboarding choices, discovery settings, or pen name.
 * Palace title entitlements are enforced again by the database trigger.
 */
export async function wearMyPalaceTitle(userId,title){
 const choice=String(title||'').trim();
 if(!userId||!choice)throw new Error('Choose a Palace title first.');
 const available=await getPalaceTitleOptions(userId);
 if(!available.some(row=>row.title===choice))throw new Error('This title is not available to your Palace account yet.');
 const {data,error}=await needClient().from('profiles').update({title:choice}).eq('id',userId).select('title').single();
 if(error)throw error;
 return data.title;
}
export async function getMyCelestialPoints(){
 const{data,error}=await needClient().rpc('get_my_celestial_points');if(error)throw error;
 return data?.[0]||{lifetime_points:0,giving_points:0,receiving_points:0,participation_points:0}
}
export async function getCelestialTitleLadder(userId){
 const [titles,entitlements]=await Promise.all([
  needClient().from('palace_titles').select('title,category,description,sort_order,celestial_points_required').gt('celestial_points_required',0).order('celestial_points_required',{ascending:true}),
  needClient().from('profile_title_entitlements').select('title,source').eq('user_id',userId)
 ]);
 if(titles.error)throw titles.error;if(entitlements.error)throw entitlements.error;
 const entitled=new Set((entitlements.data||[]).map(x=>x.title));
 return (titles.data||[]).map(x=>({...x,entitled:entitled.has(x.title)}))
}
export async function getMyCelestialPointLedger(limit=20){
 const{data,error}=await needClient().rpc('get_my_celestial_point_ledger',{p_limit:limit});if(error)throw error;return data||[]
}
export async function getPalacePraiseState(targetKind,targetId){
 const{data,error}=await needClient().rpc('get_palace_praise_state',{p_target_kind:targetKind,p_target_id:targetId});if(error)throw error;
 return data||{praise:null,counts:{heart:0,star:0,moon:0,crown:0}}
}
export async function givePalacePraise(targetKind,targetId,praiseType){
 const{data,error}=await needClient().rpc('give_palace_praise',{p_target_kind:targetKind,p_target_id:targetId,p_praise_type:praiseType});if(error)throw error;return data
}
export async function recordPalaceShare(workId){
 const{data,error}=await needClient().rpc('record_palace_share',{p_work_id:workId});if(error)throw error;return data
}

export async function updateMyProfile(userId,patch){
 const username=patch.username?.trim().toLowerCase().replace(/^@/,'');
 if(username&&!/^[a-z0-9_]{3,30}$/.test(username))throw new Error('Your Palace handle may use 3–30 lowercase letters, numbers and underscores.');
 const supportUrl=patch.support_url?.trim()||null;
 if(patch.support_enabled&&!supportUrl)throw new Error('Add a secure support link before enabling creator support.');
 if(supportUrl&&!/^https:\/\//i.test(supportUrl))throw new Error('Creator support links must begin with https://');
 const cleanList=(value,maxItems=8,maxLength=50)=>Array.isArray(value)?value.filter(Boolean).map(x=>String(x).trim().slice(0,maxLength)).filter(Boolean).slice(0,maxItems):[];
 const requestedTitle=patch.title?.trim()||null;
 if(requestedTitle){
  const available=await getPalaceTitleOptions(userId);
  if(!available.some(x=>x.title===requestedTitle))throw new Error('Choose a Palace title available to your chamber.');
 }
 const allowed={
  display_name:patch.display_name?.trim().slice(0,80),
  title:requestedTitle,
  bio:patch.bio?.trim().slice(0,1200)||'',
  visibility:patch.visibility,
  message_policy:patch.message_policy,
  pronouns:patch.pronouns?.trim().slice(0,60)||null,
  status_line:patch.status_line?.trim().slice(0,140)||null,
  availability:patch.availability?.trim().slice(0,80)||null,
  roles:cleanList(patch.roles,6,32),
  featured_genres:cleanList(patch.featured_genres,10,50),
  featured_fandoms:cleanList(patch.featured_fandoms,10,60),
  accent:['moon-violet','ink-blue','emerald-night','silver-mist'].includes(patch.accent)?patch.accent:'moon-violet',
  cover_position:Number.isFinite(Number(patch.cover_position))?Math.max(0,Math.min(100,Number(patch.cover_position))):48,
  support_enabled:!!patch.support_enabled,
  support_label:patch.support_label?.trim().slice(0,60)||null,
  support_url:supportUrl
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
 const now=new Date().toISOString();
 const [profile,privacy,works,progress,comicProgress,notices,unreadNotices,savedNotices,letterRequests,savedCount,giftCount,eventCount,comicCount,subscriptions,followedWriters,savedComics,recentStops,scheduledComicEpisodes,scheduledChapters,collaborationInvites,downloadRequests,eventInvitations,myUpcomingEvents]=await Promise.all([
  getMyProfile(userId),ensureMyPrivacy(userId),
  needClient().from('works').select('id,title,slug,publication_status,completion_status,updated_at,chapters(id,status,word_count)').eq('author_id',userId).order('updated_at',{ascending:false}).limit(8),
  needClient().from('reading_progress').select('work_id,chapter_id,progress_percent,chapter_progress_percent,completed,updated_at,works(id,title,slug,cover_url)').eq('user_id',userId).eq('completed',false).order('updated_at',{ascending:false}).limit(4),
  needClient().from('comic_reading_progress').select('comic_id,episode_id,page_id,completed,updated_at,comics(id,title,slug,cover_path,last_published_at)').eq('user_id',userId).order('updated_at',{ascending:false}).limit(4),
  needClient().from('notifications').select('id,title,body,notice_type,route_name,route_param,metadata,created_at,unread').eq('user_id',userId).eq('dismissed',false).order('created_at',{ascending:false}).limit(6),
  needClient().from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('unread',true),
  needClient().from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('saved',true),
  needClient().from('message_requests').select('id',{count:'exact',head:true}).eq('recipient_id',userId).eq('status','pending'),
  needClient().from('saved_works').select('work_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('user_gift_inventory').select('gift_id',{count:'exact',head:true}).eq('user_id',userId).gt('copies',0),
  needClient().from('event_rsvps').select('event_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('comics').select('id',{count:'exact',head:true}).eq('creator_id',userId),
  needClient().from('story_subscriptions').select('work_id',{count:'exact',head:true}).eq('user_id',userId).eq('enabled',true),
  needClient().from('member_follows').select('followed_id',{count:'exact',head:true}).eq('follower_id',userId),
  needClient().from('saved_comics').select('comic_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('reading_progress').select('work_id',{count:'exact',head:true}).eq('user_id',userId),
  needClient().from('comic_episodes').select('id,title,scheduled_for,comic_id,comics!inner(id,title,slug,creator_id)').eq('comics.creator_id',userId).neq('status','published').not('scheduled_for','is',null).gte('scheduled_for',now).order('scheduled_for',{ascending:true}).limit(5),
  needClient().from('chapters').select('id,title,scheduled_for,work_id,works!inner(id,title,slug,author_id)').eq('works.author_id',userId).neq('status','published').not('scheduled_for','is',null).gte('scheduled_for',now).order('scheduled_for',{ascending:true}).limit(5),
  needClient().from('work_collaborators').select('work_id,role,status,created_at,works(id,title,slug)').eq('user_id',userId).eq('status','invited').order('created_at',{ascending:false}).limit(5),
  needClient().from('comic_download_requests').select('id,comic_id,status,created_at,comics!inner(id,title,slug,creator_id)').eq('comics.creator_id',userId).eq('status','pending').order('created_at',{ascending:false}).limit(5),
  needClient().from('event_invitations').select('id,event_id,status,created_at,events(id,title,slug,starts_at,event_type)').eq('recipient_id',userId).eq('status','pending').order('created_at',{ascending:false}).limit(5),
  needClient().from('event_rsvps').select('event_id,status,events!inner(id,title,slug,starts_at,event_type)').eq('user_id',userId).in('status',['going','interested']).gte('events.starts_at',now).order('events(starts_at)',{ascending:true}).limit(5)
 ]);
 for(const r of[works,progress,comicProgress,notices,unreadNotices,savedNotices,letterRequests,savedCount,giftCount,eventCount,comicCount,subscriptions,followedWriters,savedComics,recentStops,scheduledComicEpisodes,scheduledChapters,collaborationInvites,downloadRequests,eventInvitations,myUpcomingEvents])if(r.error)throw r.error;
 const signedComicProgress=await Promise.all((comicProgress.data||[]).map(async x=>({...x,cover_url:await signedAsset('comic-covers',x.comics?.cover_path)})));
 return{
  profile,privacy,works:works.data||[],progress:progress.data||[],comicProgress:signedComicProgress,notices:notices.data||[],
  scheduledComicEpisodes:scheduledComicEpisodes.data||[],scheduledChapters:scheduledChapters.data||[],collaborationInvites:collaborationInvites.data||[],downloadRequests:downloadRequests.data||[],eventInvitations:eventInvitations.data||[],upcomingEvents:(myUpcomingEvents.data||[]).map(x=>({...x,event:x.events})),
  counts:{
   letterRequests:letterRequests.count||0,saved:savedCount.count||0,gifts:giftCount.count||0,events:eventCount.count||0,comics:comicCount.count||0,
   subscriptions:subscriptions.count||0,followedWriters:followedWriters.count||0,savedComics:savedComics.count||0,recentStops:recentStops.count||0,
   scheduledComics:scheduledComicEpisodes.data?.length||0,scheduledChapters:scheduledChapters.data?.length||0,collaborationInvites:collaborationInvites.data?.length||0,downloadRequests:downloadRequests.data?.length||0,eventInvitations:eventInvitations.data?.length||0,unreadNotices:unreadNotices.count||0,savedNotices:savedNotices.count||0
  }
 }
}
export async function getPublishedWorks(){
 const{data,error}=await needClient().from('works').select('id,author_id,title,slug,summary,work_type,rating,language,completion_status,cover_url,first_published_at,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url,title),work_tags(tags(id,name,category,status))').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(24);
 if(error)throw error;
 const rows=data||[];
 const marks=await getIdentityMarks(rows.map(x=>x.author_id));
 const ids=rows.map(x=>x.id);
 if(!ids.length)return [];
 // A single grouped read per table avoids per-card network requests. Only
 // released chapters and approved comments contribute to public figures.
 let stats={};
 try{
  const [chapters,comments,bookmarks]=await Promise.all([
   needClient().from('chapters').select('work_id,word_count,status').in('work_id',ids).eq('status','published'),
   needClient().from('comments').select('work_id,status').in('work_id',ids).eq('status','approved'),
   needClient().rpc('get_reading_room_bookmark_counts',{p_work_ids:ids})
  ]);
  for(const response of [chapters,comments,bookmarks])if(response.error)throw response.error;
  stats=Object.fromEntries(ids.map(id=>[id,{words:0,chapters:0,comments:0,bookmarks:0}]));
  for(const row of chapters.data||[]){const v=stats[row.work_id];if(v){v.chapters++;v.words+=Math.max(0,Number(row.word_count)||0)}}
  for(const row of comments.data||[]){const v=stats[row.work_id];if(v)v.comments++}
  for(const row of bookmarks.data||[]){const v=stats[row.work_id];if(v)v.bookmarks=Math.max(0,Number(row.bookmark_count)||0)}
 }catch{
  // A missing public-count privilege must never break story discovery.
  // No numbers are displayed unless the aggregation succeeds.
 }
 return rows.map(x=>({...x,profiles:withIdentity(x.profiles,x.author_id,marks),reading_stats:stats[x.id]||null}));
}
/** Public aggregate only; never exposes which members saved a story. */
export async function getPublicWorkBookmarkCount(workId){
 if(!workId)return null;
 const {data,error}=await needClient().rpc('get_reading_room_bookmark_counts',{p_work_ids:[workId]});
 if(error)throw error;
 const found=(data||[]).find(item=>item.work_id===workId);
 return found?Math.max(0,Number(found.bookmark_count)||0):0;
}
export async function getMyWorks(userId){const{data,error}=await needClient().from('works').select('id,title,slug,summary,work_type,publication_status,completion_status,visibility,updated_at,chapters(id,title,position,status,word_count,scheduled_for,published_at,updated_at)').eq('author_id',userId).order('updated_at',{ascending:false});if(error)throw error;return(data||[]).map(w=>({...w,chapters:(w.chapters||[]).sort((a,b)=>a.position-b.position)}))}
export async function createDraft(userId,title,options={}){
 const clean=title.trim();if(!clean)throw new Error('Give your work a title first.');
 const slug=(clean.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'untitled')+'-'+Date.now().toString(36);
 const workType=['original','fanwork','poetry','essay','other'].includes(options.workType)?options.workType:'original';
 const{data,error}=await needClient().from('works').insert({author_id:userId,title:clean,slug,work_type:workType,publication_status:'draft',visibility:'private'}).select().single();
 if(error)throw error;return data
}

export async function getSettings(userId){
 const [privacy,notifications,exports,deletions,boundaries,forumMutes,profile,works,comics]=await Promise.all([
  ensureMyPrivacy(userId),
  needClient().from('notification_preferences').select('*').eq('user_id',userId).maybeSingle(),
  needClient().from('account_export_requests').select('id,status,format,requested_at,ready_at,expires_at').eq('user_id',userId).order('requested_at',{ascending:false}).limit(3),
  needClient().from('account_deletion_requests').select('id,status,requested_at,scheduled_for,cancelled_at').eq('user_id',userId).order('requested_at',{ascending:false}).limit(1),
  needClient().from('user_member_boundaries').select('other_user_id,muted,blocked,updated_at,profiles!user_member_boundaries_other_user_id_fkey(id,username,display_name,title,avatar_url)').eq('user_id',userId).order('updated_at',{ascending:false}),
  needClient().from('forum_thread_mutes').select('thread_id,created_at').eq('user_id',userId),
  needClient().from('profiles').select('avatar_url,cover_url').eq('id',userId).maybeSingle(),
  needClient().from('works').select('id,cover_url').eq('author_id',userId),
  needClient().from('comics').select('id,cover_path').eq('creator_id',userId)
 ]);
 for(const r of[notifications,exports,deletions,boundaries,forumMutes,profile,works,comics])if(r.error)throw r.error;
 let np=notifications.data;
 if(!np){const created=await needClient().from('notification_preferences').insert({user_id:userId}).select().single();if(created.error)throw created.error;np=created.data}
 const comicIds=(comics.data||[]).map(x=>x.id);
 let episodeIds=[],comicPageCount=0;
 if(comicIds.length){
  const episodes=await needClient().from('comic_episodes').select('id').in('comic_id',comicIds);
  if(episodes.error)throw episodes.error;
  episodeIds=(episodes.data||[]).map(x=>x.id);
  if(episodeIds.length){
   const pages=await needClient().from('comic_pages').select('id',{count:'exact',head:true}).in('episode_id',episodeIds);
   if(pages.error)throw pages.error;
   comicPageCount=pages.count||0;
  }
 }
 const profileAssets=(profile.data?.avatar_url?1:0)+(profile.data?.cover_url?1:0);
 const storyCovers=(works.data||[]).filter(x=>x.cover_url).length;
 const comicCovers=(comics.data||[]).filter(x=>x.cover_path).length;
 return{
  privacy,notifications:np,exports:exports.data||[],deletion:deletions.data?.[0]||null,
  boundaries:boundaries.data||[],forumMutes:forumMutes.data||[],
  storage:{profileAssets,storyCovers,comicCovers,comicPages:comicPageCount,totalAssets:profileAssets+storyCovers+comicCovers+comicPageCount}
 }
}
export async function updatePrivacy(userId,patch){const{data,error}=await needClient().from('privacy_preferences').update({...patch,updated_at:new Date().toISOString()}).eq('user_id',userId).select().single();if(error)throw error;return data}
export async function updateNotifications(userId,patch){const{data,error}=await needClient().from('notification_preferences').update({...patch,updated_at:new Date().toISOString()}).eq('user_id',userId).select().single();if(error)throw error;return data}
export async function requestAccountExport(format='json'){const{data,error}=await needClient().rpc('request_account_export',{p_format:format});if(error)throw error;return data}
export async function requestAccountDeletion(){const{data,error}=await needClient().rpc('request_account_deletion');if(error)throw error;return data}
export async function cancelAccountDeletion(requestId){const{data,error}=await needClient().rpc('cancel_account_deletion',{p_request_id:requestId});if(error)throw error;return data}

export async function getActivity(userId){
 const [notices,unreadCount,savedCount,progress,works,clubs]=await Promise.all([
  needClient().from('notifications').select('id,title,body,notice_type,route_name,route_param,metadata,action_label,unread,saved,created_at').eq('user_id',userId).eq('dismissed',false).order('created_at',{ascending:false}).limit(100),
  needClient().from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('unread',true),
  needClient().from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('saved',true),
  needClient().from('reading_progress').select('work_id,chapter_id,completed,updated_at').eq('user_id',userId).order('updated_at',{ascending:false}).limit(100),
  needClient().from('works').select('id,publication_status').eq('author_id',userId),
  needClient().from('club_members').select('club_id,status').eq('user_id',userId).eq('status','active')
 ]);
 for(const r of[notices,unreadCount,savedCount,progress,works,clubs])if(r.error)throw r.error;
 return{
  notifications:notices.data||[],
  metrics:{
   unread:unreadCount.count||0,
   saved:savedCount.count||0,
   readingStops:(progress.data||[]).length,
   finished:(progress.data||[]).filter(x=>x.completed).length,
   publishedWorks:(works.data||[]).filter(x=>x.publication_status==='published').length,
   clubs:(clubs.data||[]).length
  }
 }
}
export async function markNoticeRead(userId,id){const{error}=await needClient().from('notifications').update({unread:false,read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId);if(error)throw error}
export async function markAllNoticesRead(userId){const{error}=await needClient().from('notifications').update({unread:false,read_at:new Date().toISOString()}).eq('user_id',userId).eq('unread',true);if(error)throw error}
export async function setNoticeSaved(userId,id,saved){const{data,error}=await needClient().from('notifications').update({saved:!!saved}).eq('id',id).eq('user_id',userId).select('id,saved').single();if(error)throw error;return data}
export async function dismissNotice(userId,id){const{error}=await needClient().from('notifications').update({dismissed:true,unread:false,read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId);if(error)throw error;return true}

export async function getLibrary(userId){const [saved,progress,subs,savedComics,comicProgress,comicSubs,follows]=await Promise.all([
 needClient().from('saved_works').select('saved_at,works(id,title,slug,summary,cover_url,rating,completion_status,last_published_at,profiles!works_author_id_fkey(username,display_name))').eq('user_id',userId).order('saved_at',{ascending:false}),
 needClient().from('reading_progress').select('work_id,chapter_id,progress_percent,chapter_progress_percent,completed,updated_at,works(id,title,slug,summary,cover_url,rating,last_published_at)').eq('user_id',userId).order('updated_at',{ascending:false}),
 needClient().from('story_subscriptions').select('work_id,enabled,frequency,works(id,title,slug,last_published_at)').eq('user_id',userId).eq('enabled',true),
 needClient().from('saved_comics').select('saved_at,comics(id,title,slug,summary,completion_status,cover_path)').eq('user_id',userId).order('saved_at',{ascending:false}),
 needClient().from('comic_reading_progress').select('comic_id,episode_id,page_id,completed,updated_at,comics(id,title,slug,cover_path,last_published_at)').eq('user_id',userId).order('updated_at',{ascending:false}),
 needClient().from('comic_subscriptions').select('comic_id,enabled,frequency,comics(id,title,slug,last_published_at)').eq('user_id',userId).eq('enabled',true),
 needClient().from('member_follows').select('followed_id,created_at,profiles!member_follows_followed_id_fkey(id,username,display_name,title,avatar_url)').eq('follower_id',userId).order('created_at',{ascending:false})
]);for(const r of [saved,progress,subs,savedComics,comicProgress,comicSubs,follows])if(r.error)throw r.error;
 const comics=await Promise.all((savedComics.data||[]).map(async x=>({...x,cover_url:await signedAsset('comic-covers',x.comics?.cover_path)})));
 const comicHistory=await Promise.all((comicProgress.data||[]).map(async x=>({...x,cover_url:await signedAsset('comic-covers',x.comics?.cover_path)})));
 return{saved:saved.data||[],progress:progress.data||[],subscriptions:subs.data||[],savedComics:comics,comicProgress:comicHistory,comicSubscriptions:comicSubs.data||[],followedWriters:follows.data||[]}}
/**
 * Published chapter metadata for a reader-facing story history.
 * Only publicly published chapters count; timestamps do not imply an edit
 * unless a published chapter's updated_at is later than published_at.
 */
export async function getStoryHistoryMetadata(workIds=[]){
 const ids=[...new Set(workIds.filter(Boolean))];
 if(!ids.length)return {};
 const results=[];
 for(let index=0;index<ids.length;index+=60){
  const {data,error}=await needClient().from('chapters')
   .select('id,work_id,title,word_count,published_at,updated_at,status')
   .in('work_id',ids.slice(index,index+60))
   .eq('status','published')
   .order('published_at',{ascending:false});
  if(error)throw error;
  results.push(...(data||[]));
 }
 return Object.fromEntries(ids.map(id=>[id,results.filter(c=>c.work_id===id)]));
}
/**
 * Fandom directory is additive to the existing community tag system.
 * Early deployments gracefully fall back to the curated client catalogue
 * until the new public metadata table has been migrated.
 */
export async function getPalaceFandomDirectory(){
 const client=needClient();
 const pages=[];
 for(let offset=0;offset<1500;offset+=250){
  const result=await client.from('tags')
   .select('id,name,category,status')
   .eq('category','fandom').in('status',['canonical','community'])
   .order('name').range(offset,offset+249);
  if(result.error)throw result.error;
  pages.push(...(result.data||[]));
  if((result.data||[]).length<250)break;
 }
 let counts=[];
 try{counts=await searchPalaceTags('','fandom',250)}catch{}
 const usage=new Map(counts.map(tag=>[tag.id,Number(tag.usage_count||0)]));
 let metadata=[];
 try{
  const result=await client.from('fandom_directory')
   .select('tag_id,media_categories,subcategory,aliases,franchise').limit(1500);
  if(!result.error)metadata=result.data||[];
 }catch{}
 const known=new Map(metadata.map(row=>[row.tag_id,row]));
 const catalogue=new Map(INITIAL_FANDOM_DIRECTORY.map(row=>[row.name.toLowerCase(),row]));
 return pages.map(tag=>{
  const extra=known.get(tag.id)||catalogue.get(String(tag.name).toLowerCase())||{};
  return{...tag,usage_count:usage.get(tag.id)||0,media_categories:extra.media_categories||['uncategorized'],
   subcategory:extra.subcategory||'',aliases:extra.aliases||[],
   franchise:extra.franchise||''};
 });
}
/** Read only eligible, published stories connected to one or more real fandom IDs. */
export async function getStoriesForFandoms(tagIds=[],mode='any'){
 const chosen=[...new Set(tagIds.filter(id=>/^[a-f0-9-]{36}$/i.test(String(id)))].slice(0,5);
 if(!chosen.length)return[];
 const client=needClient();
 const valid=await client.from('tags').select('id').in('id',chosen)
  .eq('category','fandom').in('status',['canonical','community']);
 if(valid.error)throw valid.error;
 const ids=(valid.data||[]).map(x=>x.id);
 if(!ids.length||mode==='all'&&ids.length!==chosen.length)return[];
 const links=await client.from('work_tags').select('work_id,tag_id')
  .in('tag_id',ids).limit(3000);
 if(links.error)throw links.error;
 const matches=new Map();
 for(const row of links.data||[]){
  if(!matches.has(row.work_id))matches.set(row.work_id,new Set());
  matches.get(row.work_id).add(row.tag_id);
 }
 const workIds=[...matches.entries()]
  .filter(([,set])=>mode==='all'?ids.every(id=>set.has(id)):set.size>0)
  .map(([id])=>id).slice(0,100);
 if(!workIds.length)return[];
 const result=await client.from('works')
  .select('id,title,slug,summary,rating,completion_status,cover_url,last_published_at,profiles!works_author_id_fkey(username,display_name)')
  .in('id',workIds).eq('publication_status','published').eq('visibility','public')
  .order('last_published_at',{ascending:false}).limit(100);
 if(result.error)throw result.error;
 return result.data||[];
}

export async function getTagConstellation(){return searchPalaceTags('','all',120)}
export async function searchPalaceTags(query='',category='all',limit=100){const args={p_query:String(query||''),p_category:category==='all'?null:category,p_limit:limit};const modern=await needClient().rpc('search_palace_tags_v2',args);if(!modern.error)return modern.data||[];const legacy=await needClient().rpc('search_palace_tags',args);if(legacy.error)throw modern.error||legacy.error;return legacy.data||[]}
export async function getTagFamilyCounts(){const{data,error}=await needClient().rpc('get_tag_family_counts');if(error)throw error;return data||[]}
export async function createCommunityTag(name,category='additional'){const clean=String(name||'').trim().replace(/\s+/g,' ');if(clean.length<2)throw new Error('Give the tag at least 2 characters.');const nearby=await searchPalaceTags(clean,category,8);const exact=nearby.find(t=>String(t.name||'').toLowerCase()===clean.toLowerCase()&&t.category===category);if(exact)return exact;const{data,error}=await needClient().rpc('create_community_tag',{p_name:clean,p_category:category});if(error)throw error;return data}
export async function getWorksForTag(tagId){const{data,error}=await needClient().from('work_tags').select('position,works(id,title,slug,summary,rating,completion_status,cover_url,publication_status,profiles!works_author_id_fkey(username,display_name))').eq('tag_id',tagId).order('position').limit(50);if(error)throw error;return(data||[]).filter(x=>x.works?.publication_status==='published')}

export async function createClub(userId,{name,clubType='reading',privacy='open',description='',guidelines=''}) {
 const clean=String(name||'').trim();
 if(clean.length<3)throw new Error('Give the club a name of at least 3 characters.');
 const base=clean.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'palace-club';
 const suffix=Date.now().toString(36).slice(-5);
 const slug=base+'-'+suffix;
 const{data,error}=await needClient().from('clubs').insert({
  owner_id:userId,
  name:clean,
  slug,
  club_type:clubType,
  privacy,
  description:String(description||'').trim(),
  guidelines:String(guidelines||'').trim()||'The Palace Code applies in this room.',
  discoverable:privacy!=='invite_only'
 }).select().single();
 if(error)throw error;return data
}
export async function createClubPoll(clubId,question,options,closesAt=null){
 const cleanOptions=(options||[]).map(x=>String(x||'').trim()).filter(Boolean);
 const{data,error}=await needClient().rpc('create_club_poll',{
  p_club_id:clubId,
  p_question:String(question||'').trim(),
  p_options:cleanOptions,
  p_closes_at:closesAt
 });
 if(error)throw error;return data
}

export async function getClubRoom(slug,userId){
 const clubReq=await needClient().from('clubs').select('id,owner_id,name,slug,club_type,privacy,description,guidelines,discoverable,created_at,updated_at').eq('slug',slug).maybeSingle();
 if(clubReq.error)throw clubReq.error;
 const club=clubReq.data;if(!club)return null;
 const [members,posts,replies,polls,options,votes,chat,membershipRequest]=await Promise.all([
  needClient().from('club_members').select('club_id,user_id,role,status,joined_at,profiles!club_members_user_id_fkey(id,username,display_name,title,avatar_url)').eq('club_id',club.id).eq('status','active').order('joined_at',{ascending:true}),
  needClient().from('club_posts').select('id,club_id,author_id,post_type,title,body,status,created_at,updated_at,profiles!club_posts_author_id_fkey(id,username,display_name,title,avatar_url)').eq('club_id',club.id).eq('status','active').order('created_at',{ascending:false}).limit(40),
  needClient().from('club_post_replies').select('id,post_id,author_id,body,status,created_at,updated_at,profiles!club_post_replies_author_id_fkey(id,username,display_name,title,avatar_url)').eq('status','active').order('created_at',{ascending:true}).limit(200),
  needClient().from('club_polls').select('id,club_id,created_by,question,status,closes_at,created_at').eq('club_id',club.id).neq('status','archived').order('created_at',{ascending:false}).limit(20),
  needClient().from('club_poll_options').select('id,poll_id,label,position').order('position',{ascending:true}),
  needClient().from('club_poll_votes').select('poll_id,option_id,user_id,created_at'),
  needClient().from('club_chat_messages').select('id,club_id,author_id,body,status,created_at,profiles!club_chat_messages_author_id_fkey(id,username,display_name,title,avatar_url)').eq('club_id',club.id).eq('status','active').order('created_at',{ascending:false}).limit(80),
  needClient().from('club_membership_requests').select('id,club_id,requester_id,note,status,created_at,resolved_at').eq('club_id',club.id).eq('requester_id',userId).eq('status','pending').maybeSingle()
 ]);
 for(const r of[members,posts,replies,polls,options,votes,chat,membershipRequest])if(r.error)throw r.error;
 const postRows=posts.data||[],replyRows=replies.data||[],pollRows=polls.data||[],optionRows=options.data||[],voteRows=votes.data||[];
 const membership=(members.data||[]).find(m=>m.user_id===userId)||null;
 const memberIds=(members.data||[]).map(m=>m.user_id).filter(id=>id&&id!==userId);
 const identityIds=[...new Set([
  ...(members.data||[]).map(x=>x.user_id),...postRows.map(x=>x.author_id),...replyRows.map(x=>x.author_id),...(chat.data||[]).map(x=>x.author_id)
 ].filter(Boolean))];
 const identityMarks=await getIdentityMarks(identityIds);
 const wear=(profile,id)=>withIdentity(profile,id,identityMarks);
 let clubFollowingIds=new Set();
 if(memberIds.length){
  const followRows=await needClient().from('member_follows').select('followed_id').eq('follower_id',userId).in('followed_id',memberIds);
  if(followRows.error)throw followRows.error;
  clubFollowingIds=new Set((followRows.data||[]).map(x=>x.followed_id));
 }
 const clubPulse={
  members:(members.data||[]).length,
  discussions:postRows.length,
  open_polls:pollRows.filter(x=>x.status==='open').length,
  recent_messages:(chat.data||[]).length,
  last_activity_at:[...postRows.map(x=>x.created_at),...pollRows.map(x=>x.created_at),...(chat.data||[]).map(x=>x.created_at)].filter(Boolean).sort().at(-1)||null
 };
 return{
  club,
  membership,
  membershipRequest:membershipRequest.data||null,
  members:(members.data||[]).map(m=>({...m,profiles:wear(m.profiles,m.user_id),following:clubFollowingIds.has(m.user_id)})),
  pulse:clubPulse,
  posts:postRows.map(p=>({...p,profiles:wear(p.profiles,p.author_id),replies:replyRows.filter(r=>r.post_id===p.id).map(reply=>({...reply,profiles:wear(reply.profiles,reply.author_id)}))})),
  polls:pollRows.map(p=>{
   const opts=optionRows.filter(o=>o.poll_id===p.id).map(o=>({...o,vote_count:voteRows.filter(v=>v.poll_id===p.id&&v.option_id===o.id).length}));
   return{...p,options:opts,my_vote:voteRows.find(v=>v.poll_id===p.id&&v.user_id===userId)?.option_id||null,total_votes:voteRows.filter(v=>v.poll_id===p.id).length}
  }),
  chat:(chat.data||[]).reverse().map(x=>({...x,profiles:wear(x.profiles,x.author_id)}))
 }
}
export async function joinOpenClub(userId,clubId){
 const{data,error}=await needClient().from('club_members').insert({club_id:clubId,user_id:userId,role:'member',status:'active'}).select().single();
 if(error?.code==='23505'){const existing=await needClient().from('club_members').update({status:'active',role:'member',updated_at:new Date().toISOString()}).eq('club_id',clubId).eq('user_id',userId).select().single();if(existing.error)throw existing.error;return existing.data}
 if(error)throw error;return data
}
export async function createClubPost(userId,clubId,{title='',body,postType='discussion'}){
 const text=String(body||'').trim();if(!text)throw new Error('Write something before posting.');
 const{data,error}=await needClient().from('club_posts').insert({club_id:clubId,author_id:userId,title:String(title||'').trim(),body:text,post_type:postType,status:'active'}).select().single();
 if(error)throw error;return data
}
export async function replyToClubPost(userId,postId,body){
 const text=String(body||'').trim();if(!text)throw new Error('Write a reply first.');
 const{data,error}=await needClient().from('club_post_replies').insert({post_id:postId,author_id:userId,body:text,status:'active'}).select().single();
 if(error)throw error;return data
}
export async function getClubChatMessages(clubId,limit=80){
 const{data,error}=await needClient().from('club_chat_messages').select('id,club_id,author_id,body,status,created_at,profiles!club_chat_messages_author_id_fkey(id,username,display_name,title,avatar_url)').eq('club_id',clubId).eq('status','active').order('created_at',{ascending:false}).limit(Math.max(1,Math.min(120,Number(limit)||80)));
 if(error)throw error;const rows=(data||[]).reverse();const marks=await getIdentityMarks(rows.map(x=>x.author_id));return rows.map(x=>({...x,profiles:withIdentity(x.profiles,x.author_id,marks)}))
}
export async function postClubChat(userId,clubId,body){
 const text=String(body||'').trim();if(!text)throw new Error('Write a message first.');
 if(text.length>280)throw new Error('Club chat messages are limited to 280 characters.');
 const{data,error}=await needClient().from('club_chat_messages').insert({club_id:clubId,author_id:userId,body:text,status:'active'}).select().single();
 if(error)throw error;return data
}
export async function castClubPollVote(userId,pollId,optionId){
 const existing=await needClient().from('club_poll_votes').select('option_id').eq('poll_id',pollId).eq('user_id',userId).maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data?.option_id===optionId){
  const{error}=await needClient().from('club_poll_votes').delete().eq('poll_id',pollId).eq('user_id',userId);
  if(error)throw error;return null
 }
 if(existing.data){
  const{data,error}=await needClient().from('club_poll_votes').update({option_id:optionId}).eq('poll_id',pollId).eq('user_id',userId).select().single();
  if(error)throw error;return data
 }
 const{data,error}=await needClient().from('club_poll_votes').insert({poll_id:pollId,option_id:optionId,user_id:userId}).select().single();
 if(error)throw error;return data
}

export async function getPalaceLife(userId){
 const [clubs,threads,replies,forumPolls,forumPollOptions,forumPollVotes,chat,intros,clubInvites,clubRequests,myClubRequests,subscriptions,mutes,savedThreads,highlights,highlightChampions,communityIntros,introReactions,discovery,boundaries,follows]=await Promise.all([
  needClient().from('clubs').select('id,name,slug,club_type,privacy,description,club_members!inner(user_id,status,role)').eq('club_members.user_id',userId).eq('club_members.status','active').limit(24),
  needClient().from('forum_threads').select('id,author_id,title,body,room,created_at,updated_at,profiles!forum_threads_author_id_fkey(username,display_name,avatar_url,title)').eq('status','active').order('updated_at',{ascending:false}).limit(30),
  needClient().from('forum_replies').select('id,thread_id,author_id,body,status,created_at,updated_at,profiles!forum_replies_author_id_fkey(username,display_name,avatar_url,title)').eq('status','active').order('created_at',{ascending:true}).limit(240),
  needClient().from('forum_polls').select('id,thread_id,created_by,question,status,closes_at,created_at,closed_at').order('created_at',{ascending:false}).limit(60),
  needClient().from('forum_poll_options').select('id,poll_id,label,position').order('position',{ascending:true}).limit(360),
  needClient().from('forum_poll_votes').select('poll_id,option_id,user_id,created_at').limit(2000),
  needClient().from('public_chat_messages').select('id,author_id,body,created_at,profiles!public_chat_messages_author_id_fkey(username,display_name,avatar_url,title)').eq('status','active').order('created_at',{ascending:false}).limit(30),
  needClient().from('member_introductions').select('id,author_id,title,body,highlighted,created_at,profiles!member_introductions_author_id_fkey(id,username,display_name,avatar_url,title)').eq('status','active').order('created_at',{ascending:false}).limit(16),
  needClient().from('club_invitations').select('id,club_id,sender_id,recipient_id,note,status,created_at,clubs(id,name,slug,club_type,privacy),profiles!club_invitations_sender_id_fkey(id,username,display_name,avatar_url,title)').eq('recipient_id',userId).eq('status','pending').order('created_at',{ascending:false}).limit(12),
  needClient().from('club_membership_requests').select('id,club_id,requester_id,note,status,created_at,clubs(id,name,slug),profiles!club_membership_requests_requester_id_fkey(id,username,display_name,avatar_url,title)').eq('status','pending').order('created_at',{ascending:false}).limit(30),
  needClient().from('club_membership_requests').select('id,club_id,requester_id,note,status,created_at,resolved_at,clubs(id,name,slug,club_type,privacy)').eq('requester_id',userId).in('status',['pending','approved']).order('created_at',{ascending:false}).limit(30),
  needClient().from('forum_thread_subscriptions').select('thread_id').eq('user_id',userId),
  needClient().from('forum_thread_mutes').select('thread_id').eq('user_id',userId),
  needClient().from('forum_saved_threads').select('thread_id').eq('user_id',userId),
  needClient().from('community_highlights').select('id,member_id,created_by,reason,status,created_at,profiles!community_highlights_member_id_fkey(username,display_name,avatar_url,title)').in('status',['nominated','approved','featured']).order('created_at',{ascending:false}).limit(20),
  needClient().from('community_highlight_champions').select('highlight_id,user_id'),
  needClient().from('community_introductions').select('id,member_id,title,body,tags,visibility,created_at,profiles!community_introductions_member_id_fkey(username,display_name,avatar_url,title)').in('visibility',['public','members']).order('created_at',{ascending:false}).limit(20),
  needClient().from('community_introduction_reactions').select('introduction_id,user_id,reaction'),
  needClient().from('clubs').select('id,name,slug,club_type,privacy,description,owner_id,created_at').eq('discoverable',true).in('privacy',['open','request_to_join']).order('created_at',{ascending:false}).limit(24),
  needClient().from('user_member_boundaries').select('other_user_id,muted,blocked').eq('user_id',userId),
  needClient().from('member_follows').select('followed_id').eq('follower_id',userId)
 ]);
 for(const r of[clubs,threads,replies,forumPolls,forumPollOptions,forumPollVotes,chat,intros,clubInvites,clubRequests,myClubRequests,subscriptions,mutes,savedThreads,highlights,highlightChampions,communityIntros,introReactions,discovery,boundaries,follows])if(r.error)throw r.error;

 const quietMemberIds=new Set((boundaries.data||[]).filter(x=>x.muted||x.blocked).map(x=>x.other_user_id));
 const visibleThreads=(threads.data||[]).filter(x=>!quietMemberIds.has(x.author_id));
 const visibleReplies=(replies.data||[]).filter(x=>!quietMemberIds.has(x.author_id));
 const visibleChat=(chat.data||[]).filter(x=>!quietMemberIds.has(x.author_id));
 const visibleIntros=(intros.data||[]).filter(x=>!quietMemberIds.has(x.profiles?.id)&&!quietMemberIds.has(x.author_id));
 const visibleHighlights=(highlights.data||[]).filter(x=>!quietMemberIds.has(x.member_id));
 const visibleCommunityIntros=(communityIntros.data||[]).filter(x=>!quietMemberIds.has(x.member_id));
 const joined=clubs.data||[];
 const joinedIds=new Set(joined.map(c=>c.id));
 const discoverableClubs=(discovery.data||[]).filter(c=>!joinedIds.has(c.id));
 const stewardClubIds=joined.filter(c=>(c.club_members||[]).some(m=>m.role==='steward'||m.role==='owner')).map(c=>c.id);
 const stewardRequests=(clubRequests.data||[]).filter(r=>stewardClubIds.includes(r.club_id));
 const subSet=new Set((subscriptions.data||[]).map(x=>x.thread_id));
 const muteSet=new Set((mutes.data||[]).map(x=>x.thread_id));
 const saveSet=new Set((savedThreads.data||[]).map(x=>x.thread_id));
 const championRows=highlightChampions.data||[];
 const reactionRows=introReactions.data||[];
 const followingIds=new Set((follows.data||[]).map(x=>x.followed_id));
 const identityIds=[...new Set([
  ...visibleThreads.map(x=>x.author_id),...visibleReplies.map(x=>x.author_id),...visibleChat.map(x=>x.author_id),
  ...visibleIntros.map(x=>x.author_id),...visibleHighlights.map(x=>x.member_id),...visibleCommunityIntros.map(x=>x.member_id),
  ...(clubInvites.data||[]).map(x=>x.sender_id),...stewardRequests.map(x=>x.requester_id)
 ].filter(Boolean))];
 const identityMarks=await getIdentityMarks(identityIds);
 const wear=(profile,id)=>withIdentity(profile,id,identityMarks);
 const clubPulseIds=[...new Set([...joined.map(x=>x.id),...discoverableClubs.map(x=>x.id)])];
 let clubMemberRows=[],clubPostRows=[],clubPollRows=[],clubChatRows=[];
 if(clubPulseIds.length){
  const pulse=await Promise.all([
   needClient().from('club_members').select('club_id,user_id').in('club_id',clubPulseIds).eq('status','active').limit(2000),
   needClient().from('club_posts').select('club_id,created_at').in('club_id',clubPulseIds).eq('status','active').order('created_at',{ascending:false}).limit(1000),
   needClient().from('club_polls').select('club_id,status,created_at').in('club_id',clubPulseIds).neq('status','archived').order('created_at',{ascending:false}).limit(500),
   needClient().from('club_chat_messages').select('club_id,created_at').in('club_id',clubPulseIds).eq('status','active').order('created_at',{ascending:false}).limit(1000)
  ]);
  for(const r of pulse)if(r.error)throw r.error;
  [clubMemberRows,clubPostRows,clubPollRows,clubChatRows]=pulse.map(r=>r.data||[]);
 }
 const clubPulse=clubId=>{
  const posts=clubPostRows.filter(x=>x.club_id===clubId),polls=clubPollRows.filter(x=>x.club_id===clubId),chatRows=clubChatRows.filter(x=>x.club_id===clubId);
  const activity=[...posts.map(x=>x.created_at),...polls.map(x=>x.created_at),...chatRows.map(x=>x.created_at)].filter(Boolean).sort().at(-1)||null;
  return{
   member_count:clubMemberRows.filter(x=>x.club_id===clubId).length,
   discussion_count:posts.length,
   open_polls:polls.filter(x=>x.status==='open').length,
   recent_chat_count:chatRows.length,
   last_activity_at:activity
  }
 };

 return{
  clubs:joined.map(x=>({...x,pulse:clubPulse(x.id)})),
  discoverableClubs:discoverableClubs.map(x=>({...x,pulse:clubPulse(x.id)})),
  threads:visibleThreads.map(x=>{const threadReplies=visibleReplies.filter(r=>r.thread_id===x.id).map(reply=>({...reply,profiles:wear(reply.profiles,reply.author_id)}));const poll=(forumPolls.data||[]).find(p=>p.thread_id===x.id)||null;const options=poll?(forumPollOptions.data||[]).filter(o=>o.poll_id===poll.id).sort((a,b)=>a.position-b.position).map(o=>({...o,votes:(forumPollVotes.data||[]).filter(v=>v.option_id===o.id).length})):[];const myVote=poll?(forumPollVotes.data||[]).find(v=>v.poll_id===poll.id&&v.user_id===userId)?.option_id||null:null;return{...x,profiles:wear(x.profiles,x.author_id),subscribed:subSet.has(x.id),muted:muteSet.has(x.id),saved:saveSet.has(x.id),replies:threadReplies,reply_count:threadReplies.length,poll:poll?{...poll,options,my_vote:myVote,total_votes:(forumPollVotes.data||[]).filter(v=>v.poll_id===poll.id).length}:null}}),
  chat:visibleChat.reverse().map(x=>({...x,profiles:wear(x.profiles,x.author_id)})),
  introductions:visibleIntros.map(x=>({...x,profiles:wear(x.profiles,x.author_id)})),
  clubInvites:(clubInvites.data||[]).map(x=>({...x,profiles:wear(x.profiles,x.sender_id)})),
  myClubRequests:myClubRequests.data||[],
  stewardRequests:stewardRequests.map(x=>({...x,profiles:wear(x.profiles,x.requester_id)})),
  highlights:visibleHighlights.map(h=>({...h,profiles:wear(h.profiles,h.member_id),following:followingIds.has(h.member_id),champion_count:championRows.filter(x=>x.highlight_id===h.id).length,championed:championRows.some(x=>x.highlight_id===h.id&&x.user_id===userId)})),
  communityIntroductions:visibleCommunityIntros.map(i=>({...i,profiles:wear(i.profiles,i.member_id),following:followingIds.has(i.member_id),reaction_count:reactionRows.filter(x=>x.introduction_id===i.id).length,reacted:reactionRows.some(x=>x.introduction_id===i.id&&x.user_id===userId)}))
 }
}
export async function respondClubInvitation(userId,id,status){
 if(!['accepted','declined'].includes(status))throw new Error('Unknown invitation response.');
 const{data,error}=await needClient().from('club_invitations').update({status,resolved_at:new Date().toISOString()}).eq('id',id).eq('recipient_id',userId).eq('status','pending').select().single();
 if(error)throw error;
 if(status==='accepted'){
  const{error:joinError}=await needClient().from('club_members').upsert({club_id:data.club_id,user_id:userId,role:'member',status:'active'},{onConflict:'club_id,user_id'});
  if(joinError)throw joinError;
 }
 return data
}
export async function setForumThreadPreference(userId,threadId,type,enabled){
 const map={subscription:'forum_thread_subscriptions',mute:'forum_thread_mutes',saved:'forum_saved_threads'};
 const table=map[type];if(!table)throw new Error('Unknown forum preference.');
 if(enabled){
  const row={user_id:userId,thread_id:threadId};
  const{error}=await needClient().from(table).upsert(row,{onConflict:'user_id,thread_id'});if(error)throw error;
 }else{
  const{error}=await needClient().from(table).delete().eq('user_id',userId).eq('thread_id',threadId);if(error)throw error;
 }
 return enabled
}
export async function nominateCommunityHighlight(userId,memberId,reason){
 const text=String(reason||'').trim();
 if(!memberId)throw new Error('Choose a Palace member to recognise.');
 if(memberId===userId)throw new Error('Community Highlights are for recognising another member.');
 if(text.length<20)throw new Error('Tell the Palace a little more about why this member deserves recognition.');
 const existing=await needClient().from('community_highlights').select('id,status').eq('created_by',userId).eq('member_id',memberId).eq('status','nominated').maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data)throw new Error('You already have an open nomination for this member.');
 const{data,error}=await needClient().from('community_highlights').insert({member_id:memberId,created_by:userId,reason:text.slice(0,1000),status:'nominated'}).select().single();
 if(error)throw error;return data
}
export async function setCommunityHighlightChampion(userId,highlightId,enabled){
 if(enabled){const{error}=await needClient().from('community_highlight_champions').upsert({highlight_id:highlightId,user_id:userId},{onConflict:'highlight_id,user_id'});if(error)throw error}
 else{const{error}=await needClient().from('community_highlight_champions').delete().eq('highlight_id',highlightId).eq('user_id',userId);if(error)throw error}
 return enabled
}
export async function saveCommunityIntroduction(userId,{title,body,tags=[],visibility='members'}={}){
 const cleanTitle=String(title||'').trim();const cleanBody=String(body||'').trim();
 if(cleanTitle.length<3)throw new Error('Give your introduction a short title.');
 if(cleanBody.length<20)throw new Error('Tell the Palace a little more before sharing your introduction.');
 const cleanTags=(Array.isArray(tags)?tags:String(tags||'').split(',')).map(x=>String(x||'').trim()).filter(Boolean).slice(0,8).map(x=>x.slice(0,36));
 const cleanVisibility=['public','members'].includes(visibility)?visibility:'members';
 const existing=await needClient().from('community_introductions').select('id').eq('member_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(existing.error)throw existing.error;
 const payload={member_id:userId,title:cleanTitle.slice(0,120),body:cleanBody.slice(0,1800),tags:cleanTags,visibility:cleanVisibility,updated_at:new Date().toISOString()};
 if(existing.data?.id){
  const{data,error}=await needClient().from('community_introductions').update(payload).eq('id',existing.data.id).eq('member_id',userId).select().single();
  if(error)throw error;return data
 }
 const{data,error}=await needClient().from('community_introductions').insert(payload).select().single();
 if(error)throw error;return data
}
export async function deleteCommunityIntroduction(userId,introductionId){
 const{error}=await needClient().from('community_introductions').delete().eq('id',introductionId).eq('member_id',userId);
 if(error)throw error;return true
}
export async function setIntroductionReaction(userId,introductionId,enabled){
 if(enabled){const{error}=await needClient().from('community_introduction_reactions').upsert({introduction_id:introductionId,user_id:userId,reaction:'star'},{onConflict:'introduction_id,user_id'});if(error)throw error}
 else{const{error}=await needClient().from('community_introduction_reactions').delete().eq('introduction_id',introductionId).eq('user_id',userId);if(error)throw error}
 return enabled
}
export async function getMoonlightMessages(limit=50){
 const{data,error}=await needClient().from('public_chat_messages').select('id,author_id,body,created_at,profiles!public_chat_messages_author_id_fkey(username,display_name,avatar_url,title)').eq('status','active').order('created_at',{ascending:false}).limit(Math.max(1,Math.min(100,Number(limit)||50)));
 if(error)throw error;const rows=(data||[]).reverse();const marks=await getIdentityMarks(rows.map(x=>x.author_id));return rows.map(x=>({...x,profiles:withIdentity(x.profiles,x.author_id,marks)}))
}
export async function postMoonlight(userId,body){const text=body.trim();if(!text)throw new Error('Write something before sending it into the room.');if(text.length>500)throw new Error('Moonlight messages are limited to 500 characters.');const{data,error}=await needClient().from('public_chat_messages').insert({author_id:userId,body:text,status:'active'}).select().single();if(error)throw error;return data}
export async function createForumThread(userId,title,body,room='Palace Commons'){const cleanTitle=String(title||'').trim();const cleanBody=String(body||'').trim();const cleanRoom=String(room||'Palace Commons').trim();if(!cleanTitle||!cleanBody)throw new Error('Give the conversation a title and opening thought.');const{data,error}=await needClient().from('forum_threads').insert({author_id:userId,title:cleanTitle.slice(0,120),body:cleanBody.slice(0,4000),room:cleanRoom.slice(0,80)||'Palace Commons'}).select().single();if(error)throw error;return data}
export async function replyForumThread(userId,threadId,body){
 const text=String(body||'').trim();if(!text)throw new Error('Write a reply first.');if(text.length>2400)throw new Error('Forum replies are limited to 2,400 characters.');
 const{data,error}=await needClient().from('forum_replies').insert({thread_id:threadId,author_id:userId,body:text,status:'active'}).select().single();if(error)throw error;return data
}
export async function deleteOwnForumThread(userId,threadId){
 const{error}=await needClient().from('forum_threads').delete().eq('id',threadId).eq('author_id',userId);
 if(error)throw error;return true
}
export async function createForumPoll(userId,threadId,question,options=[]){
 const cleanQuestion=String(question||'').trim();
 const cleanOptions=(Array.isArray(options)?options:[]).map(x=>String(x||'').trim()).filter(Boolean).slice(0,6);
 if(!cleanQuestion)throw new Error('Give the poll a question.');
 if(cleanOptions.length<2)throw new Error('Add at least two poll choices.');
 const{data:poll,error}=await needClient().from('forum_polls').insert({thread_id:threadId,created_by:userId,question:cleanQuestion.slice(0,240),status:'open'}).select().single();
 if(error)throw error;
 const rows=cleanOptions.map((label,i)=>({poll_id:poll.id,label:label.slice(0,120),position:i+1}));
 const{error:optionsError}=await needClient().from('forum_poll_options').insert(rows);
 if(optionsError){await needClient().from('forum_polls').delete().eq('id',poll.id).eq('created_by',userId);throw optionsError}
 return poll
}
export async function castForumPollVote(userId,pollId,optionId){
 const existing=await needClient().from('forum_poll_votes').select('option_id').eq('poll_id',pollId).eq('user_id',userId).maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data?.option_id===optionId){
  const{error}=await needClient().from('forum_poll_votes').delete().eq('poll_id',pollId).eq('user_id',userId);
  if(error)throw error;return null
 }
 if(existing.data){
  const{data,error}=await needClient().from('forum_poll_votes').update({option_id:optionId}).eq('poll_id',pollId).eq('user_id',userId).select().single();
  if(error)throw error;return data
 }
 const{data,error}=await needClient().from('forum_poll_votes').insert({poll_id:pollId,option_id:optionId,user_id:userId}).select().single();
 if(error)throw error;return data
}
export async function closeForumPoll(userId,pollId){
 const{data,error}=await needClient().from('forum_polls').update({status:'closed',closed_at:new Date().toISOString()}).eq('id',pollId).eq('created_by',userId).select().single();
 if(error)throw error;return data
}
export async function requestClubMembership(userId,clubId,note=''){
 const existing=await needClient().from('club_membership_requests').select('id,status,created_at').eq('club_id',clubId).eq('requester_id',userId).eq('status','pending').maybeSingle();
 if(existing.error)throw existing.error;if(existing.data)return existing.data;
 const{data,error}=await needClient().from('club_membership_requests').insert({club_id:clubId,requester_id:userId,note:String(note||'').trim().slice(0,600),status:'pending'}).select().single();if(error)throw error;return data
}
export async function withdrawClubMembershipRequest(userId,id){
 const{data,error}=await needClient().from('club_membership_requests').update({status:'withdrawn',resolved_at:new Date().toISOString()}).eq('id',id).eq('requester_id',userId).eq('status','pending').select().single();if(error)throw error;return data
}
export async function respondClubMembershipRequest(userId,id,status){
 if(!['approved','declined'].includes(status))throw new Error('Unknown membership decision.');
 const{data,error}=await needClient().from('club_membership_requests').update({status,resolved_by:userId,resolved_at:new Date().toISOString()}).eq('id',id).eq('status','pending').select().single();if(error)throw error;return data
}
export async function getLetters(userId){
 const [members,requests,prefs]=await Promise.all([
  needClient().from('conversation_members').select('conversation_id,joined_at,conversations(id,kind,status,last_message_at,direct_user_a,direct_user_b)').eq('user_id',userId).is('left_at',null),
  needClient().from('message_requests').select('id,sender_id,recipient_id,intro_text,status,created_at,profiles!message_requests_sender_id_fkey(username,display_name,avatar_url,title)').eq('recipient_id',userId).eq('status','pending').order('created_at',{ascending:false}),
  needClient().from('conversation_preferences').select('*').eq('user_id',userId)
 ]);
 for(const r of[members,requests,prefs])if(r.error)throw r.error;
 const conversations=members.data||[];
 const ids=conversations.map(x=>x.conversation_id);
 let messages=[];
 if(ids.length){
  const r=await needClient().from('messages').select('id,conversation_id,sender_id,body,created_at,status').in('conversation_id',ids).eq('status','active').order('created_at',{ascending:false}).limit(100);
  if(r.error)throw r.error;
  messages=r.data||[];
 }
 const otherIds=[...new Set(conversations.map(c=>{
  const conv=c.conversations;
  if(conv?.kind!=='direct')return null;
  return conv.direct_user_a===userId?conv.direct_user_b:conv.direct_user_a;
 }).filter(Boolean))];
 let people=[];
 if(otherIds.length){
  const p=await needClient().from('profiles').select('id,username,display_name,title,avatar_url,message_policy').in('id',otherIds);
  if(p.error)throw p.error;
  people=p.data||[];
 }
 const personMap=Object.fromEntries(people.map(p=>[p.id,p]));
 const prefMap=Object.fromEntries((prefs.data||[]).map(p=>[p.conversation_id,p]));
 return{
  conversations:conversations.map(c=>{
   const conv=c.conversations;
   const otherId=conv?.kind==='direct'?(conv.direct_user_a===userId?conv.direct_user_b:conv.direct_user_a):null;
   const preference=prefMap[c.conversation_id]||{starred:false,archived:false,muted:false,last_read_at:null};
   const latest=messages.find(m=>m.conversation_id===c.conversation_id)||null;
   const unread=!!(latest&&latest.sender_id!==userId&&(!preference.last_read_at||new Date(latest.created_at)>new Date(preference.last_read_at)));
   return{...c,correspondent:otherId?personMap[otherId]||null:null,preference,latest_message:latest,unread}
  }),
  requests:requests.data||[],
  messages
 }
}
export async function sendLetter(userId,conversationId,body){const text=body.trim();if(!text)throw new Error('Your letter is empty.');const{data,error}=await needClient().from('messages').insert({conversation_id:conversationId,sender_id:userId,body:text}).select().single();if(error)throw error;return data}
export async function respondToLetterRequest(userId,requestId,status){if(!['accepted','declined'].includes(status))throw new Error('Unknown request response.');const{error}=await needClient().from('message_requests').update({status,resolved_at:new Date().toISOString()}).eq('id',requestId).eq('recipient_id',userId).eq('status','pending');if(error)throw error}
export async function requestPalaceLetter(userId,recipientId,introText=''){
 const text=introText.trim();const{data,error}=await needClient().from('message_requests').insert({sender_id:userId,recipient_id:recipientId,intro_text:text||'A Palace member would like to begin a correspondence.'}).select('id,status,conversation_id,recipient_id,created_at').single();if(error)throw error;return data
}
export async function reportConversation(userId,conversationId,reportedUserId,reason){
 const text=reason.trim();if(!text)throw new Error('Tell the Council what happened first.');const{data,error}=await needClient().from('conversation_reports').insert({reporter_id:userId,conversation_id:conversationId,reported_user_id:reportedUserId,reason:text,status:'open'}).select().single();if(error)throw error;return data
}

export async function submitCommunityReport(userId,targetKind,targetId,reason,evidence={}){
 const text=String(reason||'').trim();
 if(!text)throw new Error('Tell the Council what happened first.');
 const{data,error}=await needClient().from('community_reports').insert({
  reporter_id:userId,
  target_kind:String(targetKind),
  target_id:String(targetId),
  reason:text,
  evidence:evidence&&typeof evidence==='object'?evidence:{},
  status:'submitted'
 }).select().single();
 if(error)throw error;return data
}



export async function getEventsHeritage(userId){const [events,heritage,rsvps,saved]=await Promise.all([needClient().from('events').select('id,title,slug,event_type,summary,starts_at,ends_at,timezone,access_level,participation,accessibility_notes').eq('publication_status','published').order('starts_at',{ascending:true}).limit(30),needClient().from('heritage_observances').select('id,title,slug,summary,why_in_palace,observance_type,community_key,country_code,region_key,month,day,end_month,end_day,recurring,year,context_notes').in('editorial_status',['verified','published']).order('month').order('day').limit(250),userId?needClient().from('event_rsvps').select('event_id,status').eq('user_id',userId):Promise.resolve({data:[],error:null}),userId?needClient().from('user_heritage_calendar').select('observance_id,saved,reminder_enabled').eq('user_id',userId).eq('saved',true):Promise.resolve({data:[],error:null})]);for(const r of[events,heritage,rsvps,saved])if(r.error)throw r.error;return{events:events.data||[],heritage:heritage.data||[],rsvps:rsvps.data||[],saved:saved.data||[]}}
export async function getEventProposals(userId){if(!userId)return[];const{data,error}=await needClient().from('event_proposals').select('id,proposer_id,title,proposal_type,summary,proposed_start,proposed_end,timezone,audience,accessibility_plan,purpose,status,council_note,created_at,event_proposal_champions(user_id)').neq('status','withdrawn').order('created_at',{ascending:false}).limit(40);if(error)throw error;return(data||[]).map(p=>({...p,champion_count:p.event_proposal_champions?.length||0,championed:p.event_proposal_champions?.some(x=>x.user_id===userId)}))}
export async function createEventProposal(userId,proposal){const{data,error}=await needClient().from('event_proposals').insert({proposer_id:userId,title:proposal.title.trim(),proposal_type:proposal.proposal_type,summary:proposal.summary.trim(),proposed_start:proposal.proposed_start||null,proposed_end:proposal.proposed_end||null,timezone:proposal.timezone||'UTC',audience:proposal.audience?.trim()||'',accessibility_plan:proposal.accessibility_plan?.trim()||'',purpose:proposal.purpose?.trim()||'',status:'gathering_champions'}).select().single();if(error)throw error;return data}
export async function setProposalChampion(userId,proposalId,champion){if(champion){const{error}=await needClient().from('event_proposal_champions').insert({proposal_id:proposalId,user_id:userId});if(error&&error.code!=='23505')throw error}else{const{error}=await needClient().from('event_proposal_champions').delete().eq('proposal_id',proposalId).eq('user_id',userId);if(error)throw error}}
export async function setEventRsvp(userId,eventId,status='going'){const{error}=await needClient().from('event_rsvps').upsert({user_id:userId,event_id:eventId,status,updated_at:new Date().toISOString()},{onConflict:'event_id,user_id'});if(error)throw error}
export async function saveHeritage(userId,observanceId){const{error}=await needClient().from('user_heritage_calendar').upsert({user_id:userId,observance_id:observanceId,saved:true,updated_at:new Date().toISOString()},{onConflict:'user_id,observance_id'});if(error)throw error}
export async function getCouncilRoom(userId){const [role,reports,archive,proposals,conversation,honour]=await Promise.all([needClient().rpc('is_council_member'),needClient().from('community_reports').select('id,reporter_id,target_kind,target_id,reason,status,created_at,resolved_at,review_note').order('created_at',{ascending:false}).limit(40),needClient().from('archive_review_requests').select('id,record_id,requester_id,request_type,summary,requested_language,status,council_note,created_at,reviewed_at').order('created_at',{ascending:false}).limit(40),needClient().from('event_proposals').select('id,proposer_id,title,proposal_type,summary,status,council_note,created_at,reviewed_at').in('status',['council_review','accepted','declined']).order('created_at',{ascending:false}).limit(40),needClient().from('conversation_reports').select('id,reporter_id,conversation_id,reported_user_id,reason,status,created_at,resolved_at').eq('reporter_id',userId).order('created_at',{ascending:false}).limit(30),needClient().from('honour_recommendations').select('id,nominator_id,author_name,work_title,reason,status,council_note,created_at,reviewed_at').order('created_at',{ascending:false}).limit(40)]);for(const r of[role,reports,archive,proposals,conversation,honour])if(r.error)throw r.error;return{isCouncil:!!role.data,reports:reports.data||[],archive:archive.data||[],proposals:proposals.data||[],conversation:conversation.data||[],honour:honour.data||[]}}
export async function reviewCommunityReport(id,status,review_note=''){const{data,error}=await needClient().from('community_reports').update({status,review_note,resolved_at:['resolved','dismissed'].includes(status)?new Date().toISOString():null}).eq('id',id).select().single();if(error)throw error;return data}
export async function reviewArchiveRequest(id,status,council_note=''){const{data,error}=await needClient().from('archive_review_requests').update({status,council_note,reviewed_at:['accepted','declined','closed'].includes(status)?new Date().toISOString():null}).eq('id',id).select().single();if(error)throw error;return data}
export async function reviewEventProposal(id,status,council_note=''){
 if(!['council_review','accepted','declined'].includes(status))throw new Error('Unknown proposal review status.');
 const{data,error}=await needClient().from('event_proposals').update({
  status,
  council_note,
  reviewed_at:['accepted','declined'].includes(status)?new Date().toISOString():null
 }).eq('id',id).select().single();
 if(error)throw error;
 return data
}

export async function getHonour(userId){
 const [periodsReq,recommendationsReq]=await Promise.all([
  needClient().from('monthly_court_periods').select('id,month_start,category,status,finalized_at').order('month_start',{ascending:false}).limit(12),
  needClient().from('honour_recommendations').select('id,nominator_id,author_name,work_title,reason,status,council_note,created_at,reviewed_at').order('created_at',{ascending:false}).limit(30)
 ]);
 if(periodsReq.error)throw periodsReq.error;if(recommendationsReq.error)throw recommendationsReq.error;
 const ids=(periodsReq.data||[]).map(p=>p.id);let rankings=[];if(ids.length){const r=await needClient().from('monthly_court_rankings').select('period_id,user_id,rank,score,calculated_at,profiles!monthly_court_rankings_user_id_fkey(username,display_name,title,avatar_url)').in('period_id',ids).order('rank');if(r.error)throw r.error;rankings=r.data||[]}
 let pref=null;if(userId){const pr=await needClient().from('ranking_preferences').select('*').eq('user_id',userId).maybeSingle();if(pr.error)throw pr.error;pref=pr.data;if(!pref){const made=await needClient().from('ranking_preferences').insert({user_id:userId}).select().single();if(made.error)throw made.error;pref=made.data}}
 return{periods:periodsReq.data||[],rankings,preferences:pref,recommendations:recommendationsReq.data||[]}
}
export async function updateRankingPreferences(userId,patch){const{data,error}=await needClient().from('ranking_preferences').upsert({user_id:userId,...patch,updated_at:new Date().toISOString()},{onConflict:'user_id'}).select().single();if(error)throw error;return data}
export async function createHonourRecommendation(userId,{authorName,workTitle='',reason}){
 const author=String(authorName||'').trim();const note=String(reason||'').trim();const work=String(workTitle||'').trim();
 if(author.length<2)throw new Error('Name the author or creator you are recommending.');
 if(note.length<20)throw new Error('Explain the recommendation in at least 20 characters.');
 const{data,error}=await needClient().from('honour_recommendations').insert({nominator_id:userId,author_name:author,work_title:work||null,reason:note,status:'submitted'}).select().single();
 if(error)throw error;return data
}
export async function withdrawHonourRecommendation(userId,id){
 const{error}=await needClient().from('honour_recommendations').delete().eq('id',id).eq('nominator_id',userId).eq('status','submitted');if(error)throw error;return true
}
export async function reviewHonourRecommendation(id,status,councilNote=''){
 if(!['reviewing','accepted','declined','published'].includes(status))throw new Error('Unknown Honour recommendation status.');
 const{data,error}=await needClient().from('honour_recommendations').update({status,council_note:String(councilNote||'').trim()||null,reviewed_at:['accepted','declined','published'].includes(status)?new Date().toISOString():null}).eq('id',id).select().single();
 if(error)throw error;return data
}

export async function getTreasury(userId){const [ach,gifts,showA,showG,pref,profile]=await Promise.all([needClient().from('user_achievement_progress').select('current_value,bronze_unlocked_at,silver_unlocked_at,gold_unlocked_at,platinum_unlocked_at,emerald_unlocked_at,achievement_families(id,name,description,thresholds,art_status,catalogue_number)').eq('user_id',userId),needClient().from('user_gift_inventory').select('tier,copies,virtual_gifts(id,gift_key,name,description,court_name,catalogue_number,art_status,upgrade_copies)').eq('user_id',userId).gt('copies',0),needClient().from('profile_achievement_showcase').select('achievement_id,display_tier,position').eq('user_id',userId).order('position'),needClient().from('profile_gift_showcase').select('gift_id,display_tier,position').eq('user_id',userId).order('position'),needClient().from('ranking_preferences').select('*').eq('user_id',userId).maybeSingle(),needClient().from('profiles').select('id,username,display_name,title').eq('id',userId).maybeSingle()]);for(const r of[ach,gifts,showA,showG,pref,profile])if(r.error)throw r.error;return{profile:profile.data||null,achievements:ach.data||[],gifts:gifts.data||[],achievementShowcase:showA.data||[],giftShowcase:showG.data||[],rankingPreferences:pref.data}}

export async function getGiftCatalogue(){
 const{data,error,count}=await needClient().from('virtual_gifts').select('id,gift_key,catalogue_number,name,description,court_name,collection_type,art_status,upgrade_copies',{count:'exact'}).eq('catalogue_status','catalogued').eq('reward_eligible',true).order('catalogue_number');
 if(error)throw error;return{items:data||[],count:count||data?.length||0}
}
export async function ascendPalaceGift(giftId,fromTier){
 const{data,error}=await needClient().rpc('ascend_palace_gift',{p_gift_id:giftId,p_from_tier:fromTier});if(error)throw error;return data?.[0]||null
}
export async function setProfileGiftShowcase(giftId,displayTier,position,userId=null){
 const{data,error}=await needClient().rpc('set_profile_gift_showcase',{p_gift_id:giftId,p_display_tier:displayTier,p_position:position});if(error)throw error;if(userId)identityMarkCache.delete(userId);return data
}
export async function removeProfileGiftShowcase(giftId){
 const{data,error}=await needClient().rpc('remove_profile_gift_showcase',{p_gift_id:giftId});if(error)throw error;return data
}
export async function getGiftTrades(userId){
 const offers=await needClient().from('gift_trade_offers').select('id,offerer_id,recipient_id,offered_gift_id,offered_tier,requested_gift_id,requested_tier,note,status,created_at,resolved_at').or(`offerer_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:false}).limit(50);
 if(offers.error)throw offers.error;
 const rows=offers.data||[];if(!rows.length)return[];
 const profileIds=[...new Set(rows.flatMap(x=>[x.offerer_id,x.recipient_id]))];
 const giftIds=[...new Set(rows.flatMap(x=>[x.offered_gift_id,x.requested_gift_id]))];
 const[profiles,gifts]=await Promise.all([
  needClient().from('profiles').select('id,username,display_name,avatar_url,visibility').in('id',profileIds),
  needClient().from('virtual_gifts').select('id,gift_key,name,catalogue_number,court_name,collection_type').in('id',giftIds)
 ]);
 if(profiles.error)throw profiles.error;if(gifts.error)throw gifts.error;
 const pmap=Object.fromEntries((profiles.data||[]).map(x=>[x.id,x]));const gmap=Object.fromEntries((gifts.data||[]).map(x=>[x.id,x]));
 return rows.map(x=>({...x,offerer:pmap[x.offerer_id]||null,recipient:pmap[x.recipient_id]||null,offeredGift:gmap[x.offered_gift_id]||null,requestedGift:gmap[x.requested_gift_id]||null}))
}
export async function createGiftTradeOffer({recipientId,offeredGiftId,offeredTier,requestedGiftId,requestedTier,note=''}) {
 const{data,error}=await needClient().rpc('create_gift_trade_offer',{p_recipient:recipientId,p_offered_gift:offeredGiftId,p_offered_tier:offeredTier,p_requested_gift:requestedGiftId,p_requested_tier:requestedTier,p_note:note});if(error)throw error;return data
}
export async function respondGiftTradeOffer(offerId,action){
 const{data,error}=await needClient().rpc('respond_gift_trade_offer',{p_offer_id:offerId,p_action:action});if(error)throw error;return data
}
export async function setProfileAchievementShowcase(achievementId,displayTier,position,userId=null){
 const{data,error}=await needClient().rpc('set_profile_achievement_showcase',{p_achievement_id:achievementId,p_display_tier:displayTier,p_position:position});if(error)throw error;if(userId)identityMarkCache.delete(userId);return data
}
export async function removeProfileAchievementShowcase(achievementId){
 const{data,error}=await needClient().rpc('remove_profile_achievement_showcase',{p_achievement_id:achievementId});if(error)throw error;return data
}
export async function getArchive(userId=null){
 const{data,error}=await needClient().from('archive_records').select('id,accession_number,slug,title,creator_name,record_nature,category,summary,original_language,languages,surviving_extent,known_gaps,provenance_summary,rights_status,hosting_basis,host_mode,continuation_status,verified_at,updated_at').eq('publication_status','published').order('updated_at',{ascending:false}).limit(250);
 if(error)throw error;const rows=data||[];if(!rows.length)return rows;
 // Read only citation metadata, never the potentially large hosted text.
 // A cover lookup problem must not prevent the archive from opening.
 let sources=new Map();
 try{
  const result=await needClient().from('archive_texts').select('record_id,source_url').in('record_id',rows.map(r=>r.id));
  if(!result.error)sources=new Map((result.data||[]).map(r=>[r.record_id,r.source_url]));
 }catch{}
 const illustrated=rows.map(r=>({...r,archive_source_url:sources.get(r.id)||null}));
 if(!userId)return illustrated;
 const saved=await needClient().from('user_archive_records').select('record_id,saved,visited_at').eq('user_id',userId).eq('saved',true);
 if(saved.error)throw saved.error;const byId=new Map((saved.data||[]).map(x=>[x.record_id,x]));
 return illustrated.map(r=>({...r,saved:byId.has(r.id),visited_at:byId.get(r.id)?.visited_at||null}))
}
export async function getArchiveText(recordId){
 const[{data,error},{data:translations,error:translationError}]=await Promise.all([
  needClient().from('archive_texts').select('record_id,body_text,source_url,source_title,source_license,edition_note,first_publication_year,word_count,updated_at').eq('record_id',recordId).maybeSingle(),
  needClient().from('archive_translation_records').select('language,translator_name,scope,rights_basis,status,notes').eq('record_id',recordId).in('status',['approved','published']).order('created_at',{ascending:true})
 ]);
 if(error)throw error;if(translationError)throw translationError;return data?{...data,translations:translations||[]}:null
}
export async function saveArchiveRecord(userId,recordId){const{error}=await needClient().from('user_archive_records').upsert({user_id:userId,record_id:recordId,saved:true,visited_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,record_id'});if(error)throw error}
export async function setArchiveRecordSaved(userId,recordId,saved){
 const{data,error}=await needClient().from('user_archive_records').upsert({user_id:userId,record_id:recordId,saved:!!saved,visited_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,record_id'}).select('record_id,saved,visited_at').single();
 if(error)throw error;return data
}

export async function getProfilePosts(authorId){
 const{data,error}=await needClient().from('profile_posts').select('id,author_id,body,visibility,status,created_at,updated_at').eq('author_id',authorId).eq('status','active').order('created_at',{ascending:false}).limit(24);
 if(error)throw error;return data||[]
}
export async function createProfilePost(userId,body,visibility='followers'){
 const text=String(body||'').trim();
 if(!text)throw new Error('Write something before posting.');
 const{data,error}=await needClient().from('profile_posts').insert({author_id:userId,body:text,visibility}).select().single();
 if(error)throw error;return data
}
export async function deleteProfilePost(userId,id){
 const{error}=await needClient().from('profile_posts').delete().eq('id',id).eq('author_id',userId);
 if(error)throw error
}
export async function getFollowingProfilePosts(userId){
 const[follows,boundaries]=await Promise.all([
  needClient().from('member_follows').select('followed_id').eq('follower_id',userId),
  needClient().from('user_member_boundaries').select('other_user_id,muted,blocked').eq('user_id',userId)
 ]);
 if(follows.error)throw follows.error;if(boundaries.error)throw boundaries.error;
 const quiet=new Set((boundaries.data||[]).filter(x=>x.muted||x.blocked).map(x=>x.other_user_id));
 const ids=(follows.data||[]).map(x=>x.followed_id).filter(id=>!quiet.has(id));
 if(!ids.length)return[];
 const posts=await needClient().from('profile_posts').select('id,author_id,body,visibility,created_at,updated_at,profiles!profile_posts_author_id_fkey(id,username,display_name,title,avatar_url)').in('author_id',ids).eq('status','active').order('created_at',{ascending:false}).limit(30);
 if(posts.error)throw posts.error;return posts.data||[]
}

export async function getMemberProfile(username,viewerId){
 const{data:profile,error}=await needClient().from('profiles').select('id,username,display_name,title,bio,avatar_url,cover_url,visibility,message_policy,pronouns,status_line,availability,roles,featured_genres,featured_fandoms,accent,cover_position,support_enabled,support_label,support_url').eq('username',username).maybeSingle();
 if(error)throw error;if(!profile)return null;
 const own=viewerId===profile.id;
 // Public Chambers must not expose private series or member-only series to guests.
 const seriesVisibilities=own?['public','members','private']:viewerId?['public','members']:['public'];
 const {data:grandIdentity}=await needClient().rpc('get_grand_palace_identity',{p_member:profile.id});
 const [privacy,works,comics,series,workTotal,comicTotal,seriesTotal,follow,counting,clubCount,showA,showG]=await Promise.all([
  own?getMyPrivacy(profile.id):Promise.resolve(null),
  needClient().from('works').select('id,title,slug,summary,cover_url,rating,completion_status,last_published_at').eq('author_id',profile.id).eq('publication_status','published').order('last_published_at',{ascending:false}).limit(12),
  needClient().from('comics').select('id,title,slug,summary,completion_status,cover_path,last_published_at').eq('creator_id',profile.id).eq('publication_status','published').order('last_published_at',{ascending:false}).limit(12),
  needClient().from('series').select('id,title,slug,summary,visibility,updated_at,series_works(work_id,position,works(id,title,slug,publication_status,completion_status))').eq('owner_id',profile.id).in('visibility',seriesVisibilities).order('updated_at',{ascending:false}).limit(12),
  needClient().from('works').select('id',{count:'exact',head:true}).eq('author_id',profile.id).eq('publication_status','published'),
  needClient().from('comics').select('id',{count:'exact',head:true}).eq('creator_id',profile.id).eq('publication_status','published'),
  needClient().from('series').select('id',{count:'exact',head:true}).eq('owner_id',profile.id).in('visibility',seriesVisibilities),
  viewerId&&!own?needClient().from('member_follows').select('followed_id').eq('follower_id',viewerId).eq('followed_id',profile.id).maybeSingle():Promise.resolve({data:null,error:null}),
  needClient().from('member_follows').select('follower_id',{count:'exact',head:true}).eq('followed_id',profile.id),
  needClient().from('club_members').select('club_id',{count:'exact',head:true}).eq('user_id',profile.id).eq('status','active'),
  needClient().from('profile_achievement_showcase').select('achievement_id,display_tier,position,achievement_families(id,name,description,catalogue_number,art_status)').eq('user_id',profile.id).order('position'),
  needClient().from('profile_gift_showcase').select('gift_id,display_tier,position,virtual_gifts(id,gift_key,name,description,court_name,catalogue_number,art_status)').eq('user_id',profile.id).order('position')
 ]);
 for(const r of[works,comics,series,workTotal,comicTotal,seriesTotal,follow,counting,clubCount,showA,showG])if(r.error)throw r.error;
 const signedComics=await Promise.all((comics.data||[]).map(async comic=>({...comic,cover_url:await signedAsset('comic-covers',comic.cover_path)})));
 const visibleSeries=(series.data||[]).map(s=>({...s,series_works:(s.series_works||[]).filter(x=>x.works?.publication_status==='published').sort((a,b)=>a.position-b.position)}));
 return{
  profile,grandIdentity:grandIdentity||null,privacy:privacy||null,works:works.data||[],comics:signedComics,series:visibleSeries,following:!!follow.data,followerCount:counting.count||0,
  showcase:{achievements:showA.data||[],gifts:showG.data||[]},
  counts:{works:workTotal.count||0,comics:comicTotal.count||0,series:seriesTotal.count||0,clubs:clubCount.count||0,honours:(showA.data?.length||0)+(showG.data?.length||0)}
 }
}
export async function setFollow(viewerId,memberId,follow){if(follow){const{error}=await needClient().from('member_follows').insert({follower_id:viewerId,followed_id:memberId});if(error)throw error}else{const{error}=await needClient().from('member_follows').delete().eq('follower_id',viewerId).eq('followed_id',memberId);if(error)throw error}}
export async function searchMembers(term){
 const q=term.trim();if(!q)return[];
 const{data,error}=await needClient().from('profiles').select('id,username,display_name,title,avatar_url,visibility').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq('visibility','hidden').limit(20);
 if(error)throw error;return data||[]
}
function palaceSearchSafe(value=''){
 return String(value||'').replace(/[,%_():;"'\\]/g,' ').replace(/\s+/g,' ').trim()
}
function palaceSearchConcepts(value=''){
 const raw=String(value||'').trim();
 const quoted=[...raw.matchAll(/"([^"]+)"/g)].map(m=>palaceSearchSafe(m[1])).filter(x=>x.length>1);
 const rest=raw.replace(/"[^"]+"/g,' ');
 const stop=new Set(['the','a','an','and','or','of','to','in','on','at','for','with','from','by','about','into','is','are','be']);
 const words=rest.split(/\s+/).map(palaceSearchSafe).filter(x=>x.length>1&&!stop.has(x.toLowerCase()));
 return [...new Set([...quoted,...words].map(x=>x.toLowerCase()))].slice(0,6)
}
function palaceSearchOr(fields=[],terms=[]){
 return terms.flatMap(term=>fields.map(field=>field+'.ilike.%'+palaceSearchSafe(term)+'%')).join(',')
}
function mergePalaceTagGroups(groups=[],concepts=[],phrase=''){
 const byId=new Map();
 groups.forEach((rows,index)=>{
  const concept=index===0?null:concepts[index-1];
  for(const tag of rows||[]){
   const current=byId.get(tag.id)||{...tag,matched_concepts:[],phrase_match:false,match_score:Number(tag.match_score||0)};
   const matched=new Set(current.matched_concepts||[]);
   if(concept)matched.add(concept);
   current.matched_concepts=[...matched];
   current.phrase_match=current.phrase_match||index===0;
   current.match_score=Math.max(Number(current.match_score||0),Number(tag.match_score||0)+(index===0?12:0));
   current.usage_count=Math.max(Number(current.usage_count||0),Number(tag.usage_count||0));
   byId.set(tag.id,current);
  }
 });
 return [...byId.values()].sort((a,b)=>
  (b.matched_concepts?.length||0)-(a.matched_concepts?.length||0)
  ||Number(b.match_score||0)-Number(a.match_score||0)
  ||Number(b.usage_count||0)-Number(a.usage_count||0)
  ||String(a.name||'').localeCompare(String(b.name||''))
 ).slice(0,48)
}

export async function suggestPalaceSearch(term){
 const q=palaceSearchSafe(term);if(q.length<2)return{tags:[],works:[],members:[],archive:[]};
 const concepts=palaceSearchConcepts(term),terms=concepts.length?concepts:[q];
 const probes=[q,...terms.slice(-2)].filter((x,i,a)=>x&&a.indexOf(x)===i);
 const [tagGroups,works,members,archive]=await Promise.all([
  Promise.all(probes.map((probe,i)=>searchPalaceTags(probe,'all',i===0?7:4))),
  needClient().from('works').select('id,title,slug').eq('publication_status','published').or(palaceSearchOr(['title'],terms)).order('last_published_at',{ascending:false}).limit(6),
  needClient().from('profiles').select('id,username,display_name,title,avatar_url').or(palaceSearchOr(['username','display_name'],terms)).neq('visibility','hidden').limit(6),
  needClient().from('archive_records').select('id,slug,title,creator_name,category').eq('publication_status','published').or(palaceSearchOr(['title','creator_name'],terms)).limit(6)
 ]);
 for(const r of[works,members,archive])if(r.error)throw r.error;
 const tagMap=new Map();
 for(const rows of tagGroups)for(const tag of rows||[])if(!tagMap.has(tag.id))tagMap.set(tag.id,tag);
 return{
  tags:[...tagMap.values()].sort((a,b)=>Number(b.match_score||0)-Number(a.match_score||0)||Number(b.usage_count||0)-Number(a.usage_count||0)).slice(0,7),
  works:works.data||[],
  members:members.data||[],
  archive:archive.data||[]
 }
}

export async function searchPalace(term){
 const raw=String(term||'').trim();if(!raw)return{works:[],comics:[],members:[],tags:[],clubs:[],archive:[],query:{raw:'',concepts:[],mode:'direct'}};
 const safe=palaceSearchSafe(raw),needle=safe.toLowerCase();
 const concepts=palaceSearchConcepts(raw);
 const searchTerms=concepts.length?concepts:[safe.toLowerCase()];
 const tagProbes=[safe,...concepts].filter((x,i,a)=>x&&a.indexOf(x)===i);
 const broadWorks=palaceSearchOr(['title','summary'],searchTerms);
 const broadMembers=palaceSearchOr(['username','display_name'],searchTerms);
 const broadClubs=palaceSearchOr(['name','description'],searchTerms);
 const broadArchive=palaceSearchOr(['title','creator_name','summary'],searchTerms);

 const [tagGroups,directWorks,directComics,members,clubs,archive]=await Promise.all([
  Promise.all(tagProbes.map((probe,i)=>searchPalaceTags(probe,'all',i===0?16:12))),
  needClient().from('works').select('id,title,slug,summary,rating,completion_status,cover_url,author_id,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url,title)').eq('publication_status','published').or(broadWorks).order('last_published_at',{ascending:false}).limit(36),
  needClient().from('comics').select('id,creator_id,title,slug,summary,rating,completion_status,cover_path,last_published_at').eq('publication_status','published').or(broadWorks).order('last_published_at',{ascending:false}).limit(36),
  needClient().from('profiles').select('id,username,display_name,title,avatar_url,visibility').or(broadMembers).neq('visibility','hidden').limit(30),
  needClient().from('clubs').select('id,name,slug,club_type,privacy,description').or(broadClubs).neq('privacy','private').order('name').limit(24),
  needClient().from('archive_records').select('id,slug,title,creator_name,category,summary,rights_status,host_mode').eq('publication_status','published').or(broadArchive).limit(40)
 ]);
 for(const r of[directWorks,directComics,members,clubs,archive])if(r.error)throw r.error;

 const tagRows=mergePalaceTagGroups(tagGroups,concepts,safe),tagIds=tagRows.map(t=>t.id),memberIds=(members.data||[]).map(x=>x.id);
 const [tagWorkLinks,tagComicLinks,authorWorks]=await Promise.all([
  tagIds.length?needClient().from('work_tags').select('work_id,tag_id').in('tag_id',tagIds).limit(320):Promise.resolve({data:[],error:null}),
  tagIds.length?needClient().from('comic_tags').select('comic_id,tag_id').in('tag_id',tagIds).limit(320):Promise.resolve({data:[],error:null}),
  memberIds.length?needClient().from('works').select('id,title,slug,summary,rating,completion_status,cover_url,author_id,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url,title)').eq('publication_status','published').in('author_id',memberIds).order('last_published_at',{ascending:false}).limit(48):Promise.resolve({data:[],error:null})
 ]);
 for(const r of[tagWorkLinks,tagComicLinks,authorWorks])if(r.error)throw r.error;

 const extraWorkIds=[...new Set((tagWorkLinks.data||[]).map(x=>x.work_id).filter(id=>!(directWorks.data||[]).some(w=>w.id===id)&&!(authorWorks.data||[]).some(w=>w.id===id)))];
 const extraComicIds=[...new Set((tagComicLinks.data||[]).map(x=>x.comic_id).filter(id=>!(directComics.data||[]).some(w=>w.id===id)))];
 const [taggedWorks,taggedComics]=await Promise.all([
  extraWorkIds.length?needClient().from('works').select('id,title,slug,summary,rating,completion_status,cover_url,author_id,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url,title)').eq('publication_status','published').in('id',extraWorkIds).limit(64):Promise.resolve({data:[],error:null}),
  extraComicIds.length?needClient().from('comics').select('id,creator_id,title,slug,summary,rating,completion_status,cover_path,last_published_at').eq('publication_status','published').in('id',extraComicIds).limit(64):Promise.resolve({data:[],error:null})
 ]);
 for(const r of[taggedWorks,taggedComics])if(r.error)throw r.error;

 const workRows=[...(directWorks.data||[]),...(authorWorks.data||[]),...(taggedWorks.data||[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
 const comicRows=[...(directComics.data||[]),...(taggedComics.data||[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
 const creatorIds=[...new Set(comicRows.map(c=>c.creator_id).filter(Boolean))];
 let creatorRows=[];
 if(creatorIds.length){const p=await needClient().from('profiles').select('id,username,display_name,avatar_url,title').in('id',creatorIds);if(p.error)throw p.error;creatorRows=p.data||[]}
 const creatorMap=Object.fromEntries(creatorRows.map(p=>[p.id,p]));
 const tagMap=Object.fromEntries(tagRows.map(t=>[t.id,t]));
 const workTagMap={};for(const row of tagWorkLinks.data||[])(workTagMap[row.work_id]??=[]).push(tagMap[row.tag_id]);
 const comicTagMap={};for(const row of tagComicLinks.data||[])(comicTagMap[row.comic_id]??=[]).push(tagMap[row.tag_id]);

 const rank=(title,summary,person='',matchedTags=[])=>{
  const t=String(title||'').toLowerCase(),s=String(summary||'').toLowerCase(),p=String(person||'').toLowerCase();
  const hits=new Set();let score=0;
  if(t===needle)score+=1400;else if(t.startsWith(needle))score+=1000;else if(t.includes(needle))score+=760;
  if(p===needle)score+=1200;else if(p.startsWith(needle))score+=850;else if(p.includes(needle))score+=620;
  if(s.includes(needle))score+=280;
  for(const concept of searchTerms){
   const c=String(concept||'').toLowerCase();let local=0;
   if(t===c)local+=520;else if(t.startsWith(c))local+=360;else if(t.includes(c))local+=250;
   if(p===c)local+=460;else if(p.startsWith(c))local+=320;else if(p.includes(c))local+=220;
   if(s.includes(c))local+=110;
   const viaTags=matchedTags.filter(tag=>(tag?.matched_concepts||[]).includes(c));
   if(viaTags.length)local+=190+Math.max(...viaTags.map(tag=>Number(tag.match_score||0)),0)*2.5;
   if(local>0){hits.add(c);score+=local}
  }
  const coverage=hits.size;
  score+=coverage*300;
  if(searchTerms.length>1&&coverage===searchTerms.length)score+=900;
  score+=matchedTags.reduce((n,tag)=>n+Math.min(90,Number(tag?.match_score||0)),0);
  return{score,coverage,matched_concepts:[...hits]}
 };

 const identityIds=[...new Set([...workRows.map(x=>x.author_id),...comicRows.map(x=>x.creator_id),...(members.data||[]).map(x=>x.id)].filter(Boolean))];
 const marks=await getIdentityMarks(identityIds);
 const works=workRows.map(x=>{
  const mt=(workTagMap[x.id]||[]).filter(Boolean),person=x.profiles?.display_name||x.profiles?.username||'',r=rank(x.title,x.summary,person,mt);
  return{...x,profiles:withIdentity(x.profiles,x.author_id,marks),matched_tags:mt,search_score:r.score,concept_coverage:r.coverage,matched_concepts:r.matched_concepts}
 }).sort((a,b)=>b.search_score-a.search_score||new Date(b.last_published_at||0)-new Date(a.last_published_at||0)).slice(0,30);

 const comics=(await Promise.all(comicRows.map(async c=>{
  const creator=withIdentity(creatorMap[c.creator_id]||null,c.creator_id,marks),mt=(comicTagMap[c.id]||[]).filter(Boolean),r=rank(c.title,c.summary,creator?.display_name||creator?.username||'',mt);
  return{...c,creator,matched_tags:mt,search_score:r.score,concept_coverage:r.coverage,matched_concepts:r.matched_concepts,cover_url:await signedAsset('comic-covers',c.cover_path)}
 }))).sort((a,b)=>b.search_score-a.search_score||new Date(b.last_published_at||0)-new Date(a.last_published_at||0)).slice(0,30);

 const memberRows=(members.data||[]).map(x=>withIdentity(x,x.id,marks)).sort((a,b)=>{
  const an=String(a.display_name||a.username||'').toLowerCase(),bn=String(b.display_name||b.username||'').toLowerCase();
  const score=n=>n===needle?4:n.startsWith(needle)?3:n.includes(needle)?2:searchTerms.some(c=>n.includes(c))?1:0;
  return score(bn)-score(an)||an.localeCompare(bn)
 });
 const clubRows=[...(clubs.data||[])].map(c=>({...c,_rank:rank(c.name,c.description).score})).sort((a,b)=>b._rank-a._rank||String(a.name).localeCompare(String(b.name))).map(({_rank,...c})=>c);
 const archiveRows=[...(archive.data||[])].map(a=>({...a,_rank:rank(a.title,a.summary,a.creator_name).score})).sort((a,b)=>b._rank-a._rank||String(a.title).localeCompare(String(b.title))).slice(0,30).map(({_rank,...a})=>a);
 return{
  works,comics,members:memberRows,tags:tagRows,clubs:clubRows,archive:archiveRows,
  query:{raw,safe,concepts:searchTerms,mode:searchTerms.length>1?'combined':'direct'}
 }
}

export async function getWorkBySlug(slug){const{data,error}=await needClient().from('works').select('id,author_id,title,slug,summary,work_type,rating,language,completion_status,publication_status,visibility,comment_policy,constructive_criticism,translation_policy,download_policy,cover_url,first_published_at,last_published_at,profiles!works_author_id_fkey(username,display_name,avatar_url,title),chapters(id,title,position,status,word_count,scheduled_for,published_at)').eq('slug',slug).maybeSingle();if(error)throw error;if(!data)return null;data.chapters=(data.chapters||[]).sort((a,b)=>a.position-b.position);return data}
export async function getWorkExport(slug){
 const work=await getWorkBySlug(slug);if(!work)return null;
 const{data:chapters,error}=await needClient().from('chapters').select('id,title,position,body_html,status,revision_note,word_count,created_at,updated_at,published_at').eq('work_id',work.id).order('position');
 if(error)throw error;return{work,chapters:chapters||[]}
}
export async function getChapter(workSlug,chapterId){const work=await getWorkBySlug(workSlug);if(!work)return null;const{data,error}=await needClient().from('chapters').select('id,work_id,title,position,body_html,status,revision,revision_note,scheduled_for,published_at,word_count,star_count,updated_at').eq('id',chapterId).eq('work_id',work.id).maybeSingle();if(error)throw error;return data?{work,chapter:data}:null}
export async function getMyChapterStar(userId,chapterId){
 const{data,error}=await needClient().from('chapter_stars').select('chapter_id').eq('user_id',userId).eq('chapter_id',chapterId).maybeSingle();
 if(error)throw error;return!!data
}
export async function setChapterStar(userId,chapterId,starred){
 if(starred){
  const{error}=await needClient().from('chapter_stars').insert({user_id:userId,chapter_id:chapterId});
  if(error&&error.code!=='23505')throw error;
 }else{
  const{error}=await needClient().from('chapter_stars').delete().eq('user_id',userId).eq('chapter_id',chapterId);
  if(error)throw error;
 }
 return starred
}
export async function saveWork(userId,workId,patch){
 const allowed={
  title:patch.title?.trim(),
  summary:patch.summary??'',
  rating:patch.rating,
  language:patch.language?.trim()||'en',
  completion_status:patch.completion_status,
  visibility:patch.visibility,
  constructive_criticism:!!patch.constructive_criticism,
  updated_at:new Date().toISOString()
 };
 if(['original','fanwork','poetry','essay','other'].includes(patch.work_type))allowed.work_type=patch.work_type;
 const policyValues={
  comment_policy:['open','moderated','closed'],
  translation_policy:['yes','ask','no'],
  download_policy:['off','ask','credit']
 };
 for(const[key,valid]of Object.entries(policyValues)){
  if(valid.includes(patch[key]))allowed[key]=patch[key];
 }
 const{data,error}=await needClient().from('works').update(allowed).eq('id',workId).eq('author_id',userId).select().single();
 if(error)throw error;return data
}
export async function createChapter(userId,workId,title){const clean=title.trim();if(!clean)throw new Error('Give the chapter a title first.');const pos=await needClient().from('chapters').select('position').eq('work_id',workId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;const position=(pos.data?.[0]?.position||0)+1;const{data,error}=await needClient().from('chapters').insert({work_id:workId,title:clean,position,status:'draft'}).select().single();if(error)throw error;return data}
export async function reorderWorkChapters(workId,chapterIds){
 const ids=[...new Set((chapterIds||[]).filter(Boolean))];
 const{data,error}=await needClient().rpc('reorder_work_chapters',{p_work_id:workId,p_chapter_ids:ids});
 if(error)throw error;return data
}
function plainWordCount(text){return text.replace(/<[^>]*>/g,' ').trim().split(/\s+/).filter(Boolean).length}
export async function saveChapter(userId,chapterId,patch){const body=patch.body_html??'';const{data,error}=await needClient().from('chapters').update({title:patch.title?.trim(),body_html:body,word_count:plainWordCount(body),revision_note:patch.revision_note??'',updated_at:new Date().toISOString()}).eq('id',chapterId).select().single();if(error)throw error;return data}
export async function getChapterSnapshots(chapterId){
 const{data,error}=await needClient().from('chapter_revision_snapshots').select('id,chapter_id,created_by,label,title,body_html,revision_note,word_count,source_revision,created_at').eq('chapter_id',chapterId).order('created_at',{ascending:false}).limit(30);
 if(error)throw error;return data||[]
}
export async function createChapterSnapshot(userId,chapter,label=''){
 if(!chapter?.id)throw new Error('Open a chapter before creating a snapshot.');
 const body=chapter.body_html||'';
 const{data,error}=await needClient().from('chapter_revision_snapshots').insert({
  chapter_id:chapter.id,created_by:userId,label:String(label||'').trim().slice(0,100)||null,title:chapter.title||'Untitled chapter',body_html:body,
  revision_note:chapter.revision_note||null,word_count:plainWordCount(body),source_revision:Number(chapter.revision||0)
 }).select().single();
 if(error)throw error;return data
}
export async function deleteChapterSnapshot(userId,id){const{error}=await needClient().from('chapter_revision_snapshots').delete().eq('id',id);if(error)throw error;return true}
async function assertChapterPublishable(userId,chapterId){
 const ch=await needClient().from('chapters').select('id,work_id,title,body_html,status').eq('id',chapterId).maybeSingle();if(ch.error)throw ch.error;if(!ch.data)throw new Error('This chapter could not be found.');
 const work=await needClient().from('works').select('id,author_id,first_published_at,slug').eq('id',ch.data.work_id).maybeSingle();if(work.error)throw work.error;if(!work.data||work.data.author_id!==userId)throw new Error('Only the work owner can publish or schedule this chapter.');
 if(ch.data.status==='published')throw new Error('This chapter is already published.');
 if(!String(ch.data.title||'').trim())throw new Error('Give the chapter a title before publishing.');
 if(plainWordCount(ch.data.body_html||'')<1)throw new Error('Write something in this chapter before publishing.');
 return{chapter:ch.data,work:work.data}
}
export async function scheduleChapter(userId,chapterId,scheduledFor){
 await assertChapterPublishable(userId,chapterId);
 const when=new Date(scheduledFor);if(Number.isNaN(when.getTime()))throw new Error('Choose a valid publication date and time.');if(when.getTime()<Date.now()+60000)throw new Error('Choose a publication time at least one minute from now.');
 const{data,error}=await needClient().from('chapters').update({scheduled_for:when.toISOString(),status:'draft',updated_at:new Date().toISOString()}).eq('id',chapterId).neq('status','published').select().maybeSingle();if(error)throw error;if(!data)throw new Error('Published chapters cannot be scheduled again.');return data
}
export async function cancelChapterSchedule(userId,chapterId){
 const ch=await needClient().from('chapters').select('id,work_id,status').eq('id',chapterId).maybeSingle();if(ch.error)throw ch.error;if(!ch.data)throw new Error('This chapter could not be found.');
 const own=await needClient().from('works').select('id').eq('id',ch.data.work_id).eq('author_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('Only the work owner can change this schedule.');
 const{data,error}=await needClient().from('chapters').update({scheduled_for:null,updated_at:new Date().toISOString()}).eq('id',chapterId).neq('status','published').select().maybeSingle();if(error)throw error;return data
}
export async function publishChapter(userId,chapterId){
 const ready=await assertChapterPublishable(userId,chapterId);const now=new Date().toISOString();
 const{data,error}=await needClient().from('chapters').update({status:'published',published_at:now,scheduled_for:null,updated_at:now}).eq('id',chapterId).select('id,work_id').single();if(error)throw error;
 const update={publication_status:'published',last_published_at:now,updated_at:now};if(!ready.work.first_published_at)update.first_published_at=now;const wr=await needClient().from('works').update(update).eq('id',data.work_id).eq('author_id',userId);if(wr.error)throw wr.error;return data
}
export async function saveWorkToLibrary(userId,workId){const{error}=await needClient().from('saved_works').upsert({user_id:userId,work_id:workId},{onConflict:'user_id,work_id'});if(error)throw error}
export async function subscribeWork(userId,workId){const{error}=await needClient().from('story_subscriptions').upsert({user_id:userId,work_id:workId,enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id,work_id'});if(error)throw error}
export async function getWorkReaderState(userId,workId){
 const[saved,sub,progress]=await Promise.all([
  needClient().from('saved_works').select('work_id').eq('user_id',userId).eq('work_id',workId).maybeSingle(),
  needClient().from('story_subscriptions').select('enabled,frequency').eq('user_id',userId).eq('work_id',workId).maybeSingle(),
  needClient().from('reading_progress').select('chapter_id,progress_percent,chapter_progress_percent,completed,updated_at').eq('user_id',userId).eq('work_id',workId).maybeSingle()
 ]);
 for(const r of[saved,sub,progress])if(r.error)throw r.error;
 return{saved:!!saved.data,following:!!sub.data?.enabled,frequency:sub.data?.frequency||'all',progress:progress.data||null}
}
export async function getWorkShelfState(userId){
 if(!userId)return{};
 const[saved,subs,progress]=await Promise.all([
  needClient().from('saved_works').select('work_id').eq('user_id',userId),
  needClient().from('story_subscriptions').select('work_id,enabled,frequency').eq('user_id',userId).eq('enabled',true),
  needClient().from('reading_progress').select('work_id,chapter_id,progress_percent,chapter_progress_percent,completed,updated_at').eq('user_id',userId)
 ]);
 for(const r of[saved,subs,progress])if(r.error)throw r.error;
 const state={};
 for(const row of saved.data||[])state[row.work_id]={...(state[row.work_id]||{}),saved:true};
 for(const row of subs.data||[])state[row.work_id]={...(state[row.work_id]||{}),following:true,frequency:row.frequency||'all'};
 for(const row of progress.data||[])state[row.work_id]={...(state[row.work_id]||{}),progress:row};
 return state
}
export async function setWorkSaved(userId,workId,enabled){
 if(enabled){const{error}=await needClient().from('saved_works').upsert({user_id:userId,work_id:workId},{onConflict:'user_id,work_id'});if(error)throw error}
 else{const{error}=await needClient().from('saved_works').delete().eq('user_id',userId).eq('work_id',workId);if(error)throw error}
 return enabled
}
export async function setWorkFollowing(userId,workId,enabled){
 const{error}=await needClient().from('story_subscriptions').upsert({user_id:userId,work_id:workId,enabled,updated_at:new Date().toISOString()},{onConflict:'user_id,work_id'});if(error)throw error;return enabled
}
export async function recordReadingProgress(userId,workId,chapterId,percent=0,completed=false,chapterPercent=0){const next=Math.max(0,Math.min(100,Number(percent)||0));const chapterNext=Math.max(0,Math.min(100,Number(chapterPercent)||0));const current=await needClient().from('reading_progress').select('chapter_id,progress_percent,chapter_progress_percent,completed').eq('user_id',userId).eq('work_id',workId).maybeSingle();if(current.error)throw current.error;const sameChapter=current.data?.chapter_id===chapterId;const progress=sameChapter?Math.max(Number(current.data?.progress_percent||0),next):next;const done=sameChapter?Boolean(current.data?.completed||completed):Boolean(completed);const precise=completed?100:chapterNext;const{error}=await needClient().from('reading_progress').upsert({user_id:userId,work_id:workId,chapter_id:chapterId,progress_percent:progress,chapter_progress_percent:precise,completed:done,updated_at:new Date().toISOString()},{onConflict:'user_id,work_id'});if(error)throw error}

export async function getWorkLore(workId){
 const{data,error}=await needClient().rpc('get_work_lore',{p_work_id:workId});if(error)throw error;return data||[]
}
export async function saveWorkLoreEntry(workId,entry){
 const{data,error}=await needClient().rpc('save_work_lore_entry',{
  p_work_id:workId,
  p_id:entry.id||null,
  p_kind:entry.kind,
  p_title:entry.title,
  p_summary:entry.summary||'',
  p_body:entry.body||'',
  p_reveal_mode:entry.reveal_mode||'public',
  p_unlock_chapter_id:entry.reveal_mode==='after_chapter'?(entry.unlock_chapter_id||null):null,
  p_sort_order:Number(entry.sort_order||0)
 });if(error)throw error;return data
}
export async function deleteWorkLoreEntry(id){
 const{data,error}=await needClient().rpc('delete_work_lore_entry',{p_id:id});if(error)throw error;return data
}

export async function getWorkCommunity(workId){const [tags,comments]=await Promise.all([needClient().from('work_tags').select('position,tags(id,name,category,status)').eq('work_id',workId).order('position'),needClient().from('comments').select('id,work_id,chapter_id,author_id,parent_comment_id,comment_type,body,spoiler,status,created_at,profiles!comments_author_id_fkey(username,display_name,avatar_url)').eq('work_id',workId).order('created_at')]);if(tags.error)throw tags.error;if(comments.error)throw comments.error;return{tags:(tags.data||[]).filter(x=>['canonical','community'].includes(x.tags?.status)),comments:comments.data||[]}}
export async function addWorkTag(userId,workId,tagId){const{error}=await needClient().from('work_tags').insert({work_id:workId,tag_id:tagId});if(error&&error.code!=='23505')throw error}
export async function removeWorkTag(userId,workId,tagId){const{error}=await needClient().from('work_tags').delete().eq('work_id',workId).eq('tag_id',tagId);if(error)throw error}
export async function proposeTag(userId,name,category){const clean=name.trim();if(!clean)throw new Error('Name the tag first.');const{data,error}=await needClient().from('tags').insert({name:clean,category,status:'pending',created_by:userId}).select().single();if(error)throw error;return data}
export async function addComment(userId,workId,chapterId,body,type='response',spoiler=false,parentId=null){const text=body.trim();if(!text)throw new Error('Write a response first.');const{data,error}=await needClient().from('comments').insert({work_id:workId,chapter_id:chapterId||null,author_id:userId,parent_comment_id:parentId,comment_type:type,body:text,spoiler,status:'pending'}).select().single();if(error)throw error;return data}
export async function moderateComment(commentId,status){const{data,error}=await needClient().from('comments').update({status,updated_at:new Date().toISOString()}).eq('id',commentId).select().single();if(error)throw error;return data}

export async function searchWorksByTags(includeIds=[],excludeIds=[],text=''){let q=needClient().from('works').select('id,title,slug,summary,rating,language,completion_status,work_type,cover_url,first_published_at,last_published_at,profiles!works_author_id_fkey(username,display_name),work_tags(tag_id,tags(id,name,category,status))').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(100);if(text.trim())q=q.or(`title.ilike.%${text.trim()}%,summary.ilike.%${text.trim()}%`);const{data,error}=await q;if(error)throw error;return(data||[]).filter(w=>{const ids=(w.work_tags||[]).filter(x=>['canonical','community'].includes(x.tags?.status)).map(x=>x.tag_id);return includeIds.every(id=>ids.includes(id))&&!excludeIds.some(id=>ids.includes(id))})}


async function signedAsset(bucket,path,expiresIn=3600){
 if(!path)return null;
 try{const{data,error}=await needClient().storage.from(bucket).createSignedUrl(path,expiresIn);if(error)return null;return data?.signedUrl||data?.signedURL||null}catch{return null}
}
export async function getPublishedComics(){
 const{data,error}=await needClient().from('comics').select('id,creator_id,title,slug,summary,rating,completion_status,visibility,reading_direction,download_policy,required_credit_line,comment_policy,cover_path,last_published_at').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(30);
 if(error)throw error;const comics=data||[];const creators=[...new Set(comics.map(c=>c.creator_id).filter(Boolean))];const comicIds=comics.map(c=>c.id);let profiles=[];let tagRows=[];
 if(creators.length){const p=await needClient().from('profiles').select('id,username,display_name,avatar_url,title').in('id',creators);if(p.error)throw p.error;profiles=p.data||[]}
 if(comicIds.length){const t=await needClient().from('comic_tags').select('comic_id,position,tags(id,name,category,status)').in('comic_id',comicIds).order('position');if(t.error)throw t.error;tagRows=t.data||[]}
 const identity=await getIdentityMarks(creators);return Promise.all(comics.map(async c=>({...c,creator:withIdentity(profiles.find(p=>p.id===c.creator_id)||null,c.creator_id,identity),tags:tagRows.filter(x=>x.comic_id===c.id&&['canonical','community'].includes(x.tags?.status)),cover_url:await signedAsset('comic-covers',c.cover_path)})));
}
export async function getComicBySlug(slug){
 const{data:comic,error}=await needClient().from('comics').select('*').eq('slug',slug).maybeSingle();if(error)throw error;if(!comic)return null;
 const[episodes,profile,tags]=await Promise.all([
  needClient().from('comic_episodes').select('*').eq('comic_id',comic.id).order('position'),
  needClient().from('profiles').select('id,username,display_name,avatar_url,title').eq('id',comic.creator_id).maybeSingle(),
  needClient().from('comic_tags').select('position,tags(id,name,category,status)').eq('comic_id',comic.id).order('position')
 ]);for(const r of[episodes,profile,tags])if(r.error)throw r.error;
 const eps=episodes.data||[];const ids=eps.map(e=>e.id);let pages=[];
 if(ids.length){const pr=await needClient().from('comic_pages').select('*').in('episode_id',ids).order('position');if(pr.error)throw pr.error;pages=pr.data||[]}
 const signedPages=await Promise.all(pages.map(async p=>({...p,reader_url:await signedAsset('comic-pages',p.reader_path)})));
 return{...comic,creator:profile.data||null,cover_url:await signedAsset('comic-covers',comic.cover_path),tags:(tags.data||[]).filter(x=>['canonical','community'].includes(x.tags?.status)),episodes:eps.map(e=>({...e,pages:signedPages.filter(p=>p.episode_id===e.id).sort((a,b)=>a.position-b.position)}))};
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
export async function subscribeComic(userId,comicId,frequency='immediate'){
 const safeFrequency=['immediate','weekly'].includes(frequency)?frequency:'immediate';const{error}=await needClient().from('comic_subscriptions').upsert({user_id:userId,comic_id:comicId,frequency:safeFrequency,enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id,comic_id'});if(error)throw error
}
export async function getComicReaderState(userId,comicId){
 if(!userId)return{saved:false,following:false,progress:null};
 const[saved,sub,progress]=await Promise.all([
  needClient().from('saved_comics').select('comic_id').eq('user_id',userId).eq('comic_id',comicId).maybeSingle(),
  needClient().from('comic_subscriptions').select('enabled,frequency').eq('user_id',userId).eq('comic_id',comicId).maybeSingle(),
  needClient().from('comic_reading_progress').select('*').eq('user_id',userId).eq('comic_id',comicId).maybeSingle()
 ]);
 for(const r of[saved,sub,progress])if(r.error)throw r.error;
 return{saved:!!saved.data,following:!!sub.data?.enabled,frequency:sub.data?.frequency||'immediate',progress:progress.data||null}
}
export async function getComicShelfState(userId){
 if(!userId)return{};
 const[saved,subs,progress]=await Promise.all([
  needClient().from('saved_comics').select('comic_id').eq('user_id',userId),
  needClient().from('comic_subscriptions').select('comic_id,enabled,frequency').eq('user_id',userId).eq('enabled',true),
  needClient().from('comic_reading_progress').select('comic_id,episode_id,page_id,completed,updated_at').eq('user_id',userId)
 ]);
 for(const r of[saved,subs,progress])if(r.error)throw r.error;
 const state={};
 for(const row of saved.data||[])state[row.comic_id]={...(state[row.comic_id]||{}),saved:true};
 for(const row of subs.data||[])state[row.comic_id]={...(state[row.comic_id]||{}),following:true,frequency:row.frequency||'immediate'};
 for(const row of progress.data||[])state[row.comic_id]={...(state[row.comic_id]||{}),progress:row};
 return state
}
export async function setComicSaved(userId,comicId,enabled){
 if(enabled){const{error}=await needClient().from('saved_comics').upsert({user_id:userId,comic_id:comicId},{onConflict:'user_id,comic_id'});if(error)throw error}
 else{const{error}=await needClient().from('saved_comics').delete().eq('user_id',userId).eq('comic_id',comicId);if(error)throw error}
 return enabled
}
export async function setComicFollowing(userId,comicId,enabled,frequency='immediate'){
 const safeFrequency=['immediate','weekly'].includes(frequency)?frequency:'immediate';const{error}=await needClient().from('comic_subscriptions').upsert({user_id:userId,comic_id:comicId,frequency:safeFrequency,enabled,updated_at:new Date().toISOString()},{onConflict:'user_id,comic_id'});if(error)throw error;return enabled
}
export async function requestComicDownload(userId,comicId,requested_scope='images',note=''){
 const{data,error}=await needClient().from('comic_download_requests').insert({comic_id:comicId,requester_id:userId,requested_scope,note:note.trim(),status:'pending'}).select().single();if(error)throw error;return data
}
export async function setConversationPreference(userId,conversationId,patch){
 const{data,error}=await needClient().from('conversation_preferences').upsert({user_id:userId,conversation_id:conversationId,...patch,updated_at:new Date().toISOString()},{onConflict:'user_id,conversation_id'}).select().single();if(error)throw error;return data
}

export async function getMyComics(userId){
 const{data,error}=await needClient().from('comics').select('*,comic_episodes(id,title,position,status,revision,revision_note,scheduled_for,published_at,comic_pages(id,position,caption,alt_text,decorative,reader_path,width,height))').eq('creator_id',userId).order('updated_at',{ascending:false});if(error)throw error;
 const comics=data||[];const ids=comics.map(x=>x.id);let tagRows=[];
 if(ids.length){const tags=await needClient().from('comic_tags').select('comic_id,position,tags(id,name,category,status)').in('comic_id',ids).order('position');if(tags.error)throw tags.error;tagRows=tags.data||[]}
 return Promise.all(comics.map(async c=>({...c,tags:tagRows.filter(x=>x.comic_id===c.id&&['canonical','community'].includes(x.tags?.status)),cover_url:await signedAsset('comic-covers',c.cover_path),comic_episodes:(c.comic_episodes||[]).sort((a,b)=>a.position-b.position).map(e=>({...e,comic_pages:(e.comic_pages||[]).sort((a,b)=>a.position-b.position)}))})));
}
function comicSlug(title){const base=title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'comic';return base+'-'+crypto.randomUUID().slice(0,8)}
export async function createComicDraft(userId,title){
 const clean=title.trim();if(!clean)throw new Error('Give your comic a title first.');
 const{data,error}=await needClient().from('comics').insert({creator_id:userId,title:clean,slug:comicSlug(clean),summary:'',publication_status:'draft',visibility:'public',rating:'general',completion_status:'in_progress',reading_direction:'ltr',download_policy:'off',comment_policy:'moderated'}).select().single();if(error)throw error;return data
}
export async function saveComicStudio(userId,comicId,patch){
 const title=String(patch.title||'').trim();if(!title)throw new Error('Give your comic a title.');
 const allowed={
  title:title.slice(0,180),
  summary:String(patch.summary||'').trim().slice(0,2000),
  rating:['general','teen','mature','explicit','not_rated'].includes(patch.rating)?patch.rating:'general',
  completion_status:['in_progress','complete','hiatus','abandoned'].includes(patch.completion_status)?patch.completion_status:'in_progress',
  visibility:['public','members','private'].includes(patch.visibility)?patch.visibility:'private',
  reading_direction:['ltr','rtl','vertical'].includes(patch.reading_direction)?patch.reading_direction:'ltr',
  download_policy:['off','ask','credit'].includes(patch.download_policy)?patch.download_policy:'off',
  required_credit_line:String(patch.required_credit_line||'').trim().slice(0,500),
  comment_policy:['open','moderated','closed'].includes(patch.comment_policy)?patch.comment_policy:'moderated',
  updated_at:new Date().toISOString()
 };
 const{data,error}=await needClient().from('comics').update(allowed).eq('id',comicId).eq('creator_id',userId).select().single();if(error)throw error;return data
}
export async function addComicTag(userId,comicId,tagId){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const pos=await needClient().from('comic_tags').select('position').eq('comic_id',comicId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const{error}=await needClient().from('comic_tags').insert({comic_id:comicId,tag_id:tagId,position:(pos.data?.[0]?.position||0)+1});if(error&&error.code!=='23505')throw error;return true
}
export async function removeComicTag(userId,comicId,tagId){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const{error}=await needClient().from('comic_tags').delete().eq('comic_id',comicId).eq('tag_id',tagId);if(error)throw error;return true
}
export async function setComicArchived(userId,comicId,archived=true){
 const patch=archived?{publication_status:'archived',visibility:'private',updated_at:new Date().toISOString()}:{publication_status:'draft',visibility:'private',updated_at:new Date().toISOString()};
 const{data,error}=await needClient().from('comics').update(patch).eq('id',comicId).eq('creator_id',userId).select().single();if(error)throw error;
 if(archived){const scheduled=await needClient().from('comic_episodes').update({scheduled_for:null,updated_at:new Date().toISOString()}).eq('comic_id',comicId).neq('status','published').not('scheduled_for','is',null);if(scheduled.error)throw scheduled.error}
 return data
}
export async function createComicEpisode(userId,comicId,title){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const pos=await needClient().from('comic_episodes').select('position').eq('comic_id',comicId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const{data,error}=await needClient().from('comic_episodes').insert({comic_id:comicId,title:title.trim()||'Untitled episode',position:(pos.data?.[0]?.position||0)+1,status:'draft'}).select().single();if(error)throw error;return data
}
export async function saveComicEpisode(userId,comicId,episodeId,patch){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const update={title:patch.title?.trim(),revision_note:patch.revision_note??'',updated_at:new Date().toISOString()};if(Object.prototype.hasOwnProperty.call(patch,'scheduled_for'))update.scheduled_for=patch.scheduled_for||null;
 const{data,error}=await needClient().from('comic_episodes').update(update).eq('id',episodeId).eq('comic_id',comicId).select().single();if(error)throw error;return data
}
async function assertComicEpisodeReady(userId,comicId,episodeId){
 const own=await needClient().from('comics').select('id,publication_status').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');if(own.data.publication_status==='archived')throw new Error('Restore this comic before publishing or scheduling an episode.');
 const pages=await needClient().from('comic_pages').select('id,alt_text,decorative').eq('episode_id',episodeId).order('position');if(pages.error)throw pages.error;
 if(!pages.data?.length)throw new Error('Add at least one comic page before publishing this episode.');
 const missing=(pages.data||[]).filter(p=>!p.decorative&&!String(p.alt_text||'').trim());if(missing.length)throw new Error('Add image descriptions to every non-decorative page before publishing.');
 return true
}
export async function scheduleComicEpisode(userId,comicId,episodeId,scheduledFor){
 await assertComicEpisodeReady(userId,comicId,episodeId);
 const when=new Date(scheduledFor);if(Number.isNaN(when.getTime()))throw new Error('Choose a valid publication date and time.');if(when.getTime()<Date.now()+60000)throw new Error('Choose a publication time at least one minute from now.');
 const{data,error}=await needClient().from('comic_episodes').update({scheduled_for:when.toISOString(),status:'draft',updated_at:new Date().toISOString()}).eq('id',episodeId).eq('comic_id',comicId).neq('status','published').select().maybeSingle();if(error)throw error;if(!data)throw new Error('Published episodes cannot be scheduled again.');return data
}
export async function cancelComicEpisodeSchedule(userId,comicId,episodeId){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const{data,error}=await needClient().from('comic_episodes').update({scheduled_for:null,updated_at:new Date().toISOString()}).eq('id',episodeId).eq('comic_id',comicId).neq('status','published').select().single();if(error)throw error;return data
}
export async function publishComicEpisode(userId,comicId,episodeId){
 const own=await needClient().from('comics').select('first_published_at').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 await assertComicEpisodeReady(userId,comicId,episodeId);
 const now=new Date().toISOString();const ep=await needClient().from('comic_episodes').update({status:'published',published_at:now,scheduled_for:null,updated_at:now}).eq('id',episodeId).eq('comic_id',comicId).select().single();if(ep.error)throw ep.error;
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
export async function reorderComicEpisodes(userId,comicId,episodeIds){
 const ids=[...new Set((episodeIds||[]).filter(Boolean))];const{data,error}=await needClient().rpc('reorder_comic_episodes',{p_comic_id:comicId,p_episode_ids:ids});if(error)throw error;return data
}
export async function reorderComicPages(userId,episodeId,pageIds){
 const ids=[...new Set((pageIds||[]).filter(Boolean))];const{data,error}=await needClient().rpc('reorder_comic_pages',{p_episode_id:episodeId,p_page_ids:ids});if(error)throw error;return data
}
export async function updateComicPage(userId,comicId,pageId,patch){
 const own=await needClient().from('comics').select('id').eq('id',comicId).eq('creator_id',userId).maybeSingle();if(own.error)throw own.error;if(!own.data)throw new Error('This comic does not belong to your chamber.');
 const decorative=!!patch.decorative;const alt=String(patch.alt_text||'').trim();if(!decorative&&!alt)throw new Error('Add an image description or mark the page decorative.');
 const{data,error}=await needClient().from('comic_pages').update({caption:String(patch.caption||'').trim().slice(0,500),alt_text:decorative?'':alt.slice(0,1200),decorative,updated_at:new Date().toISOString()}).eq('id',pageId).select().single();if(error)throw error;return data
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
  needClient().from('lucky_draw_claims').select('id,draw_month,gift_id,tier,claimed_at,virtual_gifts(id,gift_key,catalogue_number,name,description,court_name,art_status)').eq('user_id',userId).eq('draw_month',month).maybeSingle()
 ]);
 if(catalogue.error)throw catalogue.error;if(claim.error)throw claim.error;
 const history=await needClient().from('lucky_draw_claims').select('id,draw_month,tier,claimed_at,virtual_gifts(id,gift_key,catalogue_number,name,court_name)').eq('user_id',userId).order('draw_month',{ascending:false}).limit(12);
 if(history.error)throw history.error;
 return{catalogueCount:catalogue.count||0,preview:catalogue.data||[],claim:claim.data||null,history:history.data||[]}
}
export async function claimLuckyDraw(){
 const{data,error}=await needClient().rpc('claim_monthly_lucky_draw');if(error)throw error;return data?.[0]||null
}

export async function getMyRelayRooms(){
 const{data,error}=await needClient().rpc('get_my_relay_rooms');if(error)throw error;return data||[]
}
export async function createRelayRoom(title,premise='',turnWordLimit=200){
 const{data,error}=await needClient().rpc('create_relay_room',{p_title:title,p_premise:premise,p_turn_word_limit:turnWordLimit});if(error)throw error;return data
}
export async function inviteRelayWriter(roomId,username){
 const{data,error}=await needClient().rpc('invite_relay_writer',{p_room_id:roomId,p_username:username});if(error)throw error;return data
}
export async function respondRelayInvitation(roomId,status){
 const{data,error}=await needClient().rpc('respond_relay_invitation',{p_room_id:roomId,p_status:status});if(error)throw error;return data
}
export async function setRelayRoomStatus(roomId,status){
 const{data,error}=await needClient().rpc('set_relay_room_status',{p_room_id:roomId,p_status:status});if(error)throw error;return data
}
export async function submitRelayTurn(roomId,body){
 const{data,error}=await needClient().rpc('submit_relay_turn',{p_room_id:roomId,p_body:body});if(error)throw error;return data
}

export async function setRelayAudience(roomId,open){
 const{data,error}=await needClient().rpc('set_relay_audience',{p_room_id:roomId,p_open:open});if(error)throw error;return data
}
export async function createRelayPoll(roomId,question,options){
 const{data,error}=await needClient().rpc('create_relay_poll',{p_room_id:roomId,p_question:question,p_options:options});if(error)throw error;return data
}
export async function closeRelayPoll(pollId){
 const{data,error}=await needClient().rpc('close_relay_poll',{p_poll_id:pollId});if(error)throw error;return data
}
export async function voteRelayPoll(pollId,optionId){
 const{data,error}=await needClient().rpc('vote_relay_poll',{p_poll_id:pollId,p_option_id:optionId});if(error)throw error;return data
}
export async function getRelayBalcony(roomId){
 const{data,error}=await needClient().rpc('get_relay_balcony',{p_room_id:roomId});if(error)throw error;return data
}
export async function getMicroDuels(){
 const{data,error}=await needClient().rpc('get_micro_duels');if(error)throw error;
 const rows=data||[];
 return Promise.all(rows.map(async duel=>({...duel,entries:await Promise.all((duel.entries||[]).map(async entry=>({...entry,media_url:entry.media_path?await signedAsset('duel-art',entry.media_path,1800):null})))})))
}
export async function getMicroDuelRecord(){
 const{data,error}=await needClient().rpc('get_micro_duel_record');if(error)throw error;return data||{entries:0,hosted:0,types:0,votes:0,wins:0,laurels:0,one_v_one_wins:0,group_wins:0,prizes:0,silver_prizes:0,gold_prizes:0}
}
export async function createMicroDuel(title,prompt,wordLimit=500,options={}){
 const writingMinutes=Math.max(5,Math.min(Number(options.writingMinutes)||15,45));
 const votingMinutes=Math.max(60,Math.min(Number(options.votingMinutes)||720,1440));
 const mode=['flash','classic','deep'].includes(options.mode)?options.mode:'classic';
 const promptFamily=String(options.promptFamily||'Open').slice(0,80);
 const contentType=['fiction','poetry','haiku','drabble','dialogue','art','comic','wildcard'].includes(options.contentType)?options.contentType:'fiction';
 const matchType=['open','one_v_one','group'].includes(options.matchType)?options.matchType:'open';
 const maxEntries=Math.max(2,Math.min(Number(options.maxEntries)||12,20));
 const invitedUsernames=Array.isArray(options.invitedUsernames)?options.invitedUsernames.map(x=>String(x||'').trim()).filter(Boolean).slice(0,7):[];
 const ruleNote=String(options.ruleNote||'').trim().slice(0,300);
 const{data,error}=await needClient().rpc('create_micro_duel_v3',{
  p_title:title,p_prompt:prompt,p_word_limit:wordLimit,p_writing_minutes:writingMinutes,p_voting_minutes:votingMinutes,
  p_duel_mode:mode,p_prompt_family:promptFamily,p_content_type:contentType,p_match_type:matchType,
  p_max_entries:maxEntries,p_invited_usernames:invitedUsernames,p_rule_note:ruleNote
 });if(error)throw error;return data
}
export async function uploadMicroDuelArt(userId,duelId,file){
 if(!file)throw new Error('Choose an image first.');
 if(file.size>10485760)throw new Error('Duel artwork must be 10 MB or smaller.');
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Use JPG, PNG, WebP or AVIF artwork.');
 const safe=(file.name||'duel-art').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120);
 const path=userId+'/'+duelId+'/'+crypto.randomUUID()+'-'+safe;
 const{error}=await needClient().storage.from('duel-art').upload(path,file,{cacheControl:'1800',upsert:false,contentType:file.type||undefined});
 if(error)throw error;return path
}
export async function submitMicroDuelEntry(duelId,body,options={}){
 const{data,error}=await needClient().rpc('submit_micro_duel_entry_v3',{
  p_duel_id:duelId,p_body:String(body||''),p_media_path:options.mediaPath||null,p_alt_text:String(options.altText||'')
 });if(error)throw error;return data
}
export async function voteMicroDuel(duelId,entryId){
 const{data,error}=await needClient().rpc('vote_micro_duel',{p_duel_id:duelId,p_entry_id:entryId});if(error)throw error;return data
}
export async function markMicroDuelEntry(duelId,entryId,markType){
 const{data,error}=await needClient().rpc('mark_micro_duel_entry',{p_duel_id:duelId,p_entry_id:entryId,p_mark_type:markType});if(error)throw error;return data
}
export async function respondMicroDuelInvitation(duelId,response){
 const{data,error}=await needClient().rpc('respond_micro_duel_invitation',{p_duel_id:duelId,p_response:response});if(error)throw error;return data
}
export async function startMicroDuel(duelId){
 const{data,error}=await needClient().rpc('start_micro_duel',{p_duel_id:duelId});if(error)throw error;return data
}
export async function cancelMicroDuel(duelId){
 const{data,error}=await needClient().rpc('cancel_micro_duel',{p_duel_id:duelId});if(error)throw error;return data
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
  needClient().from('reader_notes').select('id,work_id,chapter_id,comic_id,episode_id,page_id,note_text,bookmark_label,created_at,updated_at,works(id,title,slug),chapters(id,title,position),comics(id,title,slug)').eq('user_id',userId).order('updated_at',{ascending:false})
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
export async function updateLibraryOrganizer(userId,kind,id,{name,description=''}) {
 const table=kind==='collection'?'library_collections':'reading_lists';
 const clean=String(name||'').trim();if(!clean)throw new Error('Give this shelf a name.');
 const{data,error}=await needClient().from(table).update({name:clean.slice(0,100),description:String(description||'').trim().slice(0,600),updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId).select().single();
 if(error)throw error;return data
}
export async function deleteLibraryOrganizer(userId,kind,id){
 const table=kind==='collection'?'library_collections':'reading_lists';
 const{error}=await needClient().from(table).delete().eq('id',id).eq('user_id',userId);if(error)throw error;return true
}
export async function removeLibraryOrganizerItem(kind,itemId){
 const table=kind==='collection'?'library_collection_items':'reading_list_items';
 const{error}=await needClient().from(table).delete().eq('id',itemId);if(error)throw error;return true
}
export async function getReaderNotesForChapter(userId,chapterId){
 const{data,error}=await needClient().from('reader_notes').select('id,work_id,chapter_id,note_text,bookmark_label,created_at,updated_at').eq('user_id',userId).eq('chapter_id',chapterId).order('updated_at',{ascending:false});
 if(error)throw error;return data||[]
}
export async function addReaderNote(userId,item,noteText,label=''){
 const text=noteText.trim();if(!text)throw new Error('Write a note first.');
 const row={
  user_id:userId,
  note_text:text,
  bookmark_label:label.trim(),
  work_id:item.type==='work'?item.id:item.type==='chapter'?item.workId:null,
  chapter_id:item.type==='chapter'?item.id:null,
  comic_id:item.type==='comic'?item.id:null,
  episode_id:item.type==='episode'?item.id:null,
  page_id:item.type==='page'?item.id:null
 };
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
export async function createSeries(userId,title,summary='',visibility='public'){
 const clean=String(title||'').trim();if(!clean)throw new Error('Give the series a title.');
 const slug=(clean.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'series')+'-'+Date.now().toString(36);
 const allowed=['public','members','private'].includes(visibility)?visibility:'public';
 const{data,error}=await needClient().from('series').insert({owner_id:userId,title:clean.slice(0,160),slug,summary:String(summary||'').trim().slice(0,1500),visibility:allowed}).select().single();if(error)throw error;return data
}
export async function updateSeries(userId,seriesId,{title,summary='',visibility='public'}){
 const clean=String(title||'').trim();if(!clean)throw new Error('Give the series a title.');
 const allowed=['public','members','private'].includes(visibility)?visibility:'public';
 const{data,error}=await needClient().from('series').update({title:clean.slice(0,160),summary:String(summary||'').trim().slice(0,1500),visibility:allowed,updated_at:new Date().toISOString()}).eq('id',seriesId).eq('owner_id',userId).select().single();
 if(error)throw error;return data
}
export async function deleteSeries(userId,seriesId){
 const{error}=await needClient().from('series').delete().eq('id',seriesId).eq('owner_id',userId);if(error)throw error;return true
}
export async function addWorkToSeries(userId,seriesId,workId){
 const pos=await needClient().from('series_works').select('position').eq('series_id',seriesId).order('position',{ascending:false}).limit(1);if(pos.error)throw pos.error;
 const{data,error}=await needClient().from('series_works').insert({series_id:seriesId,work_id:workId,position:(pos.data?.[0]?.position||0)+1}).select().single();if(error?.code==='23505')throw new Error('That work is already in the series.');if(error)throw error;
 await needClient().from('series').update({updated_at:new Date().toISOString()}).eq('id',seriesId).eq('owner_id',userId);
 return data
}
export async function removeWorkFromSeries(userId,seriesId,workId){
 const{error}=await needClient().from('series_works').delete().eq('series_id',seriesId).eq('work_id',workId);if(error)throw error;
 const current=await needClient().from('series_works').select('work_id,position').eq('series_id',seriesId).order('position');if(current.error)throw current.error;
 if(current.data?.length){const{error:reorderError}=await needClient().rpc('reorder_series_works',{p_series_id:seriesId,p_work_ids:current.data.map(x=>x.work_id)});if(reorderError)throw reorderError}
 else await needClient().from('series').update({updated_at:new Date().toISOString()}).eq('id',seriesId).eq('owner_id',userId);
 return true
}
export async function reorderSeriesWorks(userId,seriesId,workIds){
 const ids=[...new Set((workIds||[]).filter(Boolean))];
 const{data,error}=await needClient().rpc('reorder_series_works',{p_series_id:seriesId,p_work_ids:ids});if(error)throw error;return data
}

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

