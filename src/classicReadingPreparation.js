import {structureClassicText} from './classicTextStructure';
import {paginateClassicBlocks,classicContents,firstClassicStoryBlock,classicStoryPage} from './archiveReaderModel';

/** Pure preparation. Retains all source blocks in order but avoids duplicating
 * the unsplit blocks array in component state. The pages are display-only. */
export function prepareClassicReading(source=''){
 const blocks=structureClassicText(source);
 const storyBlock=firstClassicStoryBlock(blocks);
 const pages=paginateClassicBlocks(blocks,36,storyBlock);
 return {pages,contents:classicContents(pages,storyBlock),storyPage:classicStoryPage(pages,storyBlock)};
}
export const CLASSIC_BACKGROUND_PARSE_THRESHOLD=180000;
