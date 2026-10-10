import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const shell = readFileSync(resolve(process.cwd(), 'src/main.jsx'), 'utf8');
const drawer = readFileSync(resolve(process.cwd(), 'src/PalaceChatDrawer.jsx'), 'utf8');

describe('Palace chat cleanup', () => {
  it('defers the heavy chat UI instead of loading it for every public visitor', () => {
    expect(shell).not.toContain("import PalaceChatDrawer from './PalaceChatDrawer'");
    expect(shell).toContain("importWithRecovery(()=>import('./PalaceChatDrawer'))");
    expect(shell).toContain('if(!session?.user?.id)return null');
    expect(shell).toContain('<PalaceChatDrawerLazy userId={session.user.id}/>');
  });
  it('retains existing chat history, group-chat controls, and privacy', () => {
    expect(drawer).toContain('watchPalaceChatRoom');
    expect(drawer).toContain('createPalaceGroupChat');
    expect(drawer).toContain('getPalaceGroupMessages');
    expect(drawer).toContain('sendPalaceGroupMessage');
    expect(drawer).toContain("if(!userId||dataOwner!==userId)return null");
  });
});
