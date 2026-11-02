"""Verify care hierarchy, navigation continuity and directory dismissal on web API mode."""
import json
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/evidence'
checks=[]
errors=[]
def passed(name):
    checks.append(name);print('PASS '+name,flush=True)
def button(page,name):return page.get_by_role('button',name=name,exact=True)
def tab(page,name):return button(page,'Buka asisten') if name=='Asisten' else page.get_by_role('tab',name=name,exact=True)
def directory(page):button(page,'Cari cabang Morula').click()
def ready(context):
    p=context.new_page();p.on('pageerror',lambda error:errors.append(str(error)))
    p.goto('http://localhost:8081',wait_until='networkidle')
    expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible();return p

def main():
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'React Native Web API; synthetic patient, controlled browser location. Not patient usability research.'}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(channel='msedge',headless=True)
            context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
            p=ready(context)
            a=button(p,'Cari dokter dan jadwal').bounding_box()
            b=p.get_by_text('Dokter pilihan',exact=True).bounding_box()
            c=p.get_by_text('Ringkasan perawatan',exact=True).bounding_box()
            assert a and b and c and a['y']<b['y']<c['y']
            expect(p.get_by_text('API DEMO',exact=True)).to_have_count(0)
            expect(p.get_by_role('textbox',name='Cari kota atau cabang Morula')).to_have_count(0)
            passed('Visual Home prioritizes doctor choice and keeps API/GPS diagnostics hidden')
            button(p,'Pilih dokter').click()
            expect(p.get_by_role('textbox',name='Cari dokter, cabang, atau bahasa')).to_be_visible()
            tab(p,'Beranda').click()
            for width,height in [(360,800),(390,844),(480,900),(844,390)]:
                p.set_viewport_size({'width':width,'height':height})
                tab(p,'Beranda').click()
                assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
                for name in ['Beranda','Perjalanan','Janji','Dokter','Profil']:
                    box=tab(p,name).bounding_box();assert box and box['height']>=48 and box['y']+box['height']<=height
                p.screenshot(path=str(E/f'ux-home-{width}.png'))
            passed('Home and five navigation targets fit small, standard, wide and landscape viewports')
            p.set_viewport_size({'width':390,'height':844})
            for name in ['Perjalanan','Janji','Dokter','Asisten','Profil']:
                tab(p,name).click();p.set_viewport_size({'width':844,'height':390})
                assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
                if name=='Asisten':
                    send=button(p,'Kirim pesan').bounding_box()
                    assert send and 0<=send['y'] and send['y']+send['height']<390
                p.screenshot(path=str(E/f'ux-landscape-{name}.png'))
                p.set_viewport_size({'width':390,'height':844})
            passed('All secondary pages fit landscape and assistant composer remains reachable')
            tab(p,'Perjalanan').click();tab(p,'Riwayat').click();button(p,'Tindakan').click()
            tab(p,'Profil').click();tab(p,'Perjalanan').click()
            expect(tab(p,'Riwayat')).to_have_attribute('aria-selected','true')
            expect(button(p,'Tindakan')).to_have_attribute('aria-pressed','true')
            p.screenshot(path=str(E/'ux-journey-history.png'))
            passed('Journey segment and history filter persist across peer-tab navigation')
            tab(p,'Program').click();p.screenshot(path=str(E/'ux-journey-program.png'))
            tab(p,'Janji').click();tab(p,'Riwayat janji').click();tab(p,'Beranda').click();tab(p,'Janji').click()
            expect(tab(p,'Riwayat janji')).to_have_attribute('aria-selected','true')
            tab(p,'Akan datang').click();p.screenshot(path=str(E/'ux-appointments.png'))
            button(p,'Detail janji Konsultasi rencana berikutnya').click()
            expect(p.get_by_text('Persiapan kunjungan',exact=True)).to_be_visible();button(p,'Tutup detail').click()
            passed('Appointment segment persists and featured visit opens actual preparation')
            tab(p,'Asisten').click();pending=[]
            p.route('**/api/v1/chat',lambda route:pending.append(route))
            button(p,'Jadwal saya berikutnya').click()
            expect(p.get_by_text('Mencari informasi dalam data demo…',exact=True)).to_be_visible()
            tab(p,'Beranda').click();assert pending;pending[0].continue_()
            tab(p,'Asisten').click()
            expect(p.get_by_text('Pada snapshot demo, janji Anda:',exact=False)).to_be_visible()
            p.get_by_role('textbox',name='Pesan untuk asisten',exact=True).fill('Draf pertanyaan fiktif')
            tab(p,'Profil').click();p.screenshot(path=str(E/'ux-profile.png'));tab(p,'Asisten').click()
            expect(p.get_by_role('textbox',name='Pesan untuk asisten',exact=True)).to_have_value('Draf pertanyaan fiktif')
            p.screenshot(path=str(E/'ux-assistant.png'))
            passed('Assistant pending reply, conversation and unsent draft survive tab navigation')
            tab(p,'Beranda').click();directory(p)
            expect(button(p,'Tutup detail')).to_be_visible()
            assert p.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
            # Active ancestor animations would include a modal fade/slide if enabled.
            assert button(p,'Tutup detail').evaluate('(el)=>{for(let n=el;n;n=n.parentElement){if(n.getAnimations().some(a=>a.playState==="running"))return false;}return true;}')
            p.screenshot(path=str(E/'ux-directory.png'));button(p,'Tutup detail').click()
            passed('Reduced-motion preference opens directory without a running entrance animation')
            context.close()
            pending_context=browser.new_context(viewport={'width':390,'height':844})
            pending_context.add_init_script("""const original=navigator.permissions.query.bind(navigator.permissions);navigator.permissions.query=o=>o.name==='geolocation'?Promise.resolve({state:'granted'}):original(o);navigator.geolocation.getCurrentPosition=ok=>{window.finishLocation=()=>ok({coords:{latitude:-6.195055,longitude:106.8338607,accuracy:50},timestamp:Date.now()});};""")
            p=ready(pending_context);directory(p);button(p,'Gunakan lokasi saya').click()
            expect(button(p,'Batalkan deteksi lokasi')).to_be_visible()
            button(p,'Tutup detail').click();p.evaluate('window.finishLocation()');directory(p)
            expect(p.get_by_text('Pilih cabang',exact=True)).to_be_visible()
            expect(p.get_by_text('Cabang sekitar Anda',exact=True)).to_have_count(0)
            passed('Dismissing a pending location sheet cancels and ignores its late callback')
            pending_context.close()
            mixed=browser.new_context(viewport={'width':390,'height':844})
            p=mixed.new_page()
            def no_embryos(route):
                r=route.fetch();data=r.json();data['embryos']=[];route.fulfill(response=r,json=data)
            p.route('**/api/v1/overview',no_embryos);p.goto('http://localhost:8081',wait_until='networkidle')
            expect(p.get_by_text('Laporan embrio',exact=True)).to_be_visible()
            button(p,'Status embrio').click()
            expect(p.get_by_text('Belum ada laporan dirilis',exact=True)).to_be_visible()
            expect(p.get_by_text('Pembaruan tersedia setelah ditinjau tim embriologi. Belum ada laporan tidak berarti hasil negatif.',exact=True)).to_be_visible()
            passed('Empty released reports remain explicit through the visual Home shortcut')
            mixed.close();browser.close()
        assert not errors,errors
        passed('No uncaught page errors during new patient journeys')
    except Exception as error:
        report['error']=str(error);raise
    finally:
        report['passed']=len(checks);report['pageErrors']=errors
        (E/'ux-journey-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
