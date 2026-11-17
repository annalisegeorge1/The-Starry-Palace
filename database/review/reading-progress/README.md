# Reading-progress regression rehearsal

`rehearse.mjs` creates a disposable local PostgreSQL cluster with synthetic
identities and owner RLS. It accepts a directory containing `install.sql` and
`rollback.sql`, never a database connection URL. Neither script is an automatic
production migration.

The `Reading progress concurrency rehearsal` workflow runs this existing fixture
when its SQL, reader session, data client or chapter integration changes. Two
independent connections race to insert and update the same checkpoint. Assertions
also cover stale writes, intentional rereading, completion retention, legacy
clients, account isolation, chapter deletion and rollback with preserved rows.

To run without adding application dependencies, from the repository root:

```bash
set -euo pipefail
qa_dir="$(mktemp -d)"
trap 'rm -rf "$qa_dir"' EXIT
cp database/review/reading-progress/{*.sql,rehearse.mjs} "$qa_dir/"
npm install --prefix "$qa_dir" --no-audit --no-fund --save-exact embedded-postgres@18.6.0-beta.19 pg@8.23.1
node "$qa_dir/rehearse.mjs"
```

Run as an ordinary user, as PostgreSQL refuses to start as root. Success requires
exit code zero and the final `PASS concurrent creation and updates...` line.
This protects the isolated concurrency contract; it does not establish hosted
schema parity, production installation, Auth integration or browser behavior.
Any production SQL operation remains a separate approval and verification step.
