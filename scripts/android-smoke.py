"""Native Expo Go acceptance on the owned AVD; no project Python environment needed."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "evidence"
ADB = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData/Local")) / "Android/Sdk/platform-tools/adb.exe"
SERIAL = "emulator-5580"
NODE = Path("C:/Program Files/nodejs/node.exe")
checks = []
STANDALONE = '--standalone' in sys.argv
AVD = 'MorulaCare_Google_API_35' if STANDALONE else 'MorulaCare_API_35'
PACKAGE = 'com.example.morulacare.concept' if STANDALONE else 'host.exp.exponent'
PREFIX = ('photo-font-' if '--font-only' in sys.argv else 'ux-native-') if STANDALONE else 'android-'


def adb(*args, binary=False):
    result = subprocess.run([str(ADB), "-s", SERIAL, *args], capture_output=True, timeout=45)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace"))
    return result.stdout if binary else result.stdout.decode("utf-8", errors="replace")


def api(path, body=None, method=None):
    headers = {"Authorization": "Bearer demo-patient-token", "Content-Type": "application/json"}
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request("http://127.0.0.1:8080/api/v1" + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)


def hierarchy():
    adb("shell", "uiautomator", "dump", "--compressed", "/sdcard/morula-smoke.xml")
    source = adb("exec-out", "cat", "/sdcard/morula-smoke.xml")
    return ET.fromstring(source[source.index("<?xml"):])


def find(tree, label, contains=False):
    results = []
    label = label.casefold()
    for node in tree.iter("node"):
        values = [node.get("text", "").casefold(), node.get("content-desc", "").casefold()]
        if any(label in value if contains else label == value for value in values):
            bounds = list(map(int, re.findall(r"\d+", node.get("bounds", ""))))
            if len(bounds) == 4 and bounds[2] > bounds[0] and bounds[3] > bounds[1]:
                results.append(node)
    return next((node for node in results if node.get("clickable") == "true"), results[0] if results else None)


def visible(label, contains=False, scroll=False):
    for attempt in range(8):
        tree = hierarchy()
        if find(tree, label, contains) is not None:
            return tree
        if scroll:
            adb("shell", "input", "swipe", "540", "1200", "540", "600", "350")
        time.sleep(1)
    raise AssertionError("Native text not visible: " + label)


def tap(label, scroll=False, max_y=None, capture_before=None):
    for attempt in range(7 if scroll else 2):
        node = find(hierarchy(), label)
        if node is not None:
            x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.get("bounds", "")))
            if max_y is None or y2 <= max_y:
                if capture_before:
                    capture(capture_before)
                adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))
                time.sleep(0.6)
                return [x1, y1, x2, y2]
        if scroll:
            start_y = min(1270, max_y - 160) if max_y else 1200
            # Avoid the nested multiline input while scrolling above the IME.
            swipe_x = "980" if max_y else "540"
            adb("shell", "input", "swipe", swipe_x, str(start_y), swipe_x, str(max(450, start_y - 820)), "700")
    raise AssertionError("Native target not found: " + label)


def capture(name):
    (EVIDENCE / (PREFIX + name + ".png")).write_bytes(adb("exec-out", "screencap", "-p", binary=True))
    tree = hierarchy()
    ET.ElementTree(tree).write(EVIDENCE / (PREFIX + name + ".xml"), encoding="utf-8", xml_declaration=True)
    return tree


def passed(name):
    checks.append(name)
    print("PASS " + name, flush=True)


def open_app():
    helper = 'android-apk-local.mjs' if STANDALONE else 'android-local.mjs'
    subprocess.run([str(NODE), str(ROOT / 'scripts' / helper), "open"], cwd=ROOT, check=True, timeout=60)


def font_check():
    for scale, tag in [('1.3', 'font130'), ('2.0', 'font200')]:
        adb("shell", "settings", "put", "system", "font_scale", scale)
        adb("shell", "am", "force-stop", PACKAGE)
        open_app()
        visible("Halo, " + api("/overview")["patient"]["displayName"] + ".")
        capture(tag + "-home")
        for attempt in range(10):
            tree = hierarchy()
            if find(tree, "Kunjungan berikutnya") is not None and find(tree, "Semua janji") is not None:
                break
            adb("shell", "input", "swipe", "540", "1200", "540", "600", "350")
        else:
            raise AssertionError("Enlarged home section heading/action not visible")
        capture(tag + "-home-sections")
        tap("Profil")
        visible("Pemberitahuan & privasi", scroll=True)
        capture(tag + "-profile")
        tap("Perjalanan");tap("Program")
        visible("Langkah berikutnya", scroll=True);capture(tag + "-journey")
        tap("Janji");tap("Akan datang")
        tap("Detail janji Konsultasi rencana berikutnya", scroll=True,capture_before=tag+"-appointments")
        visible("Persiapan kunjungan", scroll=True);capture(tag + "-appointments-detail")
        tap("Tutup detail")
    passed("Native Home/Journey/Appointments/Profile render and detail navigation at font scales1.3 and2.0")


def profile_check(original):
    tap("Profil")
    tap("Informasi layanan", scroll=True)
    assert api("/overview")["preferences"]["serviceNotifications"] != original["preferences"]["serviceNotifications"]
    tap("Informasi layanan")
    assert api("/overview")["preferences"] == original["preferences"]
    capture("profile-collapsed")
    tap("Pratinjau pemberitahuan", scroll=True)
    visible("Pratinjau demo; belum mengirim notifikasi.", scroll=True)
    capture("profile-preview")
    tap("Pratinjau pemberitahuan", scroll=True)
    tap("Akses pasangan", scroll=True)
    visible("Privat secara default", scroll=True)
    capture("profile")
    passed("Native preference mutation reached API and partner boundary remains")


def keyboard_top():
    windows = adb("shell", "dumpsys", "window")
    # Android15 can use a fullscreen IME window; the visible inset is authoritative.
    match = re.search(r"InsetsSource[^\n]*type=ime frame=\[\d+,(\d+)\]\[\d+,\d+\][^\n]*visible=true", windows)
    if match:
        return int(match.group(1))
    for block in re.split(r"\n\s*Window #\d+ ", windows):
        if "InputMethod" in block.splitlines()[0]:
            match = re.search(r"Frames:[^\n]*\bframe=\[\d+,(\d+)\]\[\d+,\d+\]", block)
            if match:
                return int(match.group(1))
    raise AssertionError("Could not determine actual Android keyboard top inset")


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    assert AVD in [line.strip() for line in adb("emu", "avd", "name").splitlines()], "Refusing another AVD"
    original = api("/overview")
    font_scale = adb("shell", "settings", "get", "system", "font_scale").strip()
    stylus_original=adb("shell","settings","get","secure","stylus_handwriting_enabled").strip()
    error = None
    try:
        adb("shell","settings","put","secure","stylus_handwriting_enabled","0")
        adb("shell", "am", "force-stop", "host.exp.exponent")
        open_app()
        for attempt in range(60):
            tree = hierarchy()
            if find(tree, "Halo, " + original["patient"]["displayName"] + ".") is not None:
                break
            time.sleep(2)
        else:
            raise AssertionError("Native API-mode home did not load")
        visible("Halo, " + original["patient"]["displayName"] + ".")
        for label in ["Beranda", "Perjalanan", "Janji", "Dokter", "Profil"]:
            assert find(tree, label) is not None, label
        capture("home")
        passed("Native API-mode overview and all five navigation tabs")

        if "--font-only" in sys.argv:
            font_check()
            return
        if "--profile-font-only" in sys.argv:
            profile_check(original)
            font_check()
            assert api("/appointments") == original["appointments"]
            passed("Official appointments remain unchanged after native test flows")
            return

        tap("Siapkan pertanyaan konsultasi", scroll=True)
        current = api("/overview")
        assert current["reminders"][0]["completed"] != original["reminders"][0]["completed"]
        tap("Siapkan pertanyaan konsultasi")
        assert api("/overview")["reminders"][0]["completed"] == original["reminders"][0]["completed"]
        passed("Native checklist mutation reached API and was restored")

        tap("Beranda")
        tap("Status embrio", scroll=True)
        tap("Detail Embrio 01", scroll=True)
        visible("Waktu observasi")
        visible("Dirilis kepada pasien")
        capture("embryo-detail")
        tap("Tutup detail")
        passed("Native released-embryo detail and provenance")

        tap("Riwayat")
        tap("Tindakan")
        tap("Detail Pengambilan sel telur", scroll=True)
        visible("Instruksi yang tercatat")
        capture("care-detail")
        tap("Tutup detail")
        passed("Native care-history filtering and instructions")

        tap("Janji")
        tap("Riwayat janji")
        visible("Pengambilan sel telur", contains=True)
        tap("Akan datang")
        capture("appointments")
        tap("Detail janji Konsultasi rencana berikutnya", scroll=True)
        tap("Usulkan perubahan jadwal", scroll=True)
        tap("Catatan permintaan", scroll=True)
        adb("shell", "input", "text", "Uji%sAndroid%ssintetis:%sdiskusi%swaktu%skonsultasi.")
        keyboard = adb("shell", "dumpsys", "input_method")
        assert "mInputShown=true" in keyboard or "isInputViewShown=true" in keyboard, "Native keyboard was not shown"
        capture("request-keyboard")
        ime_top = keyboard_top()
        button_bounds = tap("Simpan simulasi permintaan", scroll=True, max_y=ime_top, capture_before="request-keyboard-submit")
        assert button_bounds[3] <= ime_top
        passed("Native request-modal input and submit remain usable above Android keyboard")
        visible("Simulasi permintaan tercatat")
        visible("Belum dikirim ke rumah sakit", contains=True)
        assert api("/appointments") == original["appointments"]
        capture("request-receipt")
        tap("Tutup detail")
        passed("Native synthetic request receipt preserves official appointments")

        tap("Buka asisten")
        tap("Jadwal saya berikutnya", scroll=True)
        visible("Pada snapshot demo, janji Anda:", contains=True)
        tap("Pesan untuk asisten")
        adb("shell", "input", "text", "Berapa%sdosis%sobat%ssaya?")
        adb("shell", "input", "keyevent", "KEYCODE_BACK")
        tap("Kirim pesan")
        visible("Bantuan tim klinik")
        capture("assistant")
        passed("Native API assistant schedule and clinical handoff")

        profile_check(original)

        font_check()
        assert api("/appointments") == original["appointments"]
        passed("Official appointments remain unchanged after native test flows")
    except Exception as failure:
        error = str(failure)
        try:
            capture("failure")
        except Exception:
            pass
        raise
    finally:
        if stylus_original=="null":adb("shell","settings","delete","secure","stylus_handwriting_enabled")
        else:adb("shell","settings","put","secure","stylus_handwriting_enabled",stylus_original)
        adb("shell", "settings", "put", "system", "font_scale", font_scale if font_scale != "null" else "1.0")
        api("/preferences", original["preferences"], "PATCH")
        for reminder in original["reminders"]:
            api("/reminders/" + reminder["id"], {"completed": reminder["completed"]}, "PATCH")
        report = {"timestamp": datetime.now(timezone.utc).isoformat(), "runtime": "Expo Go58.0.5 native Android15/API35 x86_64", "avd": "MorulaCare_API_35", "serial": SERIAL, "checks": checks, "passed": len(checks), "error": error, "fontScaleRestored": font_scale, "subset": "font-only" if "--font-only" in sys.argv else "full", "scope": "Native Expo Go acceptance; standalone Morula APK not built"}
        if "--profile-font-only" in sys.argv:
            report["subset"] = "profile-font-only"
        name = "android-profile-font-smoke.json" if "--profile-font-only" in sys.argv else "android-font-smoke.json" if "--font-only" in sys.argv else "android-native-smoke.json"
        if STANDALONE:
            report.update(stylusHandwritingSettingRestored=stylus_original,runtime='Standalone release APK / native Android15/API35 x86_64', avd=AVD, scope='Native standalone API UX acceptance; local synthetic data', package=PACKAGE)
            name='photo-native-font-results.json' if '--font-only' in sys.argv else 'ux-native-smoke.json'
        (EVIDENCE / name).write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
