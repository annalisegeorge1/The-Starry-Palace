# Palace offline and maintenance screens

The public pages are independent of React, Supabase, and remote fonts:
- `/offline.html` — **The Palace has lost its moonlight.**
- `/maintenance.html` — **The Palace is being tended.**

The service worker (`/palace-sw.js`) caches only the offline page and its
public styling/favicon when a browser visits while online. Subsequent failed
**document navigation** requests can display the cached page offline. A first
visit with no connection cannot install a service worker or load the site.

The offline notice inside the existing app responds to browser connectivity
events but **never** navigates, reloads, or writes to a user's draft. The
browser's online/offline indicator is advisory; it cannot guarantee that the
site or Supabase is reachable. The worker never caches private pages, API
responses, or user-generated content. A successful server response (including
a 503 maintenance response) passes through normally.

Maintenance is **not enabled**. The maintenance page is available at its URL
without redirecting normal visitors. For actual planned downtime, configure
the existing edge Worker to return the maintenance HTML with HTTP 503 and
`Retry-After` for the intended navigation requests, while allowing requests
for `/maintenance.html`, `/palace-status.css`, and `/favicon.svg` through.
Test this rule and its rollback before activation; never change DNS merely
to show the page. Avoid intercepting API calls used to save drafts, and do not
promise draft persistence when there is no connectivity.

To test offline navigation: visit the site online, allow service-worker
installation, disconnect, then navigate to a Palace route. Expect the cached
public offline page. To test maintenance copy, visit `/maintenance.html`
while online. Restore connectivity before testing its home link.
