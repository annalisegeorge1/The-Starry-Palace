/** Throttle background unread-count requests without changing route loading. */
export const PALACE_SHELL_BADGE_INTERVAL_MS=20000;
export function shouldRefreshShellBadges(lastAttempt,now){
 const last=Number(lastAttempt),time=Number(now);
 if(!Number.isFinite(time))return false;
 return !Number.isFinite(last)||last<=0||time-last>=PALACE_SHELL_BADGE_INTERVAL_MS||time<last;
}
