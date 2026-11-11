// A version belongs to one loaded chapter. Queued saves share that version
// within this editor, while another device keeps its own last-read version.
export async function writeChapterVersion(client,chapterId,changes,version){
 let query=client.from('chapters').update(changes).eq('id',chapterId);
 if(version){
  if(version.chapterId!==chapterId||!version.updatedAt)throw Error('Reopen this chapter before saving.');
  query=query.eq('updated_at',version.updatedAt);
 }
 const {data,error}=await query.select().maybeSingle();
 if(error)throw error;
 if(!data)throw Error('The cloud chapter changed or is no longer editable. Export your draft, then reopen the chapter to compare versions.');
 if(version)version.updatedAt=data.updated_at;
 return data;
}
