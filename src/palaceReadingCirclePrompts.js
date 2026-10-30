/* Original reading-circle questions. Selecting one saves an editable draft only. */
export const PALACE_READING_CIRCLE_PROMPTS=Object.freeze([
 {id:'moment',category:'Characters',text:'Which moment stayed with you the longest, and why?'},
 {id:'choice',category:'Characters',text:'Which character made the hardest choice in this chapter?'},
 {id:'mystery',category:'Plot',text:'What detail do you think will matter later in the story?'},
 {id:'theory',category:'Plot',text:'What is your prediction for the next chapter?'},
 {id:'setting',category:'Worldbuilding',text:'What made this story world feel especially vivid?'},
 {id:'voice',category:'Writing',text:'Was there a line or scene you found particularly memorable?'}
]);
export function makePalaceCircleDraft(prompt,current=''){
 const text=String(prompt||'').trim().slice(0,3000);
 const existing=String(current||'').trim();
 if(!text)return existing;
 if(!existing)return text;
 return (existing+'\n\n'+text).slice(0,3000);
}
