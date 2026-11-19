// The thread builder needs visible ancestors even when a busy work crosses
// the REST row limit. Use immutable ordering keys instead of offset pages.
export async function loadDiscussionComments(client, workId, revisionFields='') {
 const pageSize=250;
 const columns='id,work_id,chapter_id,author_id,parent_comment_id,comment_type,body,spoiler,status,created_at'
  +revisionFields+',profiles!comments_author_id_fkey(id,username,display_name,avatar_url)';
 const rows=[];
 let last;
 for(;;){
  let query=client.from('comments').select(columns).eq('work_id',workId)
   .order('created_at').order('id').limit(pageSize);
  if(last){
   const time=JSON.stringify(last.created_at);
   query=query.or('created_at.gt.'+time+',and(created_at.eq.'+time+',id.gt.'+last.id+')');
  }
  const {data,error}=await query;
  if(error)throw error;
  rows.push(...data);
  if(data.length<pageSize)return rows;
  last=data[data.length-1];
 }
}
