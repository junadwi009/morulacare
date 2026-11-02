"""Doctor profile/schedule usability and recovery; controlled slot GETs, no bookings."""
import json,re
from pathlib import Path
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence';checks=[];errors=[];H={'Access-Control-Allow-Origin':'http://localhost:8081'}
def api(path):
    with urlopen(Request('http://127.0.0.1:8080/api/v1'+path,headers={'Authorization':'Bearer demo-patient-token'}),timeout=15) as r:return json.load(r)
def btn(p,name):return p.get_by_role('button',name=name,exact=True)
def dates(p):return p.get_by_role('button',name=re.compile('^Pilih tanggal '))
def times(p):return p.get_by_role('button',name=re.compile('^Pilih waktu '))
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def ready(browser):
    p=browser.new_page(viewport={'width':390,'height':844});p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto('http://localhost:8081',wait_until='networkidle');expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible();return p
def profile(p,d):
    p.get_by_role('tab',name='Dokter',exact=True).click();btn(p,'Profil '+d['name']).click();expect(btn(p,'Pilih jadwal')).to_be_visible()
def main():
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Doctor profile/schedule UI; real local API plus controlled slot responses; no reservation created'}
    original=api('/appointments');doctors=api('/doctors');maya=next(d for d in doctors if d['id']=='doctor-maya');arif=next(d for d in doctors if d['id']=='doctor-arif');slots=api('/doctors/doctor-maya/slots')
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(channel='msedge',headless=True);p=ready(browser);profile(p,maya)
            portrait=p.get_by_label('Foto dokter fiktif '+maya['name'],exact=True).bounding_box()
            assert portrait and portrait['width']<=390 and portrait['height']<400,portrait
            expect(dates(p)).to_have_count(0);expect(btn(p,'Tentang dokter')).to_have_attribute('aria-expanded','false')
            btn(p,'Tentang dokter').click();expect(p.get_by_text(maya['bio'],exact=True)).to_be_visible();btn(p,'Tentang dokter').click()
            p.screenshot(path=str(E/'doctor-flow-profile.png'));btn(p,'Pilih jadwal').click()
            expect(dates(p)).to_have_count(3);expect(p.get_by_text('Pagi',exact=True)).to_be_visible();expect(p.get_by_text('Siang',exact=True)).to_be_visible()
            passed('Concise doctor profile discloses its bio and opens a separate date/time step')
            times(p).first.click();first=times(p).first.get_attribute('aria-label');expect(btn(p,'Lanjut booking')).to_be_enabled()
            dates(p).nth(1).click();expect(btn(p,'Lanjut booking')).to_be_disabled()
            assert times(p).evaluate_all("els=>els.every(e=>e.getAttribute('aria-pressed')!=='true')")
            times(p).first.click();selected_date=dates(p).nth(1).get_attribute('aria-label');selected_time=times(p).first.get_attribute('aria-label')
            p.get_by_role('textbox',name='Keperluan konsultasi').fill('Draf konsultasi fiktif')
            btn(p,'Lanjut booking').click();expect(p.get_by_text('Tinjau booking',exact=True)).to_be_visible();p.screenshot(path=str(E/'doctor-flow-review.png'))
            btn(p,'Ubah jadwal').click();expect(btn(p,selected_date)).to_have_attribute('aria-pressed','true');expect(btn(p,selected_time)).to_have_attribute('aria-pressed','true')
            expect(p.get_by_role('textbox',name='Keperluan konsultasi')).to_have_value('Draf konsultasi fiktif')
            btn(p,'Kembali ke profil dokter').click();expect(btn(p,'Pilih jadwal')).to_be_visible();btn(p,'Pilih jadwal').click()
            expect(btn(p,selected_date)).to_have_attribute('aria-pressed','true');expect(btn(p,selected_time)).to_have_attribute('aria-pressed','true')
            p.screenshot(path=str(E/'doctor-flow-schedule.png'));passed('Changing date clears time; editing review/back preserves the chosen schedule and draft')
            for width,height in [(360,800),(480,900),(844,390)]:
                p.set_viewport_size({'width':width,'height':height});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                p.screenshot(path=str(E/f'doctor-flow-layout-{width}.png'))
            passed('Schedule selection fits small, wide and landscape viewports');p.close()
            p=ready(browser);mutated=[{**s,'available':False if s['startsAt'][:10]==slots[0]['startsAt'][:10] else s['available']} for s in slots]
            p.route('**/api/v1/doctors/doctor-maya/slots',lambda route:route.fulfill(json=mutated,headers=H))
            profile(p,maya);btn(p,'Pilih jadwal').click();expect(dates(p).first).to_be_disabled();expect(dates(p).nth(1)).to_have_attribute('aria-pressed','true')
            p.screenshot(path=str(E/'doctor-flow-full-date.png'));passed('A fully occupied day is disabled and the first available day is selected');p.close()
            p=ready(browser);p.route('**/api/v1/doctors/doctor-maya/slots',lambda route:route.fulfill(json=[{**s,'available':False} for s in slots],headers=H))
            profile(p,maya);btn(p,'Pilih jadwal').click()
            for i in range(3):expect(dates(p).nth(i)).to_be_disabled()
            expect(btn(p,'Lanjut booking')).to_be_disabled();passed('No available day cannot advance to a false booking review');p.close()
            p=ready(browser);pattern='**/api/v1/doctors/doctor-maya/slots'
            p.route(pattern,lambda route:route.fulfill(status=503,json={'message':'Controlled schedule failure'},headers=H))
            profile(p,maya);btn(p,'Pilih jadwal').click();expect(btn(p,'Coba lagi jadwal')).to_be_visible();expect(btn(p,'Lanjut booking')).to_be_disabled()
            p.unroute(pattern);btn(p,'Coba lagi jadwal').click();expect(dates(p)).to_have_count(3);times(p).first.click();expect(btn(p,'Lanjut booking')).to_be_enabled()
            passed('Schedule load failure blocks review and retry restores actual available slots');p.close()
            p=ready(browser);tzslots=[{**slots[i],'timeZone':'Asia/Makassar','startsAt':f'2026-11-03T{hour}:00:00Z'} for i,hour in enumerate(['03','05','09'])]
            p.route(pattern,lambda route:route.fulfill(json=tzslots,headers=H));profile(p,maya);btn(p,'Pilih jadwal').click()
            for label in ['Pilih waktu 11.00 WITA','Pilih waktu 13.00 WITA','Pilih waktu 17.00 WITA']:expect(btn(p,label)).to_be_visible()
            for label in ['Pagi','Siang','Sore']:expect(p.get_by_text(label,exact=True)).to_be_visible()
            passed('Time labels and day-part groups follow the slot timezone instead of the device timezone');p.close()
            p=ready(browser);held=[];p.route(pattern,lambda route:held.append(route))
            profile(p,maya);btn(p,'Kembali ke pilihan dokter').click();btn(p,'Profil '+arif['name']).click();btn(p,'Pilih jadwal').click();expect(dates(p)).to_have_count(3)
            assert held;held[0].fulfill(json=tzslots,headers=H)
            expect(btn(p,'Pilih waktu 09.00 WIB')).to_be_visible();expect(btn(p,'Pilih waktu 11.00 WITA')).to_have_count(0)
            passed('A late schedule response for a previous doctor cannot replace the current doctor slots');p.close();browser.close()
        assert api('/appointments')==original and not errors,errors;passed('Clinical appointments remain unchanged and no uncaught page errors occur')
    except Exception as e:report['error']=str(e);raise
    finally:
        report.update(passed=len(checks),pageErrors=errors)
        (E/'doctor-flow-web-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
