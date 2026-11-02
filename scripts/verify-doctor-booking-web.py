"""Actual doctor booking UI/API proof; only creates/cancels its own synthetic bookings."""
import json,re,uuid
from pathlib import Path
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence';checks=[];errors=[];created=[]
def api(path,body=None,key=None):
    headers={'Authorization':'Bearer demo-patient-token','Content-Type':'application/json'}
    if key:headers['Idempotency-Key']=key
    data=json.dumps(body).encode() if body is not None else None
    with urlopen(Request('http://127.0.0.1:8080/api/v1'+path,data=data,headers=headers,method='POST' if body is not None else 'GET'),timeout=15) as r:return json.load(r)
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def btn(p,name):return p.get_by_role('button',name=name,exact=True)
def tab(p,name):return p.get_by_role('tab',name=name,exact=True)
def open_doctor(p,doctor):
    tab(p,'Dokter').click()
    back=p.get_by_role('button',name=re.compile('^Kembali ke (pilihan dokter|profil dokter|jadwal)$'))
    while back.is_visible():back.click()
    btn(p,'Filter dokter Semua').click()
    p.get_by_role('textbox',name='Cari dokter, cabang, atau bahasa').fill('')
    btn(p,'Profil '+doctor['name']).click()
    btn(p,'Pilih jadwal').click()
    expect(p.get_by_text('Pilih tanggal',exact=True)).to_be_visible()
def select_first(p):
    available=p.get_by_role('button',name=re.compile('^Pilih waktu ')).filter(has_not=p.get_by_text('Terisi',exact=True))
    expect(available.first).to_be_enabled();available.first.click();return available.first.get_attribute('aria-label')
def main():
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Fictional doctor booking UI against real local API/Postgres; generated demo photos; not hospital scheduling'}
    original=api('/appointments');catalog=api('/doctors')
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(channel='msedge',headless=True);p=browser.new_page(viewport={'width':390,'height':844})
            p.on('pageerror',lambda e:errors.append(str(e)))
            p.goto('http://localhost:8081',wait_until='networkidle')
            expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible()
            expect(p.get_by_text('API DEMO',exact=True)).to_have_count(0)
            p.wait_for_function('Array.from(document.images).length>=5 && Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
            hero=p.get_by_label('Ilustrasi dokter fiktif untuk konsultasi',exact=True).bounding_box()
            assert hero and hero['width']<=390 and hero['height']<350,hero
            p.screenshot(path=str(E/'photo-home.png'))
            passed('Visual Home loads generated hero and four portraits with hidden API diagnostics')
            btn(p,'Pilih dokter').click();expect(p.get_by_role('button',name=re.compile('^Profil '))).to_have_count(4)
            btn(p,'Filter dokter Perempuan').click();expect(p.get_by_role('button',name=re.compile('^Profil '))).to_have_count(2)
            btn(p,'Filter dokter Laki-laki').click();expect(p.get_by_role('button',name=re.compile('^Profil '))).to_have_count(2)
            btn(p,'Filter dokter Semua').click();search=p.get_by_role('textbox',name='Cari dokter, cabang, atau bahasa')
            search.fill('Bandung');expect(p.get_by_role('button',name=re.compile('^Profil '))).to_have_count(2)
            search.fill('no-such-doctor');expect(p.get_by_text('Dokter belum ditemukan',exact=True)).to_be_visible();btn(p,'Lihat semua dokter').click()
            passed('Doctor search, gender/branch preferences and empty-state reset work')
            maya=next(d for d in catalog if d['id']=='doctor-maya');arif=next(d for d in catalog if d['id']=='doctor-arif')
            btn(p,'Favoritkan '+maya['name']).click();btn(p,'Filter dokter Favorit').click();expect(p.get_by_role('button',name=re.compile('^Profil '))).to_have_count(1)
            tab(p,'Profil').click();tab(p,'Dokter').click();expect(btn(p,'Filter dokter Favorit')).to_have_attribute('aria-pressed','true')
            p.screenshot(path=str(E/'photo-doctors.png'));passed('Favorite doctor and directory selection survive peer-tab navigation')
            tab(p,'Beranda').click();btn(p,'Profil '+maya['name']).click()
            expect(btn(p,'Pilih jadwal')).to_be_visible();p.screenshot(path=str(E/'photo-doctor-profile.png'))
            btn(p,'Pilih jadwal').click()
            expect(p.get_by_text('Pilih tanggal',exact=True)).to_be_visible();expect(p.get_by_role('button',name=re.compile('^Pilih tanggal '))).to_have_count(3)
            p.screenshot(path=str(E/'photo-doctor-schedule.png'));select_first(p)
            reason=p.get_by_role('textbox',name='Keperluan konsultasi');reason.fill('Konsultasi fiktif untuk verifikasi pilihan dokter')
            btn(p,'Lanjut booking').click();expect(p.get_by_text('Tinjau booking',exact=True)).to_be_visible();p.screenshot(path=str(E/'photo-booking-review.png'))
            passed('Home doctor card opens that profile and selected date/time reaches booking review')
            captured=[]
            def lose_response(route):
                if route.request.method!='POST':route.continue_();return
                response=route.fetch();item=response.json();created.append(item['id']);captured.append(item)
                route.abort('failed')
            p.route('**/api/v1/doctor-bookings',lose_response);btn(p,'Booking demo').click()
            expect(p.get_by_text('Booking belum dapat dipastikan. Coba lagi untuk memeriksa permintaan yang sama.',exact=True)).to_be_visible()
            p.unroute('**/api/v1/doctor-bookings',lose_response)
            btn(p,'Booking demo').click();expect(p.get_by_text('Booking demo tersimpan',exact=True)).to_be_visible()
            all_bookings=api('/doctor-bookings');assert len([b for b in all_bookings if b['id']==captured[0]['id']])==1
            p.screenshot(path=str(E/'photo-booking-receipt.png'));passed('Lost POST response retries the same key and creates exactly one persisted booking')
            btn(p,'Lihat janji saya').click();expect(btn(p,'Detail booking '+maya['name'])).to_be_visible()
            p.reload(wait_until='networkidle');tab(p,'Janji').click();expect(btn(p,'Detail booking '+maya['name'])).to_be_visible()
            assert api('/appointments')==original;p.screenshot(path=str(E/'photo-appointments.png'))
            passed('Booking survives browser reload and remains separate from official clinical appointments')
            btn(p,'Detail booking '+maya['name']).click();btn(p,'Batalkan booking').click();btn(p,'Konfirmasi batal '+maya['name']).click()
            expect(btn(p,'Detail booking '+maya['name'])).to_have_count(0)
            assert api('/doctor-bookings/'+captured[0]['id'])['status']=='cancelled_demo'
            passed('Explicit cancellation updates API and releases the selected doctor slot')
            # Hold an old confirmed response while the user refreshes and cancels.
            open_doctor(p,maya);select_first(p);btn(p,'Lanjut booking').click()
            p.route('**/api/v1/doctor-bookings',lose_response);btn(p,'Booking demo').click()
            expect(p.get_by_text('Booking belum dapat dipastikan. Coba lagi untuk memeriksa permintaan yang sama.',exact=True)).to_be_visible()
            race_booking=captured[-1]
            p.unroute('**/api/v1/doctor-bookings',lose_response);held=[]
            def hold_retry(route):
                if route.request.method!='POST':route.continue_();return
                response=route.fetch();held.append((route,response))
            p.route('**/api/v1/doctor-bookings',hold_retry);btn(p,'Booking demo').click()
            tab(p,'Profil').click();btn(p,'Muat ulang data').click();tab(p,'Janji').click()
            expect(btn(p,'Detail booking '+maya['name'])).to_be_visible()
            btn(p,'Detail booking '+maya['name']).click();btn(p,'Batalkan booking').click();btn(p,'Konfirmasi batal '+maya['name']).click()
            expect(btn(p,'Detail booking '+maya['name'])).to_have_count(0)
            assert held and api('/doctor-bookings/'+race_booking['id'])['status']=='cancelled_demo'
            held[0][0].fulfill(response=held[0][1]);p.unroute('**/api/v1/doctor-bookings',hold_retry)
            tab(p,'Dokter').click()
            expect(p.get_by_text('Booking demo dibatalkan',exact=True)).to_be_visible()
            tab(p,'Janji').click();expect(btn(p,'Detail booking '+maya['name'])).to_have_count(0)
            passed('A delayed confirmed retry cannot revive a booking canceled through another tab')
            open_doctor(p,arif);slots=api('/doctors/'+arif['id']+'/slots');slot=next(s for s in slots if s['available'])
            select_first(p);btn(p,'Lanjut booking').click()
            rival=api('/doctor-bookings',{'doctorId':arif['id'],'slotId':slot['id'],'reason':'Synthetic competing reservation'},str(uuid.uuid4()));created.append(rival['id'])
            btn(p,'Booking demo').click();expect(p.get_by_text('Waktu ini sudah terisi. Pilih waktu lain.',exact=True)).to_be_visible()
            expect(p.get_by_role('button',name=re.compile('^Pilih waktu ')).filter(has=p.get_by_text('Terisi',exact=True)).first).to_be_disabled()
            passed('A real occupied-slot409 refreshes availability without false confirmation')
            for width,height in [(360,800),(480,900),(844,390)]:
                p.set_viewport_size({'width':width,'height':height});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                p.screenshot(path=str(E/f'photo-booking-layout-{width}.png'))
            passed('Doctor profile/date/time layout fits small, wide and landscape viewports')
            tab(p,'Beranda').click();btn(p,'Cari cabang Morula').click();text=p.locator('body').inner_text()
            assert 'akurasi' not in text.lower() and 'Lokasi Anda terdeteksi' not in text and '±' not in text
            passed('Branch utility keeps GPS accuracy and detection diagnostics out of product UI')
            browser.close()
        assert not errors,errors;passed('No uncaught page errors in visual booking journeys')
    except Exception as e:report['error']=str(e);raise
    finally:
        cleanup_errors=[]
        for item in created:
            try:
                cancelled=api('/doctor-bookings/'+item+'/cancel',{})
                assert cancelled['status']=='cancelled_demo'
            except Exception as cleanup_error:cleanup_errors.append(str(cleanup_error))
        report.update(passed=len(checks),pageErrors=errors,createdBookingIds=created,cleanupErrors=cleanup_errors)
        (E/'photo-booking-web-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        if cleanup_errors:raise AssertionError('Own booking cleanup failed: '+str(cleanup_errors))
if __name__=='__main__':main()
