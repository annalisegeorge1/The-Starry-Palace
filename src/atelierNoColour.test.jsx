import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import MemberChamberDecor from './MemberChamberDecor';
import {applyAtelierColour,getPrismState} from './memberChamberDecorData';

vi.mock('./memberChamberDecorData',()=>({applyAtelierColour:vi.fn(),getPrismState:vi.fn()}));
vi.mock('./ChamberFramePicker',()=>({default:()=>null}));
vi.mock('./MemberPageSkinImporter',()=>({default:()=>null}));

it('previews No colour before applying and retains the ornament and gallery settings',async()=>{
 const decor={user_id:'example',prism_palette:'moonwater',backdrop:'midnight',ornament:'stars',gallery_layout:'classic',
  prism_catalogue:[{slug:'moonwater',name:'Moonwater',primary:'#164960',secondary:'#80E1EA',accent:'#A6FFF3',unlocked:true}]};
 const updated={...decor,personal_skin:{appearance_mode:'none'}};
 getPrismState.mockResolvedValue(updated);
 const onSaved=vi.fn();
 render(<MemberChamberDecor decor={decor} own onSaved={onSaved}/>);
 fireEvent.click(screen.getByRole('button',{name:'Open Prism Atelier'}));
 fireEvent.click(screen.getByRole('button',{name:/No colour.*Original Palace theme/}));
 expect(applyAtelierColour).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Apply this look ✦'}));
 await waitFor(()=>expect(onSaved).toHaveBeenCalledWith(updated));
 expect(applyAtelierColour).toHaveBeenCalledWith('none','soft','harmony','midnight','stars','classic');
});
