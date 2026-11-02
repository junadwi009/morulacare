"""Exercise opt-in facility search with controlled browser geolocation, not physical GPS."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs/evidence"
checks, errors = [], []


def passed(name):
    checks.append(name)
    print("PASS " + name, flush=True)


def ready(context):
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://localhost:8081", wait_until="networkidle")
    expect(page.get_by_text("Halo, Nadia (demo).", exact=True)).to_be_visible()
    page.get_by_role("button", name="Cari cabang Morula", exact=True).click()
    return page


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844}, permissions=["geolocation"], geolocation={"latitude": -6.195055, "longitude": 106.8338607, "accuracy": 50})
        context.add_init_script("""window.geoCalls=0; const original=navigator.geolocation.getCurrentPosition.bind(navigator.geolocation); navigator.geolocation.getCurrentPosition=(...args)=>{window.geoCalls++;return original(...args);};""")
        page = ready(context)
        assert page.evaluate("window.geoCalls") == 0
        expect(page.get_by_text("Pilih cabang", exact=True)).to_be_visible()
        passed("No automatic location request on startup")
        search = page.get_by_role("textbox", name="Cari kota atau cabang Morula", exact=True)
        search.fill("Surabaya")
        expect(page.get_by_text("1 hasil pencarian", exact=False)).to_be_visible()
        expect(page.get_by_text("Morula IVF Surabaya", exact=True)).to_be_visible()
        assert page.evaluate("window.geoCalls") == 0
        passed("Manual city search works without permission or invented distance")
        search.fill("no-such-facility")
        expect(page.get_by_text("Cabang belum ditemukan", exact=True)).to_be_visible()
        page.get_by_role("button", name="Tampilkan semua cabang", exact=True).click()
        expect(search).to_have_value("")
        passed("No-result state provides a working reset")
        page.get_by_role("button", name="Gunakan lokasi saya", exact=True).click()
        expect(page.get_by_text("Cabang sekitar Anda", exact=True)).to_be_visible(timeout=25000)
        expect(page.get_by_text(re.compile('akurasi',re.I))).to_have_count(0)
        expect(page.get_by_text("Morula IVF Jakarta", exact=True).first).to_be_visible()
        assert page.get_by_role("button", name="Petunjuk arah", exact=False).first.get_attribute("aria-label") == "Petunjuk arah Morula IVF Jakarta"
        passed("Controlled granted location ranks Jakarta first without exposing GPS diagnostics")
        page.screenshot(path=str(EVIDENCE / "facility-web-granted.png"))
        page.get_by_role("button", name="Tutup detail", exact=True).click()
        page.get_by_role("tab", name="Perjalanan", exact=True).click()
        page.get_by_role("tab", name="Beranda", exact=True).click()
        page.get_by_role("button", name="Cari cabang Morula", exact=True).click()
        expect(page.get_by_text("Cabang sekitar Anda", exact=True)).to_be_visible()
        passed("Location survives tab navigation within the session")
        page.get_by_role("button", name="Hapus lokasi saya", exact=True).click()
        expect(page.get_by_text("Pilih cabang", exact=True)).to_be_visible()
        expect(page.get_by_text("Cabang terdekat", exact=True)).to_have_count(0)
        passed("Clear location removes distance ranking")
        for width in [360, 390, 480]:
            page.set_viewport_size({"width": width, "height": 900})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.screenshot(path=str(EVIDENCE / f"facility-web-{width}.png"))
        passed("Home layout fits 360, 390 and 480 widths without page overflow")
        page.reload(wait_until="networkidle")
        page.get_by_role("button", name="Cari cabang Morula", exact=True).click()
        expect(page.get_by_text("Pilih cabang", exact=True)).to_be_visible()
        assert page.evaluate("window.geoCalls") == 0
        passed("Reload clears session location without requesting it again")
        context.close()

        denied = browser.new_context(viewport={"width": 390, "height": 844})
        denied.add_init_script("""const original=navigator.permissions.query.bind(navigator.permissions);navigator.permissions.query=options=>options.name==='geolocation'?Promise.resolve({state:'denied'}):original(options);""")
        page = ready(denied)
        page.get_by_role("button", name="Gunakan lokasi saya", exact=True).click()
        expect(page.get_by_text("Izin lokasi ditolak. Cari cabang secara manual.", exact=True)).to_be_visible()
        page.get_by_role("textbox", name="Cari kota atau cabang Morula", exact=True).fill("Bandung")
        expect(page.get_by_text("Morula IVF Melinda Bandung", exact=True)).to_be_visible()
        page.screenshot(path=str(EVIDENCE / "facility-web-denied.png"))
        passed("Denied permission keeps manual search usable")
        denied.close()

        pending = browser.new_context(viewport={"width": 390, "height": 844})
        pending.add_init_script("""const original=navigator.permissions.query.bind(navigator.permissions);navigator.permissions.query=options=>options.name==='geolocation'?Promise.resolve({state:'granted'}):original(options);navigator.geolocation.getCurrentPosition=ok=>{window.finishLocation=()=>ok({coords:{latitude:-6.195055,longitude:106.8338607,accuracy:50},timestamp:Date.now()});};""")
        page = ready(pending)
        page.get_by_role("button", name="Gunakan lokasi saya", exact=True).click()
        page.get_by_role("button", name="Batalkan deteksi lokasi", exact=True).click()
        page.evaluate("window.finishLocation()")
        expect(page.get_by_text("Pilih cabang", exact=True)).to_be_visible()
        expect(page.get_by_text("Cabang sekitar Anda", exact=True)).to_have_count(0)
        passed("Cancel ignores a late browser position callback")
        pending.close()
        browser.close()
    assert not errors, errors
    passed("No uncaught browser errors")
    (EVIDENCE / "facility-web-results.json").write_text(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat(), "scope": "React Native Web API mode; controlled browser permission/geolocation, not physical GPS", "passed": len(checks), "checks": checks, "pageErrors": errors}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
