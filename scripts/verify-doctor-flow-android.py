"""Large-text doctor profile/schedule/back journey on the owned standalone AVD."""
import importlib.util,json
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence'
spec=importlib.util.spec_from_file_location('doctor_flow_helpers',ROOT/'scripts/android-smoke.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
h.STANDALONE=True;h.PACKAGE='com.example.morulacare.concept';h.PREFIX='doctor-flow-native-'
def main():
    assert 'MorulaCare_Google_API_35' in [s.strip() for s in h.adb('emu','avd','name').splitlines()]
    checks=[];original=h.adb('shell','settings','get','system','font_scale').strip();appointments=h.api('/appointments')
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Owned Google API35 AVD, standalone API demo; large-text UI only, no booking submitted'}
    try:
        doctor=next(d for d in h.api('/doctors') if d['id']=='doctor-maya')
        slot=next(s for s in h.api('/doctors/'+doctor['id']+'/slots') if s['available'])
        stamp=datetime.fromisoformat(slot['startsAt']);label=f'Pilih waktu {stamp.hour:02d}.{stamp.minute:02d} WIB'
        for scale,tag in [('1.3','font130'),('2.0','font200')]:
            h.adb('shell','settings','put','system','font_scale',scale);h.open_app();h.visible('Halo, Nadia (demo).')
            h.tap('Dokter');h.capture(tag+'-directory');h.tap('Profil '+doctor['name'],scroll=True)
            h.capture(tag+'-profile');h.tap('Pilih jadwal',scroll=True);h.visible('Pilih tanggal');h.capture(tag+'-schedule')
            h.tap(label,scroll=True);h.tap('Lanjut booking',scroll=True);h.visible('Tinjau booking');h.capture(tag+'-review')
            h.tap('Ubah jadwal',scroll=True);tree=h.visible(label,scroll=True)
            assert h.find(tree,label).get('selected')=='true','Editing review must preserve selected time'
            h.adb('shell','input','keyevent','KEYCODE_BACK');h.visible('Pilih jadwal',scroll=True)
            checks.append('Doctor directory/profile/schedule/review and edit/back navigation at font '+scale)
            print('PASS '+checks[-1],flush=True)
        assert h.api('/appointments')==appointments
    except Exception as e:
        report['error']=str(e)
        try:h.capture('failure')
        except Exception:pass
        raise
    finally:
        h.adb('shell','settings','put','system','font_scale',original if original!='null' else '1.0')
        report.update(passed=len(checks),fontScaleRestored=original)
        (E/'doctor-flow-native-font-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
