import {prepareClassicReading} from './classicReadingPreparation';

// Hosted classic texts can be several megabytes. Prepare the display pages
// off the UI thread so mobile scrolling and navigation stay responsive.
self.onmessage=event=>{
 try{
  self.postMessage({ok:true,result:prepareClassicReading(event.data)});
 }catch(e){
  self.postMessage({ok:false,message:'This edition could not be prepared.'});
 }
};
