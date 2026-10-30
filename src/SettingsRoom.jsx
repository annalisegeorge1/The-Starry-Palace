/* Settings & Safety is isolated from liveRooms to avoid tying account
 * preferences and password controls to reading, writing or Treasury pages.
 * All existing routes, form handlers and styling remain unchanged.
 */
import React,{useEffect,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from './auth';
import {supabase} from './supabase';
import MemberAvatar from './MemberAvatar';
import {PalaceDialog,State} from './PalaceLivePrimitives';
import {SETTINGS_TABS,palaceTabFromSearch,palaceTabUrl} from './palaceTabNavigation';
import {getSettings,updatePrivacy,updateNotifications,requestAccountExport,requestAccountDeletion,cancelAccountDeletion,setForumThreadPreference,setMemberBoundary} from './palaceData';
import {IN_APP_NOTIFICATION_CATEGORIES,notificationPreset,notificationFormPatch} from './notificationSettingsModel';
import {EMAIL_ALERT_TOPICS,EMAIL_ALERT_DEFAULT_TOPICS,EMAIL_ALERT_FREQUENCIES,emailAlertFormPatch} from './emailAlertPreferences';
// Keep new controls inactive until its migration and provider verification pass.
const EMAIL_ALERT_SCHEMA_READY=import.meta.env.VITE_PALACE_EMAIL_SCHEMA_READY==='true';

export function SettingsLive({Frame}){
 const{session}=useAuth();const navigate=useNavigate();const location=useLocation();const[data,setData]=useState(null);const[error,setError]=useState('');const[saved,setSaved]=useState('');const[settingsVersion,setSettingsVersion]=useState(0);const[tab,setTab]=useState(()=>palaceTabFromSearch(location.search,SETTINGS_TABS,'privacy'));const[deletionDialog,setDeletionDialog]=useState(false);const[currentPassword,setCurrentPassword]=useState('');const[newPassword,setNewPassword]=useState('');const[confirmPassword,setConfirmPassword]=useState('');const[passwordBusy,setPasswordBusy]=useState(false);
 const load=()=>getSettings(session.user.id).then(setData).catch(e=>setError(e.message));useEffect(()=>{load()},[session.user.id]);
 useEffect(()=>{const next=palaceTabFromSearch(location.search,SETTINGS_TABS,'privacy');setTab(current=>current===next?current:next)},[location.search]);
 function choose(next){if(!SETTINGS_TABS.includes(next))return;setTab(next);navigate(palaceTabUrl('/settings',next,SETTINGS_TABS,'privacy'),{preventScrollReset:true});window.scrollTo({top:0,left:0,behavior:'auto'})}
 async function save(e){e.preventDefault();setSaved('');setError('');const f=new FormData(e.currentTarget);try{if(tab==='privacy'){const privacy={discovery_visibility:f.get('discovery_visibility'),reading_activity_visibility:f.get('reading_activity_visibility'),writing_activity_visibility:f.get('writing_activity_visibility'),clubs_visibility:f.get('clubs_visibility'),honours_visibility:f.get('honours_visibility'),gifts_visibility:f.get('gifts_visibility'),follower_counts_visible:f.has('follower_counts_visible'),online_status_visible:f.has('online_status_visible'),recommendation_learning:f.has('recommendation_learning')};const p=await updatePrivacy(session.user.id,privacy);setData(d=>({...d,privacy:p}));setSaved('Your Palace boundaries are saved.')}else if(tab==='notifications'){const notifications={...notificationFormPatch(f),...(EMAIL_ALERT_SCHEMA_READY?emailAlertFormPatch(f):{})};const n=await updateNotifications(session.user.id,notifications);setData(d=>({...d,notifications:n}));setSaved('Notification choices saved. Your email preference is recorded; email delivery is not active yet.')}}catch(e){setError(e.message)}}
 async function applyPrivacyPreset(kind){
  const presets={
   open:{discovery_visibility:'everyone',reading_activity_visibility:'public',writing_activity_visibility:'public',clubs_visibility:'public',honours_visibility:'public',gifts_visibility:'public',follower_counts_visible:true,online_status_visible:false,recommendation_learning:true},
   members:{discovery_visibility:'members',reading_activity_visibility:'members',writing_activity_visibility:'members',clubs_visibility:'members',honours_visibility:'members',gifts_visibility:'members',follower_counts_visible:true,online_status_visible:false,recommendation_learning:true},
   private:{discovery_visibility:'private',reading_activity_visibility:'private',writing_activity_visibility:'private',clubs_visibility:'private',honours_visibility:'private',gifts_visibility:'private',follower_counts_visible:false,online_status_visible:false,recommendation_learning:false}
  };
  try{const p=await updatePrivacy(session.user.id,presets[kind]);setData(d=>({...d,privacy:p}));setSettingsVersion(v=>v+1);setSaved(kind==='open'?'Open creator preset applied.':kind==='members'?'Members-first preset applied.':'Quiet private preset applied.')}catch(e){setError(e.message)}
 }
 async function applyNotificationPreset(kind){
  try{
   setSaved('');setError('');
   const n=await updateNotifications(session.user.id,notificationPreset(kind,data.notifications));
   setData(d=>({...d,notifications:n}));setSettingsVersion(v=>v+1);
   setSaved(kind==='all'?'All in-Palace activity enabled.':kind==='focused'?'Focused in-Palace alerts saved.':'Quiet in-Palace alerts saved.');
  }catch(e){setError(e.message)}
 }
  async function changePassword(e){
  e.preventDefault();setSaved('');setError('');
  if(newPassword.length<8){setError('Your new Palace password must use at least 8 characters.');return}
  if(newPassword!==confirmPassword){setError('The new passwords do not match.');return}
  if(currentPassword&&currentPassword===newPassword){setError('Choose a new password that is different from your current Palace password.');return}
  try{
   setPasswordBusy(true);
   const update={password:newPassword};if(currentPassword)update.current_password=currentPassword;
   const{error:authError}=await supabase.auth.updateUser(update);if(authError)throw authError;
   setCurrentPassword('');setNewPassword('');setConfirmPassword('');setSaved('Your Palace password has been changed.');
  }catch(e){setError(e.message||'Your password could not be changed.')}finally{setPasswordBusy(false)}
 }
 async function exportData(){try{await requestAccountExport('json');setSaved('Your export request has been received.');load()}catch(e){setError(e.message)}}
 function beginDeletion(){setDeletionDialog(true)} async function confirmDeletion(){try{await requestAccountDeletion();setDeletionDialog(false);setSaved('Deletion requested. Your grace period has begun.');load()}catch(e){setError(e.message)}}
 async function cancelDeletion(){try{await cancelAccountDeletion(data.deletion.id);setSaved('Account deletion has been cancelled.');load()}catch(e){setError(e.message)}}
 async function restoreBoundary(row,kind){
  try{
   const next={muted:!!row.muted,blocked:!!row.blocked};
   if(kind==='mute')next.muted=false;
   if(kind==='block')next.blocked=false;
   await setMemberBoundary(session.user.id,row.other_user_id,next);
   setSaved(kind==='block'?'Exile lifted.':'Member unmuted.');
   await load();
  }catch(e){setError(e.message)}
 }
 async function unmuteForum(threadId){
  try{await setForumThreadPreference(session.user.id,threadId,'mute',false);setSaved('Forum thread unmuted.');await load()}catch(e){setError(e.message)}
 }
 const matchesPrivacyPreset=kind=>{
  const p=data?.privacy;if(!p)return false;
  const visibility=kind==='open'?'public':kind==='members'?'members':'private';
  const profileMatches=kind==='open'?['public','everyone'].includes(p.discovery_visibility):p.discovery_visibility===visibility;
  const fields=['reading_activity_visibility','writing_activity_visibility','clubs_visibility','honours_visibility','gifts_visibility'];
  return profileMatches&&fields.every(key=>p[key]===visibility)&&Boolean(p.follower_counts_visible)===(kind!=='private')&&p.online_status_visible===false&&Boolean(p.recommendation_learning)===(kind!=='private');
 };
 const activeDeletion=data?.deletion&&['grace_period','queued'].includes(data.deletion.status);
 const tabs=[['privacy','Privacy'],['notifications','Notifications'],['quiet','Quiet Corners'],['storage','Storage & uploads'],['account','Account & downloads'],['system','System status'],['guide','Welcome guide'],['testing','Testing room']];
 return <Frame privateArea><section className="room-title settings-head settings-head-compact"><p className="eyebrow">YOUR PALACE, YOUR BOUNDARIES</p><h1>Settings & Safety</h1><p className="lede">Privacy, comfort, system transparency and account control live together here.</p></section><nav className="settings-tabs settings-desktop-tabs" aria-label="Settings sections">{tabs.map(([k,l])=><button type="button" key={k} className={tab===k?'active':''} aria-pressed={tab===k} onClick={()=>choose(k)}>{l}</button>)}</nav><label className="settings-mobile-section-picker"><span>Choose settings section</span><select aria-label="Settings section" value={tab} onChange={e=>choose(e.target.value)}>{tabs.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label><State loading={!data&&!error} error={error}>{data&&<>
 {tab==='privacy'&&<form key={'privacy-'+settingsVersion} className="settings-form" onSubmit={save}><section><div className="settings-preset-head"><div><h2>Who may see your world</h2><p>Start with a preset, then adjust any individual boundary below.</p></div><span>Presets save immediately</span></div><div className="settings-presets"><button type="button" className={matchesPrivacyPreset('open')?'is-selected':''} aria-pressed={matchesPrivacyPreset('open')} onClick={()=>applyPrivacyPreset('open')}><strong>Open creator</strong><small>Public profile and creative activity; online status remains private.</small><span className="settings-preset-indicator" aria-hidden="true">{matchesPrivacyPreset('open')?'●':'○'}</span></button><button type="button" className={matchesPrivacyPreset('members')?'is-selected':''} aria-pressed={matchesPrivacyPreset('members')} onClick={()=>applyPrivacyPreset('members')}><strong>Members first</strong><small>Keep activity inside the Palace while remaining discoverable to members.</small><span className="settings-preset-indicator" aria-hidden="true">{matchesPrivacyPreset('members')?'●':'○'}</span></button><button type="button" className={matchesPrivacyPreset('private')?'is-selected':''} aria-pressed={matchesPrivacyPreset('private')} onClick={()=>applyPrivacyPreset('private')}><strong>Quiet private</strong><small>Hide discovery and activity until you choose otherwise.</small><span className="settings-preset-indicator" aria-hidden="true">{matchesPrivacyPreset('private')?'●':'○'}</span></button></div><div className="settings-grid">{[['discovery_visibility','Discover my profile'],['reading_activity_visibility','Reading activity'],['writing_activity_visibility','Writing activity'],['clubs_visibility','Club activity'],['honours_visibility','Honours'],['gifts_visibility','Treasury gifts']].map(([key,label])=><label key={key}>{label}<select name={key} defaultValue={data.privacy[key]}>{(key==='discovery_visibility'?['everyone','members','private']:['public','members','private']).map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}</div><div className="switch-list"><label><input type="checkbox" name="follower_counts_visible" defaultChecked={data.privacy.follower_counts_visible}/> Show follower counts</label><label><input type="checkbox" name="online_status_visible" defaultChecked={data.privacy.online_status_visible}/> Show when I am online</label><label><input type="checkbox" name="recommendation_learning" defaultChecked={data.privacy.recommendation_learning}/> Let my reading improve recommendations</label></div></section><div className="save-row"><button>Save my boundaries</button>{saved&&<span role="status">{saved}</span>}</div></form>}
 {tab==='notifications'&&<form key={'notifications-'+settingsVersion} className="settings-form" onSubmit={save}>
 <section>
  <div className="settings-preset-head"><div><h2>Choose your Palace notifications</h2><p>In-Palace alerts and email are separate. Choose a preset, then fine-tune your categories.</p></div><span>In-Palace presets save immediately</span></div>
  <div className="settings-presets notification-presets">
   <button type="button" onClick={()=>applyNotificationPreset('all')}><strong>All activity</strong><small>Every in-Palace category. Does not enable emails.</small></button>
   <button type="button" onClick={()=>applyNotificationPreset('focused')}><strong>Focused</strong><small>Stories, replies, letters, invitations, events and Council.</small></button>
   <button type="button" onClick={()=>applyNotificationPreset('quiet')}><strong>Quiet</strong><small>Only letters, invitations and Council matters.</small></button>
  </div>
  <h3>In-Palace notification categories</h3>
  <div className="switch-list two-col">{IN_APP_NOTIFICATION_CATEGORIES.map(([key,label])=><label key={key}><input type="checkbox" name={key} defaultChecked={!!data.notifications[key]}/>{label}</label>)}</div>
  <div className="quiet-hours">
   <label><input type="checkbox" name="quiet_hours_enabled" defaultChecked={data.notifications.quiet_hours_enabled}/> Quiet hours</label>
   <div><label>From<input type="time" name="quiet_hours_start" defaultValue={(data.notifications.quiet_hours_start||'').slice(0,5)}/></label><label>Until<input type="time" name="quiet_hours_end" defaultValue={(data.notifications.quiet_hours_end||'').slice(0,5)}/></label></div>
   <p>Quiet hours soften non-urgent Palace notices. Choose a start and end time to enable them.</p>
  </div>
 </section>
 <section className="settings-email-delivery" aria-labelledby="palace-email-notices-heading">
  <p className="eyebrow">EMAIL ALERTS</p>
  <h3 id="palace-email-notices-heading">Choose which Palace moments reach your inbox.</h3>
  {!EMAIL_ALERT_SCHEMA_READY&&<p role="status">Email sending is being prepared. These delivery choices are a preview and cannot be activated yet. Existing Palace alerts inside the site still work.</p>}
  <div className="switch-list"><label><input type="checkbox" name="email_digest" defaultChecked={!!data.notifications.email_digest}/> Keep my existing interest in a future Palace email digest.</label></div>
  <div className="switch-list"><label><input type="checkbox" name="email_alerts_enabled" disabled={!EMAIL_ALERT_SCHEMA_READY} defaultChecked={!!data.notifications.email_alerts_enabled}/> Send me optional Palace activity emails when available.</label></div>
  <div className="settings-grid">
   <label>Email frequency<select name="email_frequency" disabled={!EMAIL_ALERT_SCHEMA_READY} defaultValue={data.notifications.email_frequency||'daily'}>
    {EMAIL_ALERT_FREQUENCIES.map(mode=><option key={mode} value={mode}>{mode==='immediate'?'As events happen':mode==='daily'?'Daily digest':'Weekly digest'}</option>)}
   </select></label>
  </div>
  <h3>Which activities may generate emails?</h3>
  <div className="switch-list two-col">
   {EMAIL_ALERT_TOPICS.map(([key,label])=><label key={key}><input type="checkbox" disabled={!EMAIL_ALERT_SCHEMA_READY} name={'email_topic_'+key} defaultChecked={(data.notifications.email_topics||EMAIL_ALERT_DEFAULT_TOPICS).includes(key)}/>{label}</label>)}
  </div>
  <p>Emails will contain only generic notice summaries, never private letters or draft contents. Sign-in and security emails are separate. Every activity email will include an unsubscribe link.</p>
 </section>
 <div className="save-row"><button>Save notification settings</button>{saved&&<span role="status">{saved}</span>}</div>
</form>}
  {tab==='quiet'&&<section className="settings-panel quiet-corners-room">
 <div className="section-heading"><div><p className="eyebrow">SILENCE WITHOUT EXILE</p><h2>Quiet Corners.</h2><p>Mute softly. Exile firmly. Keep both private and reversible.</p></div><span className="private-pill">PRIVATE</span></div>
 <div className="quiet-counts restored">
  <article><strong>{data.boundaries.filter(x=>x.muted&&!x.blocked).length}</strong><span>muted members</span></article>
  <article><strong>{data.boundaries.filter(x=>x.blocked).length}</strong><span>exiled members</span></article>
  <article><strong>{data.forumMutes.length}</strong><span>muted forum threads</span></article>
  <article><strong>{data.notifications.quiet_hours_enabled?'On':'Off'}</strong><span>quiet hours</span></article>
 </div>
 <div className="quiet-ledger restored">
  <section><div className="subhead-row"><div><p className="eyebrow">MEMBER BOUNDARIES</p><h3>Muted & exiled members.</h3></div><Link to="/search">Find members →</Link></div>
   {data.boundaries.length?<div className="boundary-list">{data.boundaries.map(row=><article key={row.other_user_id}><MemberAvatar as="div" className="mini-avatar" profile={row.profiles}/><div><strong>{row.profiles?.display_name||row.profiles?.username||'Palace member'}</strong><small>@{row.profiles?.username||'member'} · {row.blocked?'Exiled':row.muted?'Muted':'Open'}</small></div><div>{row.muted&&<button className="quiet-button" onClick={()=>restoreBoundary(row,'mute')}>Unmute</button>}{row.blocked&&<button className="quiet-button" onClick={()=>restoreBoundary(row,'block')}>Lift Exile</button>}</div></article>)}</div>:<p className="quiet-copy">No member boundaries are currently set.</p>}
  </section>
  <section><div className="subhead-row"><div><p className="eyebrow">MUTED DISCUSSIONS</p><h3>Forum threads you quieted.</h3></div><Link to="/palace-life">Open Palace Life →</Link></div>
   {data.forumMutes.length?<div className="muted-thread-list">{data.forumMutes.map(x=><article key={x.thread_id}><span>⌕</span><div><strong>Muted forum thread</strong><small>{new Date(x.created_at).toLocaleDateString()}</small></div><button className="quiet-button" onClick={()=>unmuteForum(x.thread_id)}>Unmute</button></article>)}</div>:<p className="quiet-copy">No forum threads are muted.</p>}
  </section>
 </div>
 {saved&&<div className="save-note">{saved}</div>}
</section>}
{tab==='storage'&&<section className="settings-panel storage-room-live">
 <div className="section-heading"><div><p className="eyebrow">KNOW WHAT YOU KEEP</p><h2>Storage & uploads.</h2><p>See the creative media attached to your Palace account without changing ownership or download permissions.</p></div></div>
 <div className="storage-overview-live">
  <div className="storage-orbit-live"><span>▧</span><strong>{data.storage.totalAssets}</strong><small>tracked uploaded assets</small></div>
  <div className="storage-breakdown-live">
   <article><span>Profile media</span><strong>{data.storage.profileAssets}</strong><i style={{width:Math.min(100,data.storage.totalAssets?data.storage.profileAssets/data.storage.totalAssets*100:0)+'%'}}/></article>
   <article><span>Story covers</span><strong>{data.storage.storyCovers}</strong><i style={{width:Math.min(100,data.storage.totalAssets?data.storage.storyCovers/data.storage.totalAssets*100:0)+'%'}}/></article>
   <article><span>Comic covers</span><strong>{data.storage.comicCovers}</strong><i style={{width:Math.min(100,data.storage.totalAssets?data.storage.comicCovers/data.storage.totalAssets*100:0)+'%'}}/></article>
   <article><span>Comic pages</span><strong>{data.storage.comicPages}</strong><i style={{width:Math.min(100,data.storage.totalAssets?data.storage.comicPages/data.storage.totalAssets*100:0)+'%'}}/></article>
  </div>
 </div>
 <div className="storage-rights-grid">
  <article><span>PROFILE</span><h3>Chamber media</h3><p>Profile and cover images remain tied to your own profile-media folder.</p><Link to="/chamber">Review chamber →</Link></article>
  <article><span>PROSE</span><h3>Story artwork</h3><p>Story covers stay separate from your manuscript and never transfer ownership.</p><Link to="/writing">Open Writing Chamber →</Link></article>
  <article><span>COMICS</span><h3>Original art stays protected</h3><p>Reader copies and original comic assets use separate storage paths and creator-controlled download rules.</p><Link to="/comics/studio">Open Comics Studio →</Link></article>
 </div>
 <div className="system-note"><strong>Storage controls do not silently change creator rights.</strong><p>Deleting or replacing media should remain a deliberate creator action. Download permissions are controlled per work or comic.</p></div>
</section>}
{tab==='account'&&<section className="data-control settings-panel account-control-room">
 <div className="account-security-card"><div><p className="eyebrow">ACCOUNT SECURITY</p><h2>Change Palace password</h2><p>Use a password created for The Starry Palace — never the password for your email inbox. If you entered the Palace by magic link and have never set a Palace password, leave the current-password field blank.</p></div><form className="password-change-form" onSubmit={changePassword}><label>Current Palace password <small>Leave blank if you do not have one.</small><input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} /></label><label>New Palace password<input type="password" autoComplete="new-password" minLength="8" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></label><button disabled={passwordBusy||!newPassword||!confirmPassword}>{passwordBusy?'Changing password…':'Change password'}</button></form></div>
 <div className="account-data-card"><p className="eyebrow">YOUR DATA</p><h2>Copies, departures & second thoughts</h2><p>Your private notes, drafts, messages and reading history are not public Palace property.</p><div className="data-actions"><button type="button" className="outline-button" onClick={exportData}>Request my data</button>{activeDeletion?<button type="button" className="outline-button" onClick={cancelDeletion}>Cancel deletion request</button>:<button type="button" className="quiet-button danger-action" onClick={beginDeletion}>Begin account deletion</button>}</div>{activeDeletion?<div className="deletion-status"><strong>Grace period active</strong><span>Scheduled for {new Date(data.deletion.scheduled_for).toLocaleDateString()}.</span></div>:<small>Deletion is deliberately not immediate. A 14-day grace period gives you time to change your mind.</small>}{data.exports?.length>0&&<div className="export-history"><small>LATEST DATA REQUEST</small><strong>{data.exports[0].format.toUpperCase()} · {data.exports[0].status.replaceAll('_',' ')}</strong><span>{new Date(data.exports[0].requested_at).toLocaleString()}</span></div>}</div>
 {saved&&<div className="save-note" role="status">{saved}</div>}
</section>}
 {tab==='system'&&<section className="settings-panel system-room"><div className="section-heading"><p className="eyebrow">SYSTEM STATUS</p><h2>The Palace machinery, in plain sight.</h2><p>This room explains which core systems your current session is using without exposing private credentials.</p></div><div className="system-grid"><article><span>AUTHENTICATION</span><strong>{session?'Connected':'Signed out'}</strong><p>Your current Palace session is managed through Supabase Auth.</p></article><article><span>DATABASE</span><strong>Connected</strong><p>Stories, comics, privacy, community, Treasury and activity use the Palace Supabase project.</p></article><article><span>LIVE SITE</span><strong>Render</strong><p>The production React build is deployed from the GitHub main branch.</p></article><article><span>THEME</span><strong>Nightfall / Daylight</strong><p>Your theme preference is stored locally on this device.</p></article></div><div className="system-note"><strong>No secret keys are displayed here.</strong><p>Browser-safe Supabase access is protected by Row Level Security; privileged keys remain outside the client.</p></div></section>}
 {tab==='guide'&&<section className="settings-panel welcome-guide"><div className="section-heading"><p className="eyebrow">WELCOME GUIDE</p><h2>How to move through the Palace.</h2></div><div className="guide-grid"><article><span>01</span><h3>Make a chamber</h3><p>Your member profile, privacy choices and creative identity begin in My Palace.</p><Link to="/chamber">Visit My Palace →</Link></article><article><span>02</span><h3>Read without pressure</h3><p>Save stories and comics, follow updates, and keep your reading history private.</p><Link to="/library">Open My Library →</Link></article><article><span>03</span><h3>Create privately first</h3><p>Draft prose or comics before publishing anything publicly.</p><Link to="/writing">Open Writing Chamber →</Link></article><article><span>04</span><h3>Choose your boundaries</h3><p>Use privacy, mute, Exile and message-request controls whenever you need them.</p><button onClick={()=>choose('privacy')}>Review privacy →</button></article><article><span>05</span><h3>Join gently</h3><p>Palace Life separates public Commons, smaller clubs, Moonlight chat and introductions.</p><Link to="/palace-life">Visit Palace Life →</Link></article><article><span>06</span><h3>Know the rules</h3><p>Palace Code and Council keep moderation visible, reviewable and appealable.</p><Link to="/code">Read the Palace Code →</Link></article></div></section>}
 {tab==='testing'&&<section className="settings-panel testing-room"><div className="section-heading"><p className="eyebrow">TESTING ROOM</p><h2>Check the doors before calling the Palace finished.</h2><p>This room is for your own launch testing. It does not publish test data automatically.</p></div><div className="testing-checklist"><article><strong>Account</strong><span className={session?'check-pass':'check-warn'}>{session?'Ready':'Needs sign-in'}</span><p>Sign in, sign out, refresh, then confirm your chamber still loads.</p></article><article><strong>Reading</strong><span className="check-pass">Available</span><p>Open a story and comic, advance progress, then confirm both return to My Library.</p></article><article><strong>Writing</strong><span className="check-pass">Available</span><p>Create a private draft and a private comic before testing publication.</p></article><article><strong>Boundaries</strong><span className="check-pass">Available</span><p>Test Mute, Exile, privacy visibility, Palace Letter requests and conversation controls.</p></article><article><strong>Treasury</strong><span className="check-pass">Available</span><p>Open the 600-treasure catalogue and claim the free monthly Lucky Draw once.</p></article><article><strong>Responsive layout</strong><span className="check-warn">Manual check</span><p>Review phone, tablet and desktop widths for clipping, overflow and hidden controls.</p></article></div></section>}
 </>}</State>
  <PalaceDialog open={deletionDialog} title="Begin account deletion?" eyebrow="ACCOUNT & DOWNLOADS" onClose={()=>setDeletionDialog(false)} actions={<><button className="quiet-button" onClick={()=>setDeletionDialog(false)}>Cancel</button><button className="danger-action" onClick={confirmDeletion}>Begin 14-day grace period</button></>}><p className="quiet-copy">Deletion is not immediate. A 14-day grace period begins first, and you can cancel during that period.</p></PalaceDialog>
 </Frame>
}
