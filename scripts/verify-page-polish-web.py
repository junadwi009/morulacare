"""Profile disclosures, preference recovery and booking loading/error states."""
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence'
BASE='http://localhost:8081';API='http://localhost:8080/api/v1'
checks=[];errors=[]
def api(path,body=None):
    if path=='/preferences' and body is None:return api('/overview')['preferences']
    data=json.dumps(body).encode() if body is not None else None
    with urlopen(Request(API+path,data=data,headers={'Authorization':'Bearer demo-patient-token','Content-Type':'application/json'},method='PATCH' if body is not None else 'GET'),timeout=15) as r:return json.load(r)
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def btn(p,name):return p.get_by_role('button',name=name,exact=True)
def tab(p,name):return p.get_by_role('tab',name=name,exact=True)
def ready(browser):
    p=browser.new_page(viewport={'width':390,'height':844});p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(BASE,wait_until='networkidle');expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible();return p
def main():
    original=api('/preferences')
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Polished secondary pages on React Native Web against local API'}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(channel='msedge',headless=True);p=ready(browser)
            tab(p,'Profil').click()
            for name in ['Pratinjau pemberitahuan','Akses pasangan']:expect(btn(p,name)).to_have_attribute('aria-expanded','false')
            expect(p.get_by_text('Privat secara default',exact=True)).to_have_count(0)
            btn(p,'Akses pasangan').click();expect(p.get_by_text('Privat secara default',exact=True)).to_be_visible()
            btn(p,'Akses pasangan').click();btn(p,'Pratinjau pemberitahuan').click()
            expect(p.get_by_text('Pratinjau demo; belum mengirim notifikasi.',exact=True)).to_be_visible()
            passed('Profile disclosures open real preview/privacy detail and collapse without changing preferences')
            # Set service on for the preview, then exercise the actual privacy PATCH.
            api('/preferences',{**original,'serviceNotifications':True})
            btn(p,'Muat ulang data').click()
            private=p.get_by_role('switch',name='Notifikasi privat',exact=True)
            expect(private).to_be_checked(checked=original['discreetNotifications'])
            private.click();expect(private).to_be_checked(checked=not original['discreetNotifications'])
            text='Ada pembaruan untuk Anda. Buka aplikasi untuk melihatnya.' if not original['discreetNotifications'] else 'Contoh demo: laporan perawatan Anda tersedia.'
            expect(p.get_by_text(text,exact=True)).to_be_visible()
            assert api('/preferences')['discreetNotifications']==(not original['discreetNotifications'])
            private.click();expect(private).to_be_checked(checked=original['discreetNotifications'])
            passed('Notification preview follows the saved API privacy preference')
            service=p.get_by_role('switch',name='Informasi layanan',exact=True)
            p.route('**/api/v1/preferences',lambda route:route.fulfill(status=503,json={'message':'Preference test failure'},headers={'Access-Control-Allow-Origin':BASE}))
            service.click();expect(p.get_by_role('alert')).to_be_visible();expect(service).to_be_checked()
            p.unroute('**/api/v1/preferences');btn(p,'Tutup pemberitahuan tindakan').click()
            service.click();expect(service).not_to_be_checked();service.click();expect(service).to_be_checked()
            passed('Failed preference save keeps its previous value and retry reaches API')
            p.screenshot(path=str(E/'polish-profile-preview.png'))
            for name in ['Perjalanan','Janji','Profil']:
                tab(p,name).click();p.screenshot(path=str(E/f'polish-{name.lower()}.png'))
            tab(p,'Janji').click();tab(p,'Riwayat janji').click()
            expect(btn(p,'Detail janji Pengambilan sel telur')).to_be_visible()
            expect(btn(p,'Lihat booking dibatalkan')).to_have_attribute('aria-expanded','false')
            expect(p.get_by_role('button',name=__import__('re').compile('^Detail booking '))).to_have_count(0)
            btn(p,'Lihat booking dibatalkan').click()
            expect(btn(p,'Tutup booking dibatalkan')).to_have_attribute('aria-expanded','true')
            if any(b['status']=='cancelled_demo' for b in api('/doctor-bookings')):
                expect(p.get_by_role('button',name=__import__('re').compile('^Detail booking ')).first).to_be_visible()
            btn(p,'Tutup booking dibatalkan').click()
            p.screenshot(path=str(E/'polish-janji-history.png'))
            passed('Clinical appointment history appears first; cancelled bookings expand only on request')
            p.close()
            # Hold the first booking GET while overview loads; never show a false empty state.
            p=browser.new_page(viewport={'width':390,'height':844});held=[]
            p.on('pageerror',lambda e:errors.append(str(e)))
            p.route('**/api/v1/doctor-bookings',lambda route:held.append(route))
            p.goto(BASE,wait_until='domcontentloaded');expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible();tab(p,'Janji').click()
            expect(p.get_by_text('Memuat booking...',exact=True)).to_be_visible()
            expect(p.get_by_text('Belum ada booking dokter.',exact=True)).to_have_count(0)
            assert len(held)==1;held[0].continue_();expect(p.get_by_text('Memuat booking...',exact=True)).to_have_count(0)
            passed('Appointments distinguish a pending booking load from an empty list')
            p.unroute('**/api/v1/doctor-bookings')
            p.route('**/api/v1/doctor-bookings',lambda route:route.fulfill(status=503,json={'message':'Booking test failure'},headers={'Access-Control-Allow-Origin':BASE}))
            tab(p,'Profil').click();btn(p,'Muat ulang data').click();tab(p,'Janji').click()
            expect(p.get_by_text('Booking belum dapat diperbarui.',exact=True)).to_be_visible()
            expect(p.get_by_text('Belum ada booking dokter.',exact=True)).to_have_count(0)
            p.unroute('**/api/v1/doctor-bookings');btn(p,'Coba lagi booking').click()
            expect(p.get_by_text('Booking belum dapat diperbarui.',exact=True)).to_have_count(0)
            expect(p.get_by_text('Memuat booking...',exact=True)).to_have_count(0)
            passed('Booking refresh error has a working retry without misleading empty state')
            p.close();browser.close()
        assert not errors,errors;passed('No uncaught browser errors in secondary-page flows')
    except Exception as e:report['error']=str(e);raise
    finally:
        api('/preferences',original)
        report.update(passed=len(checks),pageErrors=errors,preferencesRestored=api('/preferences')==original)
        (E/'page-polish-web-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
