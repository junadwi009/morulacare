"""Smoke-test the same ARM64/x86_64 phone APK on the owned x86_64 AVD.

No real phone is claimed. All records are synthetic, in memory, and reset on exit.
"""
import importlib.util
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'docs/evidence'
spec = importlib.util.spec_from_file_location('phone_native_helpers', ROOT / 'scripts/android-smoke.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
h.STANDALONE = True
h.PACKAGE = 'com.example.morulacare.concept.demo'
h.PREFIX = 'phone-demo-native-'


def focus_reason():
    for _ in range(12):
        for node in h.hierarchy().iter('node'):
            if node.get('class', '').endswith('EditText') and node.get('content-desc') == 'Keperluan konsultasi':
                x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds', '')))
                if x2 > x1 and y2 > y1 and 350 <= y1 < y2 <= 2050:
                    h.adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
                    for _ in range(15):
                        ime = h.adb('shell', 'dumpsys', 'input_method')
                        if 'mInputShown=true' in ime or 'isInputViewShown=true' in ime:
                            return
                        time.sleep(.2)
        h.adb('shell', 'input', 'swipe', '1040', '1800', '1040', '650', '450')
    raise AssertionError('Consultation input did not focus/show keyboard')


def main():
    checks = []
    report = {'timestamp': datetime.now(timezone.utc).isoformat(), 'checks': checks,
              'error': None, 'physicalPhoneTested': False,
              'scope': 'Same dual-ABI phone APK, offline on owned x86_64 Android emulator'}
    original_wifi = original_data = original_stylus = None
    owned = False

    def passed(name):
        checks.append(name)
        print('PASS ' + name, flush=True)

    try:
        assert 'MorulaCare_Google_API_35' in [s.strip() for s in h.adb('emu', 'avd', 'name').splitlines()]
        owned = True
        original_wifi = h.adb('shell', 'settings', 'get', 'global', 'wifi_on').strip()
        original_data = h.adb('shell', 'settings', 'get', 'global', 'mobile_data').strip()
        original_stylus = h.adb('shell', 'settings', 'get', 'secure', 'stylus_handwriting_enabled').strip()
        h.adb('shell', 'settings', 'put', 'secure', 'stylus_handwriting_enabled', '0')
        h.adb('shell', 'svc', 'wifi', 'disable')
        h.adb('shell', 'svc', 'data', 'disable')
        assert h.adb('shell', 'settings', 'get', 'global', 'wifi_on').strip() == '0'
        assert h.adb('shell', 'settings', 'get', 'global', 'mobile_data').strip() == '0'
        # Leave the original API application's reverse mappings untouched.
        if owned:
            h.adb('shell', 'am', 'force-stop', h.PACKAGE)
            h.adb('shell', 'am', 'start', '-W', '-n', h.PACKAGE + '/.MainActivity')
        h.visible('Halo, Nadia (demo).')
        h.capture('home')
        passed('Phone demo opens standalone with Wi-Fi and mobile data disabled')
        h.tap('Perjalanan'); h.visible('Perjalanan Anda')
        h.tap('Janji'); h.visible('Janji Anda')
        h.tap('Profil'); h.visible('Pemberitahuan & privasi', scroll=True)
        passed('Journey, appointments and profile load from bundled synthetic data')
        h.tap('Dokter'); h.tap('Profil dr. Maya Pratama')
        h.tap('Pilih jadwal', scroll=True); h.visible('Pilih tanggal')
        h.tap('Pilih waktu 09.00 WIB', scroll=True)
        focus_reason()
        h.adb('shell', 'input', 'text', 'Konsultasi%sdemo%sHP')
        h.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        h.tap('Lanjut booking', scroll=True); h.visible('Tinjau booking')
        h.tap('Booking demo', scroll=True); h.visible('Booking demo tersimpan')
        h.capture('booking')
        h.tap('Lihat janji saya'); h.visible('Detail booking dr. Maya Pratama', scroll=True)
        passed('Doctor selection, schedule, review and booking work without a backend')
        h.tap('Buka asisten'); h.tap('Jadwal saya berikutnya')
        h.visible('Jadwal pada snapshot demo:', contains=True, scroll=True)
        h.capture('assistant')
        passed('Assistant responds from bundled demo without a network connection')
        h.tap('Pemberitahuan'); h.visible('Pemberitahuan'); h.capture('inbox')
        h.tap('Tutup detail')
        passed('Demo notification inbox opens offline')
    except Exception as error:
        report['error'] = str(error)
        try:
            h.capture('failure')
        except Exception:
            pass
        raise
    finally:
        if original_wifi is not None:
            h.adb('shell', 'svc', 'wifi', 'enable' if original_wifi == '1' else 'disable')
        if original_data is not None:
            h.adb('shell', 'svc', 'data', 'enable' if original_data == '1' else 'disable')
        if original_stylus is not None:
            if original_stylus == 'null':
                h.adb('shell', 'settings', 'delete', 'secure', 'stylus_handwriting_enabled')
            else:
                h.adb('shell', 'settings', 'put', 'secure', 'stylus_handwriting_enabled', original_stylus)
        report.update(passed=len(checks), originalWifi=original_wifi, originalMobileData=original_data,
                      originalStylus=original_stylus)
        (E / 'phone-demo-native-results.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
        if owned:
            h.adb('shell', 'am', 'force-stop', h.PACKAGE)
            h.adb('shell', 'am', 'start', '-W', '-n', h.PACKAGE + '/.MainActivity')


if __name__ == '__main__':
    main()
