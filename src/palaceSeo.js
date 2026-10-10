const ORIGIN = 'https://thestarrypalace.com';
const BRAND = 'The Starry Palace';
const DEFAULT_DESCRIPTION = 'Discover original fiction, fanworks, comics and classics. Read, write and gather with a community of storytellers at The Starry Palace.';

function clean(value, limit = 170) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, limit);
}
const urlFor = path => ORIGIN + (path.startsWith('/') ? path : '/' + path);
const result = (title, description, path, index = true, type = 'website', image = '') => ({
  title: clean(title, 115) + ' | ' + BRAND,
  description: clean(description, 165) || DEFAULT_DESCRIPTION,
  url: urlFor(path),
  robots: index ? 'index,follow' : 'noindex,follow',
  type,
  image: index && /^https:\/\//i.test(image || '') ? image : ''
});
const publicWork = work => work?.publication_status === 'published' && work?.visibility === 'public';

export function storySeo(work) {
  if (!work?.slug) return null;
  const index = publicWork(work);
  const author = clean(work.profiles?.display_name || work.profiles?.username || 'a Palace writer', 60);
  return result(work.title || 'Story', work.summary || ('Read ' + (work.title || 'this story') + ' by ' + author + '.'), '/work/' + encodeURIComponent(work.slug), index, 'article', work.cover_url);
}

export function chapterSeo(work, chapter) {
  if (!work?.slug || !chapter?.id) return null;
  const index = publicWork(work) && chapter.status === 'published';
  return result((chapter.title || 'Chapter') + ' — ' + (work.title || 'Story'), work.summary || ('Read ' + (chapter.title || 'this chapter') + ' from ' + (work.title || 'a Palace story') + '.'), '/work/' + encodeURIComponent(work.slug) + '/chapter/' + encodeURIComponent(chapter.id), index, 'article', work.cover_url);
}

export function memberSeo(profile) {
  if (!profile?.username) return null;
  const name = profile.display_name || profile.username;
  const index = profile.visibility === 'public';
  return result(name + ' — Writer Profile', profile.bio || profile.status_line || ('Discover stories and creative work by ' + name + ' on The Starry Palace.'), '/member/' + encodeURIComponent(profile.username), index, 'profile', profile.avatar_url);
}

const PUBLIC_ROUTES = {
  '/': ['Read, Write & Gather', DEFAULT_DESCRIPTION],
  '/reading': ['Reading Room', 'Browse original stories, fanworks and literary worlds shared by Palace writers.'],
  '/writers': ['For Writers', 'Share stories, create worlds, and find your literary community.'],
  '/fandoms': ['Fandom Atlas', 'Explore fandoms, discover fanworks, and find stories by the worlds you love.'],
  '/comics': ['Comics', 'Find original comics and illustrated stories at The Starry Palace.'],
  '/series': ['Story Series', 'Explore collections and connected stories by Palace writers.'],
  '/events': ['Events & Celebrations', 'Discover literary events, creative challenges and celebrations.'],
  '/lost-works': ['Lost Works & Classics', 'Explore archival stories and classic literature in the Palace.'],
  '/honour': ['Throne of Honor', 'Celebrate writers and creative achievements at The Starry Palace.'],
  '/code': ['Community Guidelines', 'Read the community guidelines and standards of The Starry Palace.'],
  '/tags': ['Story Tags', 'Explore stories through tags and reading interests.'],
  '/search': ['Search Stories', 'Find writers, stories, comics and fandoms at The Starry Palace.']
};

export function routeSeo(pathname = '/') {
  const path = typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/';
  const info = PUBLIC_ROUTES[path];
  if (info) return result(info[0], info[1], path);
  // Public detail pages opt in only after the fetched record confirms it is public.
  return result('The Starry Palace', DEFAULT_DESCRIPTION, path, false);
}
