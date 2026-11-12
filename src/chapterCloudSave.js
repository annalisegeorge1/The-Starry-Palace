// A version belongs to one loaded chapter. Queued saves share that version
// within this editor, while another device keeps its own last-read version.
export async function writeChapterVersion(client,chapterId,changes,version){
 let query=client.from('chapters').update(changes).eq('id',chapterId);
 if(version){
  if(version.chapterId!==chapterId||!version.updatedAt)throw Error('Reopen this chapter before saving.');
  query=query.eq('updated_at',version.updatedAt);
 }
 // The open editor already holds the manuscript. Only refresh its cloud metadata.
 const result=version ? query.select('id,title,position,status,revision,word_count,scheduled_for,published_at,updated_at') : query.select();
 const {data,error}=await result.maybeSingle();
 if(error)throw error;
 if(!data){
  const conflict=Error('The cloud chapter changed or is no longer editable. Export your draft, then reopen the chapter to compare versions.');
  conflict.code='CHAPTER_WRITE_REJECTED';
  throw conflict;
 }
 if(version)version.updatedAt=data.updated_at;
 return data;
}
