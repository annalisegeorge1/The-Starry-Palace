import {contrastRatio,pageSkinStyle} from './profileSkinModel';

export const PRISM_ACCENTS={silver:'#dde7f5',rose:'#f7bad5',mint:'#a7efdb',gold:'#f3d59f'};

export function prismAppearance(decor){
 const palette=decor?.prism_palette_data;
 const savedSkin=decor?.personal_skin;
 if(savedSkin?.appearance_mode==='none')return null;
 const skin=savedSkin?.appearance_mode==='palette'?null:pageSkinStyle(savedSkin);
 const validPalette=palette&&[palette.primary,palette.secondary,palette.accent].every(value=>/^#[0-9a-f]{6}$/i.test(value));
 if(!skin&&!validPalette)return null;
 const primary=skin?.['--member-skin-background']??palette.primary;
 const secondary=skin?.['--member-skin-surface']??palette.secondary;
 const accent=skin?.['--member-skin-accent']??PRISM_ACCENTS[decor.prism_accent]??palette.accent;
 const readable=background=>contrastRatio(background,'#ffffff')>=contrastRatio(background,'#000000')?'#ffffff':'#000000';
 const ink=skin?{}:{'--palette-panel-ink':readable(secondary),'--palette-ground-ink':readable(primary),'--palette-accent-ink':readable(accent)};
 return {kind:skin?'skin':'palette',style:{...skin,...ink,'--appearance-primary':primary,'--appearance-secondary':secondary,'--appearance-accent':accent}};
}
