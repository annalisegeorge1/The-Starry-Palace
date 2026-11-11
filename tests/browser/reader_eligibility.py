"""Built Palace UI with disposable edition records and loopback-only REST fixtures."""
from urllib.parse import parse_qs, urlsplit
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

class Editions:
    def __init__(self):
        self.body_requests = 0
        self.retry = True

    def respond(self, route):
        url = urlsplit(route.request.url)
        table = url.path.rsplit("/", 1)[-1]
        query = parse_qs(url.query)
        data = []
        if table == "archive_records" and "slug" in query:
            slug = query["slug"][0][3:]
            data = [dict(id=slug, slug=slug, title="Synthetic edition", minimum_reader_age=18 if slug=="adult" else 13,
                         publication_status="published", rights_status="public_domain_verified" if slug=="adult" else "licensed",
                         verified_at="2026-01-01", host_mode="full", creator_name="Fixture author")]
        elif table == "archive_rights_records":
            assert query["limit"] == ["1"] and len(query["or"]) == 2
            if query["record_id"] == ["eq.retry"] and self.retry:
                self.retry = False
                route.fulfill(status=400,json={"message":"Synthetic internal detail"})
                return
            if query["record_id"] != ["eq.expired"]:
                data = [{"id":"current-grant"}]
        elif table == "archive_texts":
            self.body_requests += 1
            data = [dict(body_text="A synthetic paragraph for the reader rehearsal.",word_count=8)]
        elif table == "open_adult_archive":
            self.body_requests += 1
            data = [dict(body_text="Adult fixture content.",word_count=3)]
        route.fulfill(json=data)

def assert_inside(page, locator):
    box = locator.bounding_box()
    assert box and box["width"] > 0 and box["x"] >= 0 and box["x"]+box["width"] <= page.viewport_size["width"]+1
    return box

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome")
    Path("reader-qa").mkdir(exist_ok=True)
    for width,height,mode in [(390,844,"midnight"),(768,1024,"daylight"),(1440,900,"night")]:
        context = browser.new_context(viewport=dict(width=width,height=height),is_mobile=width<500,has_touch=width<900)
        editions = Editions()
        context.add_init_script(f"localStorage.setItem('palace-theme','{mode}')")
        context.route("http://127.0.0.1:4174/**", editions.respond)
        page = context.new_page()
        page.goto("http://127.0.0.1:4173/classic/expired")
        expect(page.get_by_role("heading",name="This hosted edition isn't available to read here.")).to_be_visible()
        assert editions.body_requests == 0
        page.goto("http://127.0.0.1:4173/classic/adult")
        confirm = page.get_by_role("button",name="I confirm I am 18 or older")
        leave = page.get_by_role("link",name="I am under 18 · Return to Reading Rooms")
        expect(confirm).to_be_visible()
        expect(page.locator("html")).to_have_attribute("data-palace-theme","nightfall" if mode=="night" else mode)
        a,b = assert_inside(page,confirm),assert_inside(page,leave)
        assert a["x"]+a["width"]<=b["x"]+1 or b["x"]+b["width"]<=a["x"]+1 or a["y"]+a["height"]<=b["y"]+1 or b["y"]+b["height"]<=a["y"]+1
        assert editions.body_requests == 0
        page.screenshot(path=f"reader-qa/{mode}-{width}.png")
        page.goto("http://127.0.0.1:4173/classic/retry")
        expect(page.get_by_role("button",name="Try again")).to_be_visible()
        expect(page.get_by_text("Synthetic internal detail")).to_have_count(0)
        page.get_by_role("button",name="Try again").click()
        expect(page.get_by_text("A synthetic paragraph for the reader rehearsal.",exact=True)).to_be_visible()
        assert editions.body_requests == 1
        context.close()
    browser.close()
