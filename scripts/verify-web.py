"""Exercise the running Expo web app against its local demo API.

Run with the tooling Python that has Playwright installed; no project venv is needed.
The API and Expo must already listen on localhost:8080 and localhost:8081.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
BASE = "http://localhost:8081"
API = "http://localhost:8080/api/v1"
checks = []
errors = []


def api(path):
    with urlopen(Request(API + path, headers={"Authorization": "Bearer demo-patient-token"})) as response:
        return json.load(response)


def passed(name):
    checks.append(name)
    print("PASS " + name, flush=True)


def visible(page, text):
    expect(page.get_by_text(text, exact=True)).to_be_visible()


def touch_target(locator):
    expect(locator).to_be_visible()
    box = locator.bounding_box()
    assert box and box["width"] >= 44 and box["height"] >= 44, box


def open_page(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.on("pageerror", lambda error: errors.append(str(error)))
    return page


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    original = api("/overview")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge", headless=True)
        browser_version = browser.version
        page = open_page(browser)
        page.goto(BASE, wait_until="networkidle")
        expect(page.get_by_text("API DEMO", exact=True)).to_have_count(0)
        visible(page, "Halo, Nadia (demo).")
        expect(page.get_by_role("tab")).to_have_count(5)
        passed("API mode overview and five navigation tabs")
        for label in ["Semua janji", "Semua dokter"]:
            touch_target(page.get_by_role("button", name=label, exact=True))
        passed("Section actions have at least 44px touch targets")

        reminder = page.get_by_role("checkbox", name="Siapkan pertanyaan konsultasi", exact=True)
        was_checked = original["reminders"][0]["completed"]
        reminder.click()
        expect(reminder).to_have_attribute("aria-checked", str(not was_checked).lower())
        reminder.click()
        expect(reminder).to_have_attribute("aria-checked", str(was_checked).lower())
        passed("Reminder acknowledgement updates and restores through API")

        page.get_by_role("button", name="Status embrio", exact=True).click()
        expect(page.get_by_role("tab", name="Embrio", exact=True)).to_have_attribute("aria-selected", "true")
        page.get_by_role("button", name="Detail Embrio 01", exact=True).click()
        visible(page, "Waktu observasi")
        visible(page, "Dirilis kepada pasien")
        visible(page, "Sumber laporan")
        page.get_by_role("button", name="Tutup detail").click()
        passed("Released embryo list and detail provenance")

        page.get_by_role("tab", name="Riwayat", exact=True).click()
        page.get_by_role("button", name="Tindakan", exact=True).click()
        page.get_by_role("button", name="Detail Pengambilan sel telur", exact=True).click()
        visible(page, "Instruksi yang tercatat")
        page.get_by_role("button", name="Tutup detail").click()
        passed("Care history filter and detail instructions")

        page.get_by_role("tab", name="Janji", exact=True).click()
        page.get_by_role("tab", name="Riwayat janji", exact=True).click()
        expect(page.get_by_role("button", name="Detail janji Pengambilan sel telur", exact=True)).to_be_visible()
        page.get_by_role("tab", name="Akan datang", exact=True).click()
        page.get_by_role("button", name="Detail janji Konsultasi rencana berikutnya", exact=True).click()
        visible(page, "Persiapan kunjungan")
        page.get_by_role("button", name="Usulkan perubahan jadwal", exact=True).click()
        page.get_by_role("textbox", name="Catatan permintaan", exact=True).fill("Verifikasi browser sintetis: diskusikan usulan waktu konsultasi.")
        page.get_by_role("button", name="Simpan simulasi permintaan", exact=True).click()
        visible(page, "Simulasi permintaan tercatat")
        expect(page.get_by_text("Belum dikirim ke rumah sakit", exact=False)).to_be_visible()
        assert api("/appointments") == original["appointments"]
        page.get_by_role("button", name="Tutup detail").click()
        passed("Appointment history, simulated change receipt and immutable official schedule")

        page.get_by_role("button", name="Buka asisten", exact=True).click()
        page.get_by_role("button", name="Jadwal saya berikutnya", exact=True).click()
        expect(page.get_by_text("Pada snapshot demo, janji Anda:", exact=False)).to_be_visible()
        page.get_by_role("textbox", name="Pesan untuk asisten", exact=True).fill("Berapa dosis obat saya?")
        page.get_by_role("button", name="Kirim pesan", exact=True).click()
        expect(page.get_by_role("button", name="Bantuan tim klinik", exact=True)).to_be_visible()
        passed("API assistant schedule reply and clinical handoff")

        page.get_by_role("tab", name="Profil", exact=True).click()
        service = page.get_by_role("switch", name="Informasi layanan", exact=True)
        before = original["preferences"]["serviceNotifications"]
        service.click()
        expect(service).to_be_checked(checked=not before)
        service.click()
        expect(service).to_be_checked(checked=before)
        page.get_by_role("button", name="Akses pasangan", exact=True).click()
        visible(page, "Privat secara default")
        passed("API preference update and partner-access boundary")

        page.get_by_role("button", name="Pemberitahuan", exact=True).click()
        visible(page, "Contoh pemberitahuan demo.")
        page.get_by_role("button", name="Tutup detail").click()
        passed("Notification inbox renders demo messages")

        def unavailable(route):
            route.fulfill(status=503, json={"code": "TEST_UNAVAILABLE", "message": "API tidak tersedia untuk verifikasi."}, headers={"Access-Control-Allow-Origin": BASE})

        page.route(API + "/overview", unavailable)
        page.get_by_role("button", name="Muat ulang data", exact=True).click()
        visible(page, "Pembaruan gagal; data sebelumnya tetap ditampilkan")
        touch_target(page.get_by_role("button", name="Coba lagi", exact=True))
        passed("Synchronization retry has at least a 44px touch target")
        service.click()
        expect(service).to_be_checked(checked=not before)
        visible(page, "Pembaruan gagal; data sebelumnya tetap ditampilkan")
        service.click()
        expect(service).to_be_checked(checked=before)
        passed("Failed refresh retains warning after successful mutation")
        page.unroute(API + "/overview", unavailable)
        page.get_by_role("button", name="Coba lagi", exact=True).click()
        expect(page.get_by_text("Pembaruan gagal; data sebelumnya tetap ditampilkan", exact=True)).to_have_count(0)
        passed("Successful refresh clears synchronization warning")
        page.screenshot(path=str(EVIDENCE / "current-web-profile.png"), full_page=True)

        first_failure = open_page(browser)
        first_failure.route(API + "/overview", unavailable)
        first_failure.goto(BASE, wait_until="networkidle")
        visible(first_failure, "Data belum tersedia")
        visible(first_failure, "Koneksi belum tersedia")
        expect(first_failure.get_by_text("Halo, Nadia (demo).", exact=True)).to_have_count(0)
        passed("First-load API error is visible without fixture fallback")
        first_failure.screenshot(path=str(EVIDENCE / "current-web-api-error.png"), full_page=True)
        first_failure.close()

        empty = open_page(browser)

        def empty_embryos(route):
            response = route.fetch()
            data = response.json()
            data["embryos"] = []
            route.fulfill(response=response, json=data)

        empty.route(API + "/overview", empty_embryos)
        empty.goto(BASE, wait_until="networkidle")
        expect(empty.get_by_text("Pembaruan telah dirilis", exact=True)).to_have_count(0)
        empty.get_by_role("button", name="Status embrio", exact=True).click()
        visible(empty, "Belum ada laporan dirilis")
        visible(empty, "Pembaruan tersedia setelah ditinjau tim embriologi. Belum ada laporan tidak berarti hasil negatif.")
        passed("Empty released embryo results show waiting state without negative clinical claim")
        empty.screenshot(path=str(EVIDENCE / "current-web-empty-embryos.png"), full_page=True)
        empty.close()
        page.close()
        browser.close()
    assert not errors, errors
    passed("No uncaught browser page errors")
    (EVIDENCE / "current-web-smoke.json").write_text(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat(), "checks": checks, "passed": len(checks), "pageErrors": errors, "browser": "Microsoft Edge headless", "browserVersion": browser_version, "viewport": "390x844", "mode": "API demo", "scope": "React Native Web; not native Android/iOS"}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

