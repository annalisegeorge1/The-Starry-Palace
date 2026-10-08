/**
 * Publication must not proceed on an old cloud response if the author edits
 * again while the save request is running. Keep this independent of the UI.
 */
export async function ensureChapterSavedForRelease({chapterId,save,isDirty,isSelected}={}){
 if(!chapterId||typeof save!=='function'||typeof isDirty!=='function'||typeof isSelected!=='function')
  throw new TypeError('A selected chapter and save guards are required.');
 await save();
 if(!isSelected(chapterId))
  throw new Error('The open chapter changed while saving. Return to the chapter and review it before publishing.');
 if(isDirty(chapterId))
  throw new Error('New edits were made while saving. Please save again and confirm the latest words before publishing.');
 return true;
}
