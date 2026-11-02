"""Assistant retry/draft/provenance and session-only notification read flow."""
import json
from pathlib import Path
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence';checks=[];errors=[]
H={'Access-Control-Allow-Origin':'http://localhost:8081'}
def api(path):
    with urlopen(Request('http://localhost:8080/api/v1'+path,headers={'Authorization':'Bearer demo-patient-token'}),timeout=15) as r:return json.load(r)
def btn(p,name):return p.get_by_role('button',name=name,exact=True)
def tab(p,name):return p.get_by_role('tab',name=name,exact=True)
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def ready(browser):
    p=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto('http://localhost:8081',wait_until='networkidle');expect(p.get_by_text('Halo, Nadia (demo).',exact=True)).to_be_visible();return p
def main():
    original=api('/overview');notifications=original['notifications'];unread=next(i for i in notifications if not i['read'])
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Local API / assistant UI and notification session markers; no push, hospital message or read-state API write'}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(channel='msedge',headless=True);p=ready(browser);btn(p,'Buka asisten').click()
            expect(btn(p,'Tentang asisten')).to_have_attribute('aria-expanded','false');btn(p,'Tentang asisten').click()
            expect(p.get_by_text('Asisten demo berbasis aturan, bukan petugas atau AI medis. Pertanyaan klinis dibahas bersama tim perawatan.',exact=True)).to_be_visible()
            btn(p,'Tentang asisten').click()
            for name in ['Jadwal saya berikutnya','Status embrio saya','Perawatan terakhir']:expect(btn(p,name)).to_be_visible()
            p.screenshot(path=str(E/'assistant-notifications-welcome.png'));passed('Concise assistant welcome retains suggestions and an explicit clinical-boundary disclosure')
            with p.expect_response(lambda r:'/api/v1/chat' in r.url and r.request.method=='POST') as response:btn(p,'Jadwal saya berikutnya').click()
            reply=response.value.json();expect(p.get_by_text(reply['text'],exact=True)).to_be_visible()
            expect(p.get_by_text(reply['sourceLabel'],exact=True)).to_have_count(0);btn(p,'Sumber jawaban 1').click()
            expect(p.get_by_text(reply['sourceLabel'],exact=True)).to_be_visible();btn(p,'Sumber jawaban 1').click()
            passed('Actual API reply provenance appears on request instead of repeating technical strips')
            composer=p.get_by_role('textbox',name='Pesan untuk asisten');question='Pertanyaan fiktif untuk uji retry';draft='Draf baru yang harus tetap ada'
            p.route('**/api/v1/chat',lambda route:route.fulfill(status=503,json={'message':'Controlled retry failure'},headers=H))
            composer.fill(question);btn(p,'Kirim pesan').click();expect(btn(p,'Coba lagi pesan')).to_be_visible();expect(composer).to_have_value(question)
            composer.fill(draft);btn(p,'Coba lagi pesan').click();expect(btn(p,'Coba lagi pesan')).to_be_visible();expect(composer).to_have_value(draft)
            expect(p.get_by_text(question,exact=True)).to_have_count(1)
            p.unroute('**/api/v1/chat');btn(p,'Coba lagi pesan').click();expect(btn(p,'Coba lagi pesan')).to_have_count(0);expect(composer).to_have_value(draft)
            expect(p.get_by_text(question,exact=True)).to_have_count(1)
            p.screenshot(path=str(E/'assistant-notifications-retry.png'));passed('Retry success and failure preserve an edited composer draft without duplicate user bubbles')
            held=[]
            def hold(route):held.append((route,route.fetch()))
            p.route('**/api/v1/chat',hold);btn(p,'Kirim pesan').click(click_count=2)
            expect(p.get_by_text('Mencari informasi dalam data demo…',exact=True)).to_be_visible();expect(btn(p,'Kirim pesan')).to_be_disabled()
            tab(p,'Beranda').click();assert len(held)==1
            held[0][0].fulfill(response=held[0][1]);p.unroute('**/api/v1/chat');btn(p,'Buka asisten').click()
            expect(p.get_by_text(draft,exact=True)).to_have_count(1);expect(btn(p,'Sumber jawaban 3')).to_be_visible()
            composer.fill('Draf sesi');tab(p,'Profil').click();btn(p,'Buka asisten').click();expect(composer).to_have_value('Draf sesi')
            passed('Rapid send creates one request; pending reply and composer draft survive tab navigation')
            composer.fill('Berapa dosis obat saya?');btn(p,'Kirim pesan').click();expect(btn(p,'Bantuan tim klinik')).to_be_visible()
            btn(p,'Bantuan tim klinik').click();expect(p.get_by_role('textbox',name='Catatan permintaan')).to_be_visible();btn(p,'Tutup detail').click()
            passed('Clinical questions still lead to the actual demo staff-help form')
            for width,height in [(360,800),(480,900),(844,390)]:
                p.set_viewport_size({'width':width,'height':height});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                box=btn(p,'Kirim pesan').bounding_box();assert box and box['y']+box['height']<=height
                p.screenshot(path=str(E/f'assistant-layout-{width}.png'))
            p.set_viewport_size({'width':390,'height':844});passed('Assistant composer stays reachable across compact, wide and landscape layouts')
            btn(p,'Pemberitahuan').click();tab(p,'Belum dibaca').click()
            btn(p,'Buka pemberitahuan '+unread['title']).click();expect(p.get_by_text(unread['body'],exact=True)).to_be_visible()
            p.screenshot(path=str(E/'notifications-detail.png'));btn(p,'Kembali ke pemberitahuan').click()
            expect(p.get_by_text('Tidak ada pesan baru',exact=True)).to_be_visible();btn(p,'Tutup detail').click();btn(p,'Pemberitahuan').click()
            expect(p.get_by_text('Semua sudah dibaca',exact=True)).to_be_visible();p.screenshot(path=str(E/'notifications-read.png'))
            passed('Unread notification opens stable detail, then disappears from the unread filter and stays read after reopen')
            btn(p,'Pengaturan notifikasi').click();expect(p.get_by_text('Pemberitahuan & privasi',exact=True)).to_be_visible()
            btn(p,'Muat ulang data').click();btn(p,'Pemberitahuan').click();expect(p.get_by_text('Semua sudah dibaca',exact=True)).to_be_visible();btn(p,'Tutup detail').click()
            p.reload(wait_until='networkidle');btn(p,'Pemberitahuan').click();expect(btn(p,'Tandai semua dibaca')).to_be_visible()
            p.screenshot(path=str(E/'notifications-inbox.png'));btn(p,'Tandai semua dibaca').click();expect(p.get_by_text('Semua sudah dibaca',exact=True)).to_be_visible()
            assert api('/overview')['notifications']==notifications
            passed('Read-all and settings navigation work; refresh keeps session markers and cold reload returns unchanged API state')
            p.close();p=browser.new_page(viewport={'width':390,'height':844});p.on('pageerror',lambda e:errors.append(str(e)))
            def empty(route):
                r=route.fetch();data=r.json();data['notifications']=[];route.fulfill(response=r,json=data)
            p.route('**/api/v1/overview',empty);p.goto('http://localhost:8081',wait_until='networkidle');btn(p,'Pemberitahuan').click()
            expect(p.get_by_text('Belum ada pemberitahuan',exact=True)).to_be_visible();expect(btn(p,'Tandai semua dibaca')).to_have_count(0)
            p.screenshot(path=str(E/'notifications-empty.png'));btn(p,'Pengaturan notifikasi').click();expect(p.get_by_text('Pemberitahuan & privasi',exact=True)).to_be_visible()
            passed('Empty notification inbox gives clear guidance and a working settings action');p.close();browser.close()
        assert api('/appointments')==original['appointments'] and not errors,errors;passed('Official appointments remain unchanged and no page errors occur')
    except Exception as e:report['error']=str(e);raise
    finally:
        report.update(passed=len(checks),pageErrors=errors)
        (E/'assistant-notifications-web-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
