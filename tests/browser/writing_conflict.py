"""Two isolated browser contexts, real editor and client, synthetic REST responses only."""
import re
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright

chapter = dict(id="c1", work_id="w1", title="Synthetic chapter", body_html="Initial text",
               position=1, status="draft", revision_note="", updated_at="2026-01-01T00:00:00Z")
checkpoint = dict(id="s1", chapter_id="c1", title="Checkpoint", label="Before edit",
                  body_html="Checkpoint text", revision_note="", word_count=2, created_at=chapter["updated_at"])
reads = []
writes = []
reject_write = False

def fixture_sql(statement, **values):
    args = ["psql", "-XAtq", "-d", "palace_writer_fixture", "-v", "ON_ERROR_STOP=1"]
    for name, value in values.items():
        args.extend(["-v", f"{name}={value}"])
    return subprocess.run(args, input=statement, text=True, check=True, capture_output=True).stdout.strip()

fixture_sql("CREATE TABLE chapters (id text PRIMARY KEY, body_html text NOT NULL, updated_at timestamptz NOT NULL);")
fixture_sql("INSERT INTO chapters VALUES (:'id', :'body', :'stamp');",
            id=chapter["id"], body=chapter["body_html"], stamp=chapter["updated_at"])

def api(route):
    request = route.request
    url = urlsplit(request.url)
    query = parse_qs(url.query)
    table = url.path.split("/")[-1]
    data = []
    if table == "works":
        data = [dict(id="w1", author_id="owner", slug="synthetic", title="Synthetic work",
                     work_type="original", chapters=[dict(chapter)])]
    elif table == "chapters":
        if request.method == "PATCH":
            expected = query.get("updated_at", [None])[0]
            assert expected is not None, "Missing cloud version predicate"
            if reject_write:
                route.fulfill(status=400, json={"message":"Simulated save failure"})
                return
            assert query["id"] == ["eq.c1"] and expected.startswith("eq.")
            patch = request.post_data_json
            result = fixture_sql(
                "UPDATE chapters SET body_html=:'body', updated_at=:'stamp' "
                "WHERE id=:'id' AND updated_at=:'previous'::timestamptz RETURNING id;",
                body=patch["body_html"], stamp=patch["updated_at"], id=query["id"][0][3:], previous=expected[3:])
            matches = result == "c1"
            writes.append(matches)
            if matches:
                chapter.update(request.post_data_json)
                data = [chapter]
        else:
            data = [chapter]
    elif table == "chapter_revision_snapshots":
        fields = query["select"][0].split(",")
        reads.append(fields)
        if "id" in query:
            assert query["id"] == ["eq.s1"] and query["chapter_id"] == ["eq.c1"]
        if "label" not in query:
            data = [{key: value for key, value in checkpoint.items() if key in fields}]
    route.fulfill(json=data, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"})

def install_fixture(context):
    context.route("http://127.0.0.1:4174/**", api)
    # Replace only the test server's auth module; the test has no Palace credentials.
    context.route(re.compile(r"^http://127\.0\.0\.1:4173/src/auth\.jsx(?:\?.*)?$"),
                  lambda route: route.fulfill(content_type="application/javascript",
                         body="export const useAuth=()=>({session:{user:{id:'owner'}}}); export const AuthProvider=({children})=>children; export const ProtectedRoute=AuthProvider;"))
    page = context.new_page()
    page.goto("http://127.0.0.1:4173/tests/browser/writing.html")
    expect(page.locator('[contenteditable=true]').first).to_have_text("Initial text", timeout=45000)
    return page

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    first, second = (install_fixture(browser.new_context()) for _ in range(2))
    assert reads == [], "Opening the writing desk fetched history"
    a = first.locator('[contenteditable=true]').first
    b = second.locator('[contenteditable=true]').first
    a.fill("Cloud version saved by A")
    expect(first.locator('.writer-toolbar-save-state')).to_contain_text("Saved to Palace")
    b.fill("Unsaved version retained by B")
    expect(second.locator('.writer-toolbar-save-state')).to_contain_text("Cloud save failed")
    expect(b).to_have_text("Unsaved version retained by B")
    assert writes == [True, False] and "Cloud version saved by A" in chapter["body_html"]
    assert "Unsaved version retained by B" in second.evaluate("localStorage.getItem('palace-recovery:c1')")
    second.get_by_label("More chapter actions").click()
    with second.expect_download() as download:
        second.get_by_role("button", name=re.compile("Download backup .txt")).click()
    assert "Unsaved version retained by B" in Path(download.value.path()).read_text()
    first.get_by_label("More chapter actions").click()
    first.get_by_role("button", name="Revision history", exact=True).click()
    review = first.get_by_role("button", name="Compare or restore")
    expect(review).to_be_visible()
    assert len(reads) == 2 and all("body_html" not in fields for fields in reads)
    review.click()
    restore = first.get_by_role("button", name="Restore to editor", exact=True)
    expect(restore).to_be_visible()
    assert len(reads) == 3 and "body_html" in reads[-1]
    restore.click()
    expect(a).to_have_text("Checkpoint text")
    assert "Cloud version saved by A" in chapter["body_html"]
    expect(first.get_by_role("button", name="Save this chapter now")).to_be_visible()
    first.get_by_role("button", name="Save this chapter now").click()
    expect(first.locator('.writer-toolbar-save-state')).to_contain_text("Saved to Palace")
    first.reload()
    expect(a).to_have_text("Checkpoint text")
    reject_write = True
    a.fill("Draft kept during a failed request")
    expect(first.locator('.writer-toolbar-save-state')).to_contain_text("Cloud save failed")
    expect(a).to_have_text("Draft kept during a failed request")
    assert fixture_sql("SELECT body_html FROM chapters WHERE id='c1'") == "Checkpoint text"
    reject_write = False
    first.get_by_role("button", name="Save this chapter now").click()
    expect(first.locator('.writer-toolbar-save-state')).to_contain_text("Saved to Palace")
    assert "Draft kept during a failed request" in fixture_sql("SELECT body_html FROM chapters WHERE id='c1'")
    browser.close()
