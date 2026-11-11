import {act,renderHook,waitFor} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {useMemberAppearance,APPEARANCE_CHANGED} from './useMemberAppearance';
import {getMemberAppearance} from './memberChamberDecorData';
import {prismAppearance} from './prismAppearance';
import {SKIN_DEFAULTS} from './profileSkinModel';

vi.mock('./memberChamberDecorData',()=>({getMemberAppearance:vi.fn()}));
const decor={user_id:'me',prism_palette_data:{primary:'#164046',secondary:'#356467',accent:'#ace3bf'},prism_accent:'gold'};

it('uses validated skin colours, then returns to the worn palette and accent',()=>{
 expect(prismAppearance({...decor,personal_skin:{colors:SKIN_DEFAULTS}}).style['--appearance-accent']).toBe(SKIN_DEFAULTS.accent.toUpperCase());
 expect(prismAppearance({...decor,personal_skin:{colors:{accent:'red'}}}).style['--appearance-accent']).toBe('#f3d59f');
 expect(prismAppearance({})).toBeNull();
});

it('suspends saved skins for No colour and returns exact palette values when worn',()=>{
 const skin={colors:SKIN_DEFAULTS,appearance_mode:'none'};
 expect(prismAppearance({...decor,personal_skin:skin})).toBeNull();
 const look=prismAppearance({...decor,personal_skin:{...skin,appearance_mode:'palette'}});
 expect(look.style['--appearance-secondary']).toBe('#356467');
 expect(look.style['--palette-panel-ink']).toBe('#ffffff');
 expect(look.style['--palette-accent-ink']).toBe('#000000');
});
it('keeps browsing colours tied to the viewer across saves, late loads and sign-out',async()=>{
 let finish;
 getMemberAppearance.mockReturnValueOnce(new Promise(r=>{finish=r})).mockResolvedValue(null);
 const hook=renderHook(({id})=>useMemberAppearance(id),{initialProps:{id:'me'}});
 act(()=>window.dispatchEvent(new CustomEvent(APPEARANCE_CHANGED,{detail:{...decor,user_id:'visitor'}})));
 expect(hook.result.current).toBeNull();
 act(()=>window.dispatchEvent(new CustomEvent(APPEARANCE_CHANGED,{detail:decor})));
 await act(async()=>finish(null));
 expect(hook.result.current.style['--appearance-primary']).toBe('#164046');
 hook.rerender({id:undefined});
 expect(hook.result.current).toBeNull();
 hook.rerender({id:'visitor'});
 await waitFor(()=>expect(getMemberAppearance).toHaveBeenCalledWith('visitor'));
 expect(hook.result.current).toBeNull();
 hook.unmount();
});

it('uses the original Palace appearance when a palette was never chosen',()=>{
 const unchosen={...decor,prism_colour_chosen:false};
 expect(prismAppearance(unchosen)).toBeNull();
 expect(prismAppearance({...unchosen,personal_skin:{colors:SKIN_DEFAULTS,appearance_mode:'skin'}}).kind).toBe('skin');
 expect(prismAppearance({...unchosen,prism_colour_chosen:true}).kind).toBe('palette');
});
