"""Native GPS/UI smoke on the owned Google AVD, using synthetic Jakarta coordinates.

Grants only a foreground one-time emulator permission when the OS dialog appears.
Never runs on a physical device or another AVD; does not open external maps.
"""
import json
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs/evidence"
ADB = Path.home() / "AppData/Local/Android/Sdk/platform-tools/adb.exe"
BASE = [str(ADB), "-s", "emulator-5580"]
checks = []
STANDALONE = '--standalone' in sys.argv
PREFIX = 'standalone-native' if STANDALONE else 'facility-native'


def adb(*args):
    return subprocess.check_output(BASE + list(args), timeout=40)


def tree():
    adb("shell", "uiautomator", "dump", "/sdcard/morula-facility-smoke.xml")
    return ET.fromstring(adb("exec-out", "cat", "/sdcard/morula-facility-smoke.xml"))


def find(root, text=None, desc=None, resource=None):
    return next((n for n in root.iter("node") if
                 (text is None or n.get("text") == text) and
                 (desc is None or n.get("content-desc") == desc) and
                 (resource is None or n.get("resource-id", "").endswith(resource))), None)


def tap(node):
    assert node is not None, "Expected native control was not found"
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.get("bounds")))
    adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))


def passed(name):
    checks.append(name)
    print("PASS " + name, flush=True)


def capture(name, root=None):
    (EVIDENCE / f"{PREFIX}-{name}.png").write_bytes(adb("exec-out", "screencap", "-p"))
    if root is not None:
        (EVIDENCE / f"{PREFIX}-{name}.xml").write_bytes(ET.tostring(root, encoding="utf-8"))


def appointments():
    request = Request("http://localhost:8080/api/v1/appointments", headers={"Authorization": "Bearer demo-patient-token"})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def preferences(body=None):
    request = Request('http://localhost:8080/api/v1/' + ('preferences' if body is not None else 'overview'),
                      data=json.dumps(body).encode() if body is not None else None,
                      headers={'Authorization':'Bearer demo-patient-token','Content-Type':'application/json'},
                      method='PATCH' if body is not None else 'GET')
    with urlopen(request, timeout=15) as response:
        result=json.load(response)
        return result if body is not None else result['preferences']


def api_preference_roundtrip():
    original=preferences()
    try:
        tap(find(tree(),desc='Profil'))
        tap(find(tree(),desc='Informasi layanan'))
        for _ in range(15):
            if preferences()['serviceNotifications'] != original['serviceNotifications']:break
            time.sleep(0.5)
        else:raise AssertionError('Standalone preference toggle did not reach API')
        tap(find(tree(),desc='Informasi layanan'))
        for _ in range(15):
            if preferences()==original:break
            time.sleep(0.5)
        else:raise AssertionError('Standalone preference restore did not reach API')
        passed('Standalone native preference PATCH reaches real API and restores original values')
    finally:
        if preferences()!=original:preferences(original)
        tap(find(tree(),desc='Beranda'))


def open_directory():
    for _ in range(14):
        root = tree()
        control = find(root, desc='Cari cabang Morula')
        if control is not None:
            tap(control)
            return tree()
        adb('shell','input','swipe','980','1800','980','650','450')
    raise AssertionError('Explicit branch directory entry did not become visible')


def detect():
    tap(find(tree(), desc="Gunakan lokasi saya"))
    permission_observed = False
    for _ in range(12):
        adb("emu", "geo", "fix", "106.8338607", "-6.195055")
        root = tree()
        one_time = find(root, resource="permission_allow_one_time_button")
        if one_time is not None:
            capture("permission", root)
            precise = find(root, resource="permission_location_accuracy_radio_fine")
            if precise is not None and precise.get("checked") != "true":
                tap(precise)
                root = tree()
                one_time = find(root, resource="permission_allow_one_time_button")
            tap(one_time)
            permission_observed = True
            continue
        if find(root, text="Cabang sekitar Anda") is not None:
            return root, permission_observed
        messages = " ".join(n.get("text", "") for n in root.iter("node"))
        if "Lokasi belum diperoleh." in messages or "Lokasi tidak tersedia" in messages:
            capture("provider-error", root)
            raise AssertionError("Native provider did not return a current position: " + messages[:1200])
        time.sleep(0.5)
    raise AssertionError("Location did not become ready within native polling window")


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    report = {"timestamp": datetime.now(timezone.utc).isoformat(), "scope": ("Standalone release APK / no Expo Go or Metro" if STANDALONE else "Native Expo Go58.0.5") + " / Android35 Google APIs revision9 / API demo; emulator GPS injection, not physical GPS", "syntheticPosition": {"latitude": -6.195055, "longitude": 106.8338607}, "checks": checks, "passed": 0, "error": None}
    try:
        assert "MorulaCare_Google_API_35" in [line.strip() for line in adb("emu", "avd", "name").decode().splitlines()]
        assert b"com.google.android.gms" in adb("shell", "pm", "list", "packages", "com.google.android.gms")
        if STANDALONE:
            activity=adb('shell','dumpsys','activity','activities').decode(errors='replace')
            resumed='\n'.join(line for line in activity.splitlines() if 'mResumedActivity' in line or 'topResumedActivity' in line)
            assert 'com.example.morulacare.concept/' in resumed
            go=subprocess.run(BASE+['shell','pidof','host.exp.exponent'],capture_output=True,timeout=15)
            assert not go.stdout.strip()
            passed('Own standalone activity is resumed while Expo Go is stopped')
            try:
                with urlopen('http://localhost:8081',timeout=2):pass
            except (URLError,TimeoutError,OSError):
                passed('Metro is stopped; standalone runtime does not need it')
            else:raise AssertionError('Stop the owned Metro before testing independence')
        original = appointments()
        root = tree()
        assert find(root, text="Halo, Nadia (demo).") is not None
        assert find(root, resource="permission_allow_one_time_button") is None
        capture("initial", root)
        passed("Google AVD renders redesigned API home without automatic permission prompt")
        if STANDALONE:api_preference_roundtrip()
        open_directory()
        root, prompted = detect()
        report["foregroundPermissionDialogObserved"] = prompted
        capture("detected", root)
        passed("Explicit foreground lookup detects injected Jakarta position with native provider")
        assert not any("akurasi" in n.get("text", "").lower() for n in root.iter("node"))
        passed("Native UI hides GPS accuracy diagnostics")
        for _ in range(7):
            root = tree()
            buttons = [n for n in root.iter("node") if n.get("content-desc", "").startswith("Petunjuk arah ")]
            if buttons:
                assert buttons[0].get("content-desc") == "Petunjuk arah Morula IVF Jakarta"
                capture("nearest", root)
                break
            adb("shell", "input", "swipe", "980", "1800", "980", "700", "500")
        else:
            raise AssertionError("Nearest facility card did not become visible")
        passed("Jakarta is the first nearest directory card; maps are not opened")
        tap(find(tree(), desc="Tutup detail"))
        tap(find(tree(), desc="Perjalanan"))
        tap(find(tree(), desc="Beranda"))
        open_directory()
        assert find(tree(), text="Cabang sekitar Anda") is not None
        passed("Location state survives native tab navigation")
        tap(find(tree(), desc="Hapus lokasi saya"))
        assert find(tree(), text="Pilih cabang") is not None
        passed("Clear removes location from native session state")
        detect()
        assert appointments() == original
        passed("Searching nearby branches leaves official appointments unchanged")
        capture("home-final", tree())
    except Exception as error:
        report["error"] = str(error)
        raise
    finally:
        report["passed"] = len(checks)
        (EVIDENCE / f"{PREFIX}-results.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
