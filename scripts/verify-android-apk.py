"""Inspect the locally built release APK without running any cloud service."""
import hashlib
import json
import re
import struct
import subprocess
import zipfile
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHONE = '--phone' in sys.argv[1:]
PREFIX = 'phone-demo' if PHONE else 'standalone'
APK = ROOT / ('artifacts/android/MorulaCare-phone-demo.apk' if PHONE else 'artifacts/android/MorulaCare-local-api-x86_64.apk')
EVIDENCE = ROOT / "docs/evidence"
SDK = Path.home() / "AppData/Local/Android/Sdk"
JAVA = Path.home() / "codex-development-setup/2026-11-01/tools/jdk-17.0.20.1+1/bin/java.exe"


def execute(args):
    return subprocess.check_output([str(x) for x in args], timeout=60, text=True, encoding="utf-8", errors="replace")


def main():
    checks = []
    report = {"timestamp": datetime.now(timezone.utc).isoformat(), "artifact": str(APK), "checks": checks, "error": None}

    def check(name, condition):
        assert condition, name
        checks.append(name)
        print("PASS " + name, flush=True)

    try:
        build = json.loads((EVIDENCE / (PREFIX + '-build.json')).read_text())
        check("Published APK bytes match build SHA256", hashlib.sha256(APK.read_bytes()).hexdigest() == build["sha256"])
        with zipfile.ZipFile(APK) as package:
            names = package.namelist()
            bundle = package.read("assets/index.android.bundle")
            check("JavaScript is embedded as Hermes bytecode", struct.unpack("<Q", bundle[:8])[0] == 0x1F1903C103BC1FC6)
            if PHONE:
                check("Phone demo has no embedded computer-local API URL", build['mode'] == 'Offline demo' and build['apiUrl'] == '' and b"http://127.0.0.1:8080" not in bundle)
            else:
                check("Embedded bundle selects local API demo", b"http://127.0.0.1:8080" in bundle and b"demo-patient-token" in bundle)
            architectures = sorted({name.split("/")[1] for name in names if name.startswith("lib/") and name.endswith(".so")})
            expected_architectures = ['arm64-v8a', 'x86_64'] if PHONE else ['x86_64']
            check("Native libraries match target devices", architectures == expected_architectures)
            report["architectures"] = architectures
            report["embeddedBundleBytes"] = len(bundle)
            if PHONE:
                check('Phone APK ZIP entries are intact', package.testzip() is None)
                alignments = {}
                for name in names:
                    if not name.startswith('lib/') or not name.endswith('.so'):
                        continue
                    library = package.read(name)
                    assert library[:6] == b'\x7fELF\x02\x01', 'Expected ELF64 little endian: ' + name
                    offset = struct.unpack_from('<Q', library, 32)[0]
                    size, count = struct.unpack_from('<HH', library, 54)
                    loads = [struct.unpack_from('<Q', library, offset+i*size+48)[0]
                             for i in range(count) if struct.unpack_from('<I', library, offset+i*size)[0] == 1]
                    alignments[name] = min(loads)
                check('Native ELF load segments have at least 16 KB alignment', all(value >= 16384 for value in alignments.values()))
                report['nativeLoadAlignmentBytes'] = alignments
        aapt = SDK / "build-tools/37.0.0/aapt2.exe"
        resources = execute([aapt, "dump", "resources", APK])
        (EVIDENCE / (PREFIX + '-apk-resources.log')).write_text(resources, encoding="utf-8")
        def resource_files(name):
            match = re.search(r"resource 0x[0-9a-f]+ " + re.escape(name) + r"\n(.*?)(?=    resource |  type |\Z)", resources, re.S)
            return re.findall(r"\(file\) (res/\S+)", match.group(1)) if match else []
        # AGP release resource optimization shortens ZIP paths; resolve the table.
        launcher = resource_files("mipmap/ic_launcher")
        splash = resource_files("drawable/splashscreen_logo")
        check("Launcher and splash resources are packaged", bool(launcher and splash) and all(n in names for n in launcher + splash))
        badging = execute([aapt, "dump", "badging", APK])
        (EVIDENCE / (PREFIX + '-apk-badging.log')).write_text(badging, encoding="utf-8")
        expected_package = 'com.example.morulacare.concept.demo' if PHONE else 'com.example.morulacare.concept'
        check("Own package and release debuggable flag are correct", f"name='{expected_package}'" in badging and "application-debuggable" not in badging)
        check("No background, overlay or legacy storage permission", all(p not in badging for p in ["ACCESS_BACKGROUND_LOCATION", "SYSTEM_ALERT_WINDOW", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]))
        policy_files = resource_files("xml/morula_local_api_network")
        assert len(policy_files) == 1, "Local API network policy resource is missing"
        policy = execute([aapt, "dump", "xmltree", APK, "--file", policy_files[0]])
        (EVIDENCE / (PREFIX + '-network-policy.log')).write_text(policy, encoding="utf-8")
        check("APK includes explicit loopback network security policy", "127.0.0.1" in policy and "localhost" in policy and "base-config" in policy)
        signature = execute([JAVA, "-jar", SDK / "build-tools/37.0.0/lib/apksigner.jar", "verify", "--verbose", "--print-certs", APK])
        (EVIDENCE / (PREFIX + '-apk-signature.log')).write_text(signature, encoding="utf-8")
        key_store = 'C:/morula-phone-apk/project/android/app/debug.keystore' if PHONE else 'C:/morula-local-apk/project/android/app/debug.keystore'
        certificate = subprocess.check_output([str(JAVA.parent / "keytool.exe"), "-exportcert", "-alias", "androiddebugkey", "-keystore", key_store, "-storepass", "android"], timeout=30)
        certificate_hash = hashlib.sha256(certificate).hexdigest()
        check("APK signature verifies with the staged local test certificate", certificate_hash in signature.lower().replace(":", ""))
        report["signerCertificateSha256"] = certificate_hash
        if PHONE:
            alignment = execute([SDK / 'build-tools/37.0.0/zipalign.exe', '-v', '-c', '-P', '16', '4', APK])
            check('Phone APK ZIP alignment validates for 16 KB packaging', 'Verification successful' in alignment)
    except Exception as error:
        report["error"] = str(error)
        raise
    finally:
        report["passed"] = len(checks)
        (EVIDENCE / (PREFIX + '-apk-verification.json')).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
