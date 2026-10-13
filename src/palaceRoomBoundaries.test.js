import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const live=readFileSync('src/liveRooms.jsx','utf8');
const settings=readFileSync('src/SettingsRoom.jsx','utf8');
const primitives=readFileSync('src/PalaceLivePrimitives.jsx','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Palace room structural boundaries',()=>{
 it('keeps old Settings route imports valid without copying the page into liveRooms',()=>{
  expect(main).toContain("} from './liveRooms'");
  expect(live).toContain("export {SettingsLive} from './SettingsRoom';");
  expect(live).not.toContain('export function SettingsLive({Frame})');
  expect(settings).toContain('export function SettingsLive({Frame})');
  expect(settings).toContain('SETTINGS_TABS');
 });
 it('isolates account and profile settings without importing the gigantic room bundle',()=>{
  expect(settings).toContain("from './palaceData'");
  expect(settings).toContain("from './PalaceLivePrimitives'");
  expect(settings).not.toContain("from './liveRooms'");
  expect(settings).toContain('updatePrivacy(');
  expect(settings).toContain('updateNotifications(');
  expect(settings).toContain('supabase.auth.updateUser(');
  expect(settings).toContain('cancelAccountDeletion(');
 });
 it('shares one accessible dialog and room state implementation across pages',()=>{
  expect(primitives).toContain('export function PalaceDialog(');
  expect(primitives).toContain('export function State(');
  expect(primitives).toContain('aria-modal="true"');
  expect(live).toContain("import {PalaceDialog,State} from './PalaceLivePrimitives'");
  expect(live).not.toContain('function PalaceDialog(');
  expect(live).not.toContain('function State(');
 });
});
