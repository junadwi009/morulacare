import test from 'node:test';
import assert from 'node:assert/strict';
import { facilities, distanceKm, rankFacilities, validPoint } from '../mobile/src/facility-data.ts';
import { locateOnce } from '../mobile/src/location-request.ts';

test('official directory has unique identities, validated coordinates and source URLs', () => {
  assert.equal(facilities.length, 11);
  assert.equal(new Set(facilities.map(x => x.id)).size, 11);
  assert.ok(facilities.every(x => validPoint(x) && x.sourceUrl.startsWith('https://www.morulaivf.co.id/lokasi-klinik/')));
});
test('distance is symmetric and zero at the same point', () => {
  const a = facilities[0], b = facilities.find(x => x.city === 'Surabaya');
  assert.equal(distanceKm(a,a), 0);
  assert.ok(Math.abs(distanceKm(a,b)-distanceKm(b,a)) < 0.000001);
  assert.ok(distanceKm(a,b) > 600 && distanceKm(a,b) < 750);
});
test('sort nearest known branch first without mutating source', () => {
  const before = JSON.stringify(facilities);
  const origin = facilities.find(x => x.city === 'Surabaya');
  const result = rankFacilities('',origin);
  assert.equal(result[0].id,origin.id);
  assert.equal(result[0].distanceKm,0);
  assert.ok(result.every((x,i) => i===0 || x.distanceKm>=result[i-1].distanceKm));
  assert.equal(JSON.stringify(facilities),before);
});
test('manual city/name/address search works without inventing a location or distance', () => {
  assert.equal(rankFacilities('  sUrABaya  ',null)[0].city,'Surabaya');
  assert.ok(rankFacilities('Cik Ditiro',null).some(x=>x.city==='Jakarta'));
  assert.ok(rankFacilities('BSD',null).some(x=>x.id.includes('international')));
  assert.ok(rankFacilities('',null).every(x=>x.distanceKm===null));
  assert.deepEqual(rankFacilities('not-a-real-clinic',null),[]);
});
test('invalid location never reaches distance sorting', () => {
  for(const point of [{latitude:NaN,longitude:2},{latitude:91,longitude:0},{latitude:0,longitude:181}]) {
    assert.equal(validPoint(point),false);
    assert.ok(rankFacilities('',point).every(x=>x.distanceKm===null));
  }
});
const adapter = (overrides={}) => ({
  servicesEnabled:async()=>true, requestPermission:async()=>({granted:true,canAskAgain:true}),
  currentPosition:async()=>({coords:{latitude:-6.195,longitude:106.833,accuracy:100},timestamp:Date.now()}),...overrides,
});
test('permission denial never requests coordinates',async()=>{
  let called=false;
  const result=await locateOnce(adapter({requestPermission:async()=>({granted:false,canAskAgain:false}),currentPosition:async()=>{called=true;}}));
  assert.equal(result.status,'denied');assert.equal(result.canAskAgain,false);assert.equal(called,false);
});
test('disabled services do not request permission or coordinates',async()=>{
  let called=false;
  const result=await locateOnce(adapter({servicesEnabled:async()=>false,requestPermission:async()=>{called=true;}}));
  assert.equal(result.status,'disabled');assert.equal(called,false);
});
test('valid approximate location remains usable with reported accuracy',async()=>{
  const result=await locateOnce(adapter());assert.equal(result.status,'ready');assert.equal(result.accuracy,100);
});
test('invalid or stale location is rejected',async()=>{
  for(const position of [{coords:{latitude:300,longitude:0},timestamp:Date.now()},{coords:{latitude:0,longitude:0},timestamp:0}]) {
    assert.equal((await locateOnce(adapter({currentPosition:async()=>position}))).status,'unavailable');
  }
});
test('permission timeout prevents a late grant from starting coordinate lookup',async()=>{
  let resolvePermission,called=false;
  const pending=new Promise(resolve=>{resolvePermission=resolve;});
  const result=await locateOnce(adapter({requestPermission:()=>pending,currentPosition:async()=>{called=true;}}),10,undefined,10);
  assert.equal(result.status,'timeout');resolvePermission({granted:true,canAskAgain:true});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(called,false);
});
test('location provider errors produce an actionable unavailable result',async()=>{
  assert.equal((await locateOnce(adapter({currentPosition:async()=>{throw Error('provider failed');}}))).status,'unavailable');
});
test('cancellation prevents a late permission grant from starting coordinate lookup',async()=>{
  const controller=new AbortController();let resolvePermission,called=false;
  const pending=new Promise(resolve=>{resolvePermission=resolve;});
  const task=locateOnce(adapter({requestPermission:()=>pending,currentPosition:async()=>{called=true;}}),1000,controller.signal);
  await new Promise(resolve=>setTimeout(resolve,0));controller.abort();
  assert.equal((await task).status,'cancelled');resolvePermission({granted:true,canAskAgain:true});
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(called,false);
});
test('cancellation during service check prevents a later permission prompt',async()=>{
  const controller=new AbortController();let resolveServices,called=false;
  const task=locateOnce(adapter({servicesEnabled:()=>new Promise(resolve=>{resolveServices=resolve;}),requestPermission:async()=>{called=true;}}),1000,controller.signal);
  controller.abort();assert.equal((await task).status,'cancelled');resolveServices(true);
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(called,false);
});
test('reading the permission dialog does not spend the GPS lookup budget',async()=>{
  const result=await locateOnce(adapter({requestPermission:async()=>{
    await new Promise(resolve=>setTimeout(resolve,30));return {granted:true,canAskAgain:true};
  }}),10,undefined,100);
  assert.equal(result.status,'ready');
});
test('GPS lookup has its own bounded timeout after permission',async()=>{
  const result=await locateOnce(adapter({currentPosition:()=>new Promise(()=>{})}),10,undefined,100);
  assert.equal(result.status,'timeout');
});
