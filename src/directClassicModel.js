// A hosted historic work opens directly into its dedicated reading experience.
// Other archive records remain in the descriptive Lost Works collection.
export function directClassicHref(record){
 const slug=String(record?.slug||'').trim();
 return slug?'/classic/'+encodeURIComponent(slug):'/lost-works';
}
export function canReadHostedClassic(record){
 return Boolean(record&&record.publication_status!=='draft'&&
  (record.host_mode==='full'&&record.rights_status==='public_domain_verified'||record.host_mode==='excerpt'));
}
