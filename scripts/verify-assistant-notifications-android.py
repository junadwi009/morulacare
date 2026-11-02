"""Standalone assistant keyboard and notification journeys on the owned AVD."""
import importlib.util,json,re
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/evidence'
spec=importlib.util.spec_from_file_location('assistant_native_helpers',ROOT/'scripts/android-smoke.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
h.STANDALONE=True;h.PACKAGE='com.example.morulacare.concept';h.PREFIX='assistant-notifications-native-'
checks=[]
def passed(name):checks.append(name);print('PASS '+name,flush=True)
def main():
    assert 'MorulaCare_Google_API_35' in [s.strip() for s in h.adb('emu','avd','name').splitlines()]
    original=h.api('/overview');unread=next(n for n in original['notifications'] if not n['read'])
    source=h.api('/chat',{'message':'Jadwal saya berikutnya'},'POST')['sourceLabel']
    font=h.adb('shell','settings','get','system','font_scale').strip();stylus=h.adb('shell','settings','get','secure','stylus_handwriting_enabled').strip()
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'checks':checks,'error':None,'scope':'Owned Android35 Google AVD, standalone API; session-only read markers, no push or hospital messages'}
    try:
        h.adb('shell','settings','put','secure','stylus_handwriting_enabled','0')
        h.open_app();h.visible('Halo, Nadia (demo).');h.tap('Buka asisten');h.capture('welcome')
        h.tap('Pesan untuk asisten');h.adb('shell','input','text','Jadwal%ssaya%sberikutnya')
        h.capture('keyboard');ime=h.keyboard_top();assert 0<ime<2340;bounds=h.tap('Kirim pesan',max_y=ime,capture_before='keyboard-send');assert bounds[3]<=ime
        h.adb('shell','input','keyevent','KEYCODE_BACK');h.tap('Buka asisten');h.visible('Pada snapshot demo, janji Anda:',contains=True,scroll=True)
        passed('Native assistant composer sends to actual API above the open Android keyboard')
        h.tap('Sumber jawaban 1',scroll=True);h.visible(source,scroll=True);h.capture('source')
        h.tap('Pesan untuk asisten');h.adb('shell','input','text','Draf%ssesi');h.adb('shell','input','keyevent','KEYCODE_BACK')
        h.tap('Profil');h.tap('Buka asisten');tree=h.hierarchy();node=h.find(tree,'Pesan untuk asisten');assert 'Draf sesi' in node.get('text','')
        passed('Native source disclosure and unsent draft survive peer-tab navigation')
        h.tap('Pesan untuk asisten');h.adb('shell','input','text','%sBerapa%sdosis%sobat%ssaya?');h.adb('shell','input','keyevent','KEYCODE_BACK');h.tap('Kirim pesan')
        h.visible('Bantuan tim klinik',scroll=True);h.tap('Bantuan tim klinik',scroll=True);h.visible('Catatan permintaan',scroll=True);h.capture('handoff');h.tap('Tutup detail')
        passed('Clinical handoff opens the real demo help form without sending a hospital message')
        h.tap('Pemberitahuan');h.tap('Belum dibaca');h.tap('Buka pemberitahuan '+unread['title'],scroll=True);h.visible(unread['body'],scroll=True);h.capture('notification-detail')
        h.tap('Kembali ke pemberitahuan');h.visible('Tidak ada pesan baru',scroll=True);h.tap('Tutup detail');h.tap('Pemberitahuan');h.visible('Semua sudah dibaca',scroll=True)
        h.tap('Pengaturan notifikasi',scroll=True);h.visible('Pemberitahuan & privasi',scroll=True)
        passed('Unread notification stays open when read, persists in session and links to Profile settings')
        for scale,tag in [('1.3','font130'),('2.0','font200')]:
            h.adb('shell','settings','put','system','font_scale',scale);h.open_app();h.visible('Halo, Nadia (demo).');h.tap('Buka asisten');h.capture(tag+'-welcome')
            h.tap('Jadwal saya berikutnya',scroll=True);h.visible('Pada snapshot demo, janji Anda:',contains=True,scroll=True);h.tap('Sumber jawaban 1',scroll=True);h.visible(source,scroll=True);h.capture(tag+'-reply')
            h.tap('Pemberitahuan');h.tap('Belum dibaca');h.tap('Buka pemberitahuan '+unread['title'],scroll=True);h.visible(unread['body'],scroll=True);h.capture(tag+'-notification')
            h.tap('Kembali ke pemberitahuan');h.visible('Tidak ada pesan baru',scroll=True);h.tap('Tutup detail')
            passed('Assistant reply/source and unread notification/detail navigation at font '+scale)
        current=h.api('/overview');assert current['appointments']==original['appointments'] and current['notifications']==original['notifications']
        passed('Native chat/read markers leave official appointments and API notifications unchanged')
    except Exception as e:
        report['error']=str(e)
        try:h.capture('failure')
        except Exception:pass
        raise
    finally:
        h.adb('shell','settings','put','system','font_scale',font if font!='null' else '1.0')
        if stylus=='null':h.adb('shell','settings','delete','secure','stylus_handwriting_enabled')
        else:h.adb('shell','settings','put','secure','stylus_handwriting_enabled',stylus)
        report.update(passed=len(checks),fontScaleRestored=font,stylusHandwritingSettingRestored=stylus)
        (E/'assistant-notifications-native-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
