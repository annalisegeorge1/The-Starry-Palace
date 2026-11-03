import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const schema=readFileSync(resolve(process.cwd(),'docs/palace-observatory-phase3-schema-proposal.sql'),'utf8');
const data=readFileSync(resolve(process.cwd(),'src/palaceObservatoryIssuesData.js'),'utf8');

describe('Observatory issue-tracker release and privacy boundaries',()=>{
 it('leaves the proposed database schema unapplied and avoids direct Storage bucket writes',()=>{
  expect(schema).toContain('REVIEW ONLY. NOT APPLIED TO PRODUCTION OR STAGING');
  expect(schema).not.toMatch(/INSERT\s+INTO\s+storage\.buckets\b/i);
  expect(schema).toContain('Supabase Storage API/Dashboard');
 });
 it('requires the Owner role for issue, event, evidence and Storage policies',()=>{
  const policyBlocks=schema.split(/CREATE POLICY /).slice(1);
  expect(policyBlocks.length).toBeGreaterThanOrEqual(8);
  for(const policy of policyBlocks){
   expect(policy).toContain("private.has_platform_role(ARRAY['owner']::text[])");
  }
  expect(schema).toMatch(/REVOKE ALL ON TABLE public\.observatory_issues/);
  expect(schema).not.toMatch(/GRANT\s+(ALL|UPDATE|DELETE|INSERT)\s+ON\s+public\.observatory_issue_events\s+TO\s+authenticated/i);
 });
 it('never grants Owner clients permission to delete or rewrite audit events',()=>{
  expect(schema).toMatch(/GRANT SELECT ON public\.observatory_issue_events TO authenticated/);
  expect(schema).not.toMatch(/CREATE POLICY [^\n]* ON public\.observatory_issue_events\s+FOR (UPDATE|DELETE|INSERT)/i);
  expect(schema).toContain('changed_fields text[]');
  expect(schema).toContain('SECURITY DEFINER SET search_path');
 });
 it('binds private evidence paths to issue IDs and forbids screenshot overwrites',()=>{
  expect(schema).toContain("split_part(file_path,'/',1)=issue_id::text");
  expect(schema).toContain("split_part(name,'/',1)");
  expect(schema).not.toMatch(/CREATE POLICY [^\n]* ON storage\.objects\s+FOR (UPDATE|DELETE)/i);
  expect(data).toContain('upsert:false');
  expect(data).toContain('observatoryInspectScreenshot(file)');
  expect(data).not.toMatch(/service.role|service_role|secret_key/i);
 });
});
