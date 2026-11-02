"""Capture the five running API-mode screens at mobile/desktop widths.

Uses the separately installed tooling Playwright, not a project Python venv.
This complements the functional suite in verify-web.py with visual evidence.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
TABS = [("Beranda", "home"), ("Perjalanan", "journey"), ("Janji", "appointments"), ("Asisten", "assistant"), ("Profil", "profile")]


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    records = []
    errors = []
    with sync_playwright() as runtime:
        browser = runtime.chromium.launch(channel="msedge", headless=True)
        for width, height in [(360, 800), (390, 844), (1280, 900)]:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto("http://localhost:8081", wait_until="networkidle")
            expect(page.get_by_text("API DEMO", exact=True)).to_be_visible()
            for label, name in TABS:
                tab = page.get_by_role("tab", name=label, exact=True)
                tab.click()
                expect(tab).to_have_attribute("aria-selected", "true")
                page.wait_for_timeout(150)
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"Horizontal page overflow at {width}: {label}"
                filename = f"ui-after-{width}-{name}.png"
                page.screenshot(path=str(EVIDENCE / filename), full_page=True)
                records.append({"width": width, "height": height, "screen": name, "screenshot": filename, "horizontalPageOverflow": False})
                if width == 390 and name in ("home", "profile", "journey"):
                    page.mouse.move(width // 2, height // 2)
                    page.mouse.wheel(0, 1800)
                    page.wait_for_timeout(200)
                    page.screenshot(path=str(EVIDENCE / f"ui-after-{width}-{name}-lower.png"), full_page=True)
            page.close()
        version = browser.version
        browser.close()
    assert not errors, errors
    result = {"timestamp": datetime.now(timezone.utc).isoformat(), "browser": "Microsoft Edge", "version": version, "mode": "API demo", "captures": records, "pageErrors": errors, "scope": "Web visual evidence; native Android evidence is separate"}
    (EVIDENCE / "current-ui-visual.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({"captures": len(records), "pageErrors": errors}, indent=2))


if __name__ == "__main__":
    main()
