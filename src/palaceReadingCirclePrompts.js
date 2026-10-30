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

/* Original session starters for invitation-only private circles.
   Each is a plain-text draft, not a poll or automated event. */
export const PALACE_READING_CIRCLE_KITS=Object.freeze([
 {id:'chapter-night',name:'Chapter night',label:'A chapter-by-chapter conversation',text:'✦ Chapter night\n\n1. What changed for the characters in this chapter?\n2. Which detail would you like to discuss?\n3. What are you looking forward to next?\n\nSpoilers: please mention the chapter you are discussing.'},
 {id:'character-debate',name:'Character debate',label:'Discuss motivations and difficult choices',text:'✦ Character debate\n\nWhich decision do you understand, even if you disagree with it? What do you think motivated that character?\n\nLet us disagree kindly and stay focused on the story.'},
 {id:'theory-night',name:'Theory night',label:'Make predictions without spoiling others',text:'✦ Theory night\n\nShare your predictions for the next chapter and one clue that supports them.\n\nPlease label spoilers and respect readers who are still catching up.'},
 {id:'writer-workshop',name:'Writer workshop',label:'Invite specific, constructive feedback',text:'✦ Writer workshop\n\nWhat worked especially well in this excerpt? Is there one moment you found confusing? What question would you ask the author?\n\nFeedback should be invited and constructive; no manuscript excerpts without permission.'}
]);
