"""Native standalone doctor booking; own AVD and synthetic records only."""
import importlib.util,json,time,sys,uuid,re
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence'
spec=importlib.util.spec_from_file_location('morula_native_helpers',ROOT/'scripts/android-smoke.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
h.STANDALONE=True;h.PACKAGE='com.example.morulacare.concept';h.PREFIX='photo-native-'
checks=[];created=[];run_mark='native-'+uuid.uuid4().hex[:12]
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def wait_booking_status(id,status):
    for _ in range(15):
        value=h.api('/doctor-bookings/'+id)
        if value['status']==status:return value
        time.sleep(.3)
    raise AssertionError('Booking status did not reach '+status)
def focus_reason():
    # The heading and EditText intentionally share visible wording; target the
    # real native editable control rather than its noninteractive heading.
    for _ in range(12):
        tree=h.hierarchy()
        for node in tree.iter('node'):
            if node.get('class','').endswith('EditText') and node.get('content-desc')=='Keperluan konsultasi':
                x1,y1,x2,y2=map(int,re.findall(r'\d+',node.get('bounds','')))
                if x2>x1 and y2>y1 and y1>=350 and y2<=2050:
                    h.adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
                    for _ in range(15):
                        ime=h.adb('shell','dumpsys','input_method')
                        if 'mInputShown=true' in ime or 'isInputViewShown=true' in ime:return
                        time.sleep(.2)
        h.adb('shell','input','swipe','1040','1800','1040','650','450')
    raise AssertionError('Native consultation EditText did not focus/show keyboard')
def main():
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Standalone Android35 Google APIs; fictional doctor booking against local API/Postgres; no Expo Go/Metro'}
    original=h.api('/appointments');before={b['id'] for b in h.api('/doctor-bookings')};stylus_original=None
    try:
        assert 'MorulaCare_Google_API_35' in [x.strip() for x in h.adb('emu','avd','name').splitlines()]
        stylus_original=h.adb('shell','settings','get','secure','stylus_handwriting_enabled').strip()
        h.adb('shell','settings','put','secure','stylus_handwriting_enabled','0')
        h.open_app();h.visible('Halo, Nadia (demo).');h.capture('home')
        passed('Native standalone visual Home renders generated doctor assets')
        catalog=h.api('/doctors');doctor=next(d for d in catalog if d['id']=='doctor-maya')
        h.tap('Dokter');h.tap('Filter dokter Perempuan');h.visible('Profil '+doctor['name'])
        h.tap('Favoritkan '+doctor['name']);h.tap('Filter dokter Favorit');h.capture('directory')
        passed('Native gender preference and favorite doctor selection work')
        h.tap('Profil '+doctor['name']);h.capture('doctor-profile')
        h.tap('Pilih jadwal',scroll=True);h.visible('Pilih tanggal');h.capture('doctor-schedule')
        slot=next(s for s in h.api('/doctors/'+doctor['id']+'/slots') if s['available'])
        stamp=datetime.fromisoformat(slot['startsAt']);label=f'Pilih waktu {stamp.hour:02d}.{stamp.minute:02d} WIB'
        h.tap(label,scroll=True);focus_reason()
        h.adb('shell','input','keyevent','KEYCODE_MOVE_END')
        h.adb('shell','input','text','%s'+run_mark)
        h.capture('booking-keyboard');ime=h.keyboard_top();assert 0<ime<2340,'Expected the actual docked Android keyboard inset'
        # ScrollView intentionally dismisses the keyboard on drag. Exercise that
        # gesture, then locate the CTA in the newly expanded viewport.
        h.adb('shell','input','swipe','1040',str(ime-160),'1040','500','500')
        time.sleep(.6)
        assert 'mInputShown=false' in h.adb('shell','dumpsys','input_method'),'Drag should dismiss the keyboard'
        h.tap('Lanjut booking',scroll=True,capture_before='booking-keyboard-submit')
        h.visible('Tinjau booking');h.capture('booking-review')
        passed('Native doctor/date/time and editable reason reach review after drag dismisses keyboard')
        h.tap('Booking demo',scroll=True);h.visible('Booking demo tersimpan');h.capture('booking-receipt')
        fresh=[b for b in h.api('/doctor-bookings') if b['id'] not in before and run_mark in b['reason']]
        assert len(fresh)==1 and fresh[0]['doctorId']==doctor['id'] and fresh[0]['status']=='confirmed_demo';created.append(fresh[0]['id'])
        assert h.api('/appointments')==original
        passed('Native booking creates exactly one real demo reservation and keeps official appointments intact')
        h.tap('Lihat janji saya');h.visible('Detail booking '+doctor['name'],scroll=True);h.capture('booked-appointment')
        h.open_app();h.visible('Halo, Nadia (demo).');h.tap('Janji');h.visible('Detail booking '+doctor['name'],scroll=True)
        passed('Booking persists after native cold launch and reload from API')
        h.tap('Detail booking '+doctor['name']);h.tap('Batalkan booking',scroll=True);h.tap('Konfirmasi batal '+doctor['name'],scroll=True)
        wait_booking_status(created[0],'cancelled_demo')
        assert next(s for s in h.api('/doctors/'+doctor['id']+'/slots') if s['id']==slot['id'])['available']
        h.capture('booking-cancelled');passed('Native explicit cancellation reaches API and releases the reserved slot')
    except Exception as e:
        report['error']=str(e)
        try:h.capture('booking-failure')
        except Exception:pass
        raise
    finally:
        cleanup=[]
        # Also recover a booking if failure occurred before its receipt was observed.
        try:
            for item in h.api('/doctor-bookings'):
                if item['id'] not in before and run_mark in item['reason'] and item['doctorId']=='doctor-maya' and item['id'] not in created:created.append(item['id'])
            for id in created:
                h.api('/doctor-bookings/'+id+'/cancel',{},'POST')
                wait_booking_status(id,'cancelled_demo')
        except Exception as e:cleanup.append(str(e))
        if stylus_original is not None:
            if stylus_original=='null':h.adb('shell','settings','delete','secure','stylus_handwriting_enabled')
            else:h.adb('shell','settings','put','secure','stylus_handwriting_enabled',stylus_original)
        report.update(passed=len(checks),createdBookingIds=created,cleanupErrors=cleanup,stylusHandwritingSettingRestored=stylus_original)
        (E/'photo-native-booking-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        if cleanup:raise AssertionError('Own synthetic booking cleanup failed: '+str(cleanup))
if __name__=='__main__':main()
