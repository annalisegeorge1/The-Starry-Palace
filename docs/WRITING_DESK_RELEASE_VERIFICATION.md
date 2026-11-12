# Writing Desk release verification • 11 November 2026 (Tobago)

PR #299 remains in draft. The last application-code change is 5861f1dd2e096273650bc746ec22593cde33997b. GitHub runs 43140091844 and 43140091857 passed its merge candidate, including 1,644 tests / 340 files, production build and two-context Chrome/PostgreSQL rehearsal. The head-only local run passed 1,636 tests / 338 files. The browser fixture substitutes Auth and REST. The added restart check uses a persistent Chrome profile across two processes.

## Security Staging

The managed SQL connection timed out. The regional project reported ACTIVE_HEALTHY, PostgreSQL 17, ca-central-1. The credentialed Auth health and settings endpoints and the zero-row chapters/id query returned 200. The normal editor projection failed because chapters.title is missing (42703). The work query with the author-profile relationship failed (PGRST200). The revision snapshot table was absent from the API schema cache (PGRST205), as were profiles and notifications. Repairing connectivity alone cannot unblock this PR. Email confirmation was required, and Google was disabled on staging. Regional pooler and direct hostnames did not resolve from the test shell. The logs aggregation returned no rows. Connection usage, authenticated pooler reachability and the cause of the managed SQL timeout are unknown.

## Isolated authorization evidence

GoTrue v2.190.0 issued tokens to four disposable email accounts. PostgREST 16.5 validated those tokens and applied PostgreSQL 17.11 RLS. The four application tables were works, chapters, work_collaborators and chapter_revision_snapshots. Column types/defaults, table grants, 15 policies, six relevant permission functions and their effective role grants came from production catalog metadata. The fixture included internal constraints and foreign keys between these tables. Synthetic ages were seeded for the role matrix. External profile relationships, production triggers, search RPCs, scheduler, Realtime and storage were outside this fixture.

| Actor | Private chapter read | Conditional edit |
| --- | --- | --- |
| Owner | Visible | Saved |
| Accepted editor | Visible | Saved after reopening the current version |
| Invited editor, still pending | Hidden | Zero rows changed |
| Unrelated member | Hidden | Zero rows changed |
| Guest | Hidden | Zero rows changed |

The database permits co_writer and editor roles. Pending status was tested as the restricted case. Separate password sessions of the owner opened the same baseline. The actual PR client rejected the stale save and preserved the newer body. A million-character synthetic save returned 210 bytes of JSON metadata versus 1,000,356 bytes for the full row (uncompressed). The body was checked via an independent read. The synthetic REST journey verified draft, scheduling metadata, public slug lookup, readable chapter, updated text, guest age restriction, and withdrawal. It did not run the scheduled job or the user-facing Reading Rooms/search integration.

## Release gates still open

1. Restore access to a dedicated, complete non-production schema. Check the actual nested editor and revision projections before provisioning accounts. Match production profile relationships, triggers, storage, scheduler and discovery functions with synthetic fixtures.
2. Use the real editor with separate signed-in browser sessions, accepted collaborators of both roles, a pending collaborator, an unrelated member and a guest. Verify local export, reopening and conflict resolution in this configuration.
3. Exercise the scheduled publisher, guest Reading Rooms and search, authorized reader, update and withdrawal. Publication currently performs separate chapter and work updates. Verify behavior on partial failure before approving release.
4. Verify notifications, duplicate reward handling, and the publication restrictions for collaborators on the complete schema. Preserve owner control. Review consequential database authorization changes separately.
5. Recheck required checks on the final head and merge candidate before release. For a release, capture the active Worker and rollback version again, and run the first live disposable smoke test before declaring success.
