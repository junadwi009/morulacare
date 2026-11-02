"""Owned local synthetic API smoke: reserve, restart, verify persistence, cancel."""
import json,subprocess,time,uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[2]
docker=Path.home()/'AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe'
checks=[];booking=None;error=None
base='http://127.0.0.1:8080/api/v1'
def api(path,body=None,key=None):
    headers={'Authorization':'Bearer demo-patient-token','Content-Type':'application/json'}
    if key:headers['Idempotency-Key']=key
    r=Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method='GET' if body is None else 'POST')
    with urlopen(r,timeout=15) as response:return json.load(response)
def ok(name):checks.append(name);print('PASS '+name,flush=True)
def healthy():
    for _ in range(60):
        try:
            with urlopen('http://127.0.0.1:8080/actuator/health',timeout=2) as response:
                if json.load(response)['status']=='UP':return
        except (URLError,TimeoutError,OSError):pass
        time.sleep(1)
    raise AssertionError('Local API failed to become healthy')
try:
    healthy();original=api('/appointments')
    doctors=api('/doctors');assert len(doctors)==4;ok('Four fictional doctor profiles served by rebuilt local API')
    slots=api('/doctors/doctor-maya/slots');assert len(slots)==12
    selected=next(s for s in slots if s['available']);ok('Twelve synthetic slots with actual availability')
    payload={'doctorId':'doctor-maya','slotId':selected['id'],'reason':'Verifikasi backend sintetis'};key=str(uuid.uuid4())
    booking=api('/doctor-bookings',payload,key);assert booking['status']=='confirmed_demo';ok('Booking is persisted and confirmed only as demo')
    assert api('/doctor-bookings',payload,key)==booking;ok('HTTP duplicate retry returns identical booking')
    try:api('/doctor-bookings',payload,str(uuid.uuid4()))
    except HTTPError as failure:assert failure.code==409 and json.load(failure)['code']=='SLOT_UNAVAILABLE'
    else:raise AssertionError('Occupied slot accepted twice')
    ok('Second key cannot double-book an occupied slot')
    subprocess.run([str(docker),'compose','-p','morula-care-local','restart','api'],cwd=root,check=True,timeout=60)
    healthy();assert api('/doctor-bookings/'+booking['id'])==booking
    assert not next(s for s in api('/doctors/doctor-maya/slots') if s['id']==selected['id'])['available']
    ok('Booking and occupied slot survive actual API container restart')
    cancelled=api('/doctor-bookings/'+booking['id']+'/cancel',{})
    assert cancelled['status']=='cancelled_demo'
    assert api('/doctor-bookings/'+booking['id']+'/cancel',{})==cancelled
    assert next(s for s in api('/doctors/doctor-maya/slots') if s['id']==selected['id'])['available'];ok('Cancellation is repeatable and releases slot')
    assert api('/doctor-bookings',payload,key)==cancelled;ok('Replaying cancelled key does not silently rebook')
    assert api('/appointments')==original;ok('Official appointments remain unchanged')
except Exception as failure:
    error=str(failure);raise
finally:
    if booking:
        try:api('/doctor-bookings/'+booking['id']+'/cancel',{})
        except Exception:pass
    totals={'tests':0,'failures':0,'errors':0,'skipped':0}
    for folder in ['surefire-reports','failsafe-reports']:
        for file in (root/'backend/target'/folder).glob('TEST-*.xml'):
            suite=ET.parse(file).getroot()
            for key in totals:totals[key]+=int(suite.get(key,'0'))
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'scope':'Local demo API/PostgreSQL only; no hospital reservation','java':totals,'httpChecks':checks,'httpPassed':len(checks),'error':error,'syntheticBookingId':booking['id'] if booking else None,'cleanup':'Own synthetic booking cancelled; history retained'}
    (root/'backend/target/doctor-booking-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
