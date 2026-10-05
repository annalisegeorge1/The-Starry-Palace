import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assets from './courtAssetIntegrity.json';
it('ships all eleven complete approved badge and court PNG files',()=>{
 expect(assets).toHaveLength(11);
 for(const asset of assets){
  const data=readFileSync(asset.path);
  expect(data.length,asset.path).toBe(asset.size);
  expect(data.subarray(-8).toString('hex'),asset.path).toBe('49454e44ae426082');
  const hash=createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
  expect(hash,asset.path).toBe(asset.sha);
 }
});
