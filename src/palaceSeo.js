const ORIGIN = 'https://thestarrypalace.com';
const BRAND = 'The Starry Palace';
const DEFAULT_DESCRIPTION = 'Read original fiction, fanfiction, poetry and comics, or publish your own stories with creator-controlled access at The Starry Palace writing community.';

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
  '/': ['Read & Publish Stories, Fanfiction & Poetry', DEFAULT_DESCRIPTION],
  '/reading': ['Read Original Stories, Fanfiction & Poetry', 'Find original fiction, fanfiction, poetry and serialized stories. Browse published writing and discover new authors in The Starry Palace Reading Rooms.'],
  '/writers': ['Publish Original Fiction & Fanfiction', 'Publish original stories, fanfiction and poetry on The Starry Palace. Draft privately, organize chapters, choose reader access and keep your rights.'],
  '/fandoms': ['Explore Fanfiction by Fandom', 'Browse fanfiction and fandoms in The Starry Palace, then discover published fanworks through fandom tags and reading collections.'],
  '/comics': ['Read Comics & Illustrated Stories', 'Discover comics and illustrated storytelling from Palace creators and explore the Comics Gallery.'],
  '/series': ['Read Story Series & Serialized Fiction', 'Explore connected stories, series and serialized fiction by writers in The Starry Palace.'],
  '/events': ['Writing Events & Creative Challenges', 'Discover literary gatherings, creative writing challenges and cultural celebrations at The Starry Palace.'],
  '/lost-works': ['Classic Literature & Lost Works', 'Browse classic literature and preserved works in The Starry Palace reading archive.'],
  '/honour': ['Writer Achievements & Recognition', 'Celebrate writers and creative achievements in The Starry Palace community.'],
  '/code': ['Community Rules & Content Policy', 'Read the Palace Code and learn about creative freedom, content ratings, safety rules and respectful community conduct.'],
  '/tags': ['Explore Story Tags & Reading Interests', 'Find fiction and fanfiction by story tags, themes, relationships and fandoms at The Starry Palace.'],
  '/search': ['Search Stories & Writers', 'Search The Starry Palace for published stories, writers, comics and fandoms.']
};

export function routeSeo(pathname = '/') {
  const path = typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/';
  const info = PUBLIC_ROUTES[path];
  if (info) return result(info[0], info[1], path, path !== '/search');
  // Public detail pages opt in only after the fetched record confirms it is public.
  return result('The Starry Palace', DEFAULT_DESCRIPTION, path, false);
}
