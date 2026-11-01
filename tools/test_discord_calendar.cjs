'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {config,validate,ics,boundedResponse,mount} = require('../public/js/discord-calendar.js');
const fixture = require('./calendar/discord-snapshot.fixture.json');
const now = Date.parse(fixture.generated_at);
const settings = {enabled:true,source_url:'https://civ13.com/calendar/v1/snapshot',guild_id:fixture.guild_id};
const copy = () => structuredClone(fixture);

test('inactive config makes no source request; active config is a reviewed fixed HTTPS route', () => {
  const inactive = require('../_data/discord_calendar.json'); config(inactive);
  assert.equal(inactive.enabled, false);
  assert.equal(mount({},inactive,{}), null);
  config(settings);
  for (const url of ['http://civ13.com/calendar/v1/snapshot','https://user@civ13.com/calendar/v1/snapshot','https://evil.example/calendar/v1/snapshot','https://civ13.com/calendar/v1/snapshot?attendees=1','https://civ13.com/calendar/v1/snapshot#private']) assert.throws(()=>config({...settings,source_url:url}));
});
test('producer fixture accepts missing end, rejects leaked fields, stale evidence and malformed intervals', () => {
  assert.equal(validate(fixture,fixture.guild_id,now).events[0].end_at,null);
  const reject = mutate => { const data=copy(); mutate(data); assert.throws(()=>validate(data,fixture.guild_id,now)); };
  reject(data=>{data.events[0].creator_id='private';}); reject(data=>{data.attendees=['private'];});
  reject(data=>{data.guild_id='900000000000000099';}); reject(data=>{data.revision=1.5;});
  reject(data=>{data.expires_at=data.generated_at;}); reject(data=>{data.generated_at='2026-02-30T00:00:00Z';});
  reject(data=>{data.events[0].uid='unstable';}); reject(data=>{data.events[0].end_at=data.events[0].start_at;});
  reject(data=>{data.events[0].url='https://example.com/';}); reject(data=>{data.events.push(data.events[0]);});
  reject(data=>{data.state='stale';}); reject(data=>{data.notes=['invented'];});
  assert.throws(()=>validate(fixture,fixture.guild_id,now+120000));
  assert.throws(()=>validate(fixture,fixture.guild_id,now-10000));
  const recurring=copy(); recurring.events[0].recurrence='discord_only'; assert.throws(()=>validate(recurring,fixture.guild_id,now));
  recurring.state='degraded'; recurring.notes=['recurrence_not_expanded']; validate(recurring,fixture.guild_id,now);
  assert.ok(ics(recurring).replace(/\r\n /g,'').includes('Repeating schedule is not expanded')); assert.ok(!ics(recurring).includes('RRULE:'));
});
test('ICS has stable UID/revisions, omitted unknown DTEND, safe text and explicit withdrawals', () => {
  const calendar=ics(fixture); assert.ok(calendar.includes('UID:'+fixture.events[0].uid)); assert.ok(!calendar.includes('DTEND:'));
  const changed=copy(); changed.events[0].sequence=2; changed.events[0].description='雪'.repeat(70)+'\r\nUID:injected,;\\';
  const bytes=ics(changed); for(const line of bytes.trimEnd().split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
  assert.ok(bytes.includes('SEQUENCE:2')); assert.equal((bytes.match(/\r\nUID:/g)||[]).length,1);
  const withdrawn=copy(); Object.assign(withdrawn.events[0],{status:'withdrawn',title:'Event no longer listed',description:'Details withdrawn; check Discord for current information.',location:'',url:'',sequence:3,start_at:withdrawn.events[0].updated_at});
  validate(withdrawn,fixture.guild_id,now); assert.ok(ics(withdrawn).includes('STATUS:CANCELLED')); assert.ok(!ics(withdrawn).includes('URL:'));
  withdrawn.events[0].description='Old restricted description'; assert.throws(()=>validate(withdrawn,fixture.guild_id,now));
  withdrawn.events[0].description='Details withdrawn; check Discord for current information.'; withdrawn.events[0].start_at=fixture.events[0].start_at; assert.throws(()=>validate(withdrawn,fixture.guild_id,now));
  assert.equal(ics({...fixture,events:[]}),null);
});
test('bounded transport rejects bad MIME, HTTP failure, oversized and invalid UTF-8 snapshots', async () => {
  assert.deepEqual(await boundedResponse(new Response(JSON.stringify(fixture),{headers:{'content-type':'application/json'}})),fixture);
  await assert.rejects(boundedResponse(new Response('{}',{status:503,headers:{'content-type':'application/json'}})));
  await assert.rejects(boundedResponse(new Response('{}',{headers:{'content-type':'text/html'}})));
  await assert.rejects(boundedResponse(new Response(new Uint8Array([255]),{headers:{'content-type':'application/json'}})));
  await assert.rejects(boundedResponse(new Response('x'.repeat(2097153),{headers:{'content-type':'application/json'}})));
});

function harness() {
  const element=()=>({children:[],hidden:false,textContent:'',listeners:{},append(node){this.children.push(node);},replaceChildren(){this.children=[];},removeAttribute(name){delete this[name];},addEventListener(name,fn){this.listeners[name]=fn;},removeEventListener(name){delete this.listeners[name];}});
  const status=element(),list=element(),download=element();
  const root={querySelector:selector=>({'[data-sync-status]':status,'[data-sync-events]':list,'[data-sync-download]':download}[selector])};
  const doc={...element(),hidden:false,createElement:()=>element()}, win=element();
  let wall=now,mono=10,response=copy(),fail=false,requests=0,revoked=0; const timers=new Map();
  const env={document:doc,window:win,now:()=>wall,monotonic:()=>mono,schedule:(fn,delay)=>{const key={};timers.set(key,{fn,delay});return key;},cancel:key=>timers.delete(key),createUrl:()=> 'blob:synthetic',revokeUrl:()=>{revoked++;},fetch:async (url,options)=>{requests++;assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error'); if(fail)throw Error('offline');return new Response(JSON.stringify(response),{headers:{'content-type':'application/json'}});}};
  const controller=mount(root,settings,env);
  return {controller,status,list,download,doc,win,timers,setTime:(w,m)=>{wall=w;mono=m;},setResponse:value=>{response=value;},fail:()=>{fail=true;},counts:()=>({requests,revoked})};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('actual controller renders text safely, expires on sleep and fences stale downloads/revisions', async () => {
  const h=harness(); await settle();
  assert.equal(h.list.children.length,1); assert.equal(h.download.hidden,false);
  assert.ok(h.list.children[0].children.some(node=>node.textContent.includes('<script>ignored</script>')));
  assert.ok(h.list.children[0].children.some(node=>node.textContent.includes('End time not specified')));
  h.setTime(now+120001,11); h.doc.hidden=true; h.doc.listeners.visibilitychange();
  assert.equal(h.list.children.length,0); assert.equal(h.download.hidden,true); assert.equal(h.counts().revoked,1);
  let prevented=false; h.download.listeners.click({preventDefault(){prevented=true;}}); assert.equal(prevented,true);
  h.setTime(now,20); h.doc.hidden=false; h.doc.listeners.visibilitychange(); await settle(); assert.equal(h.list.children.length,1);
  const conflict=copy(); conflict.events[0].title='Same revision changed'; h.setResponse(conflict); await h.controller.refresh();
  assert.equal(h.list.children.length,0); assert.equal(h.download.hidden,true);
  const fresh=copy(); fresh.revision=2; h.setResponse(fresh); await h.controller.refresh(); assert.equal(h.list.children.length,1);
  h.setResponse(copy()); await h.controller.refresh(); assert.equal(h.list.children.length,0);
  h.controller.stop(); assert.equal(h.timers.size,0); assert.deepEqual(h.doc.listeners,{}); assert.deepEqual(h.win.listeners,{});
});
test('failed refresh clears all details and revokes the previous snapshot download', async () => {
  const h=harness(); await settle(); assert.equal(h.list.children.length,1);
  h.fail(); await h.controller.refresh(); assert.equal(h.list.children.length,0); assert.equal(h.download.hidden,true); assert.equal(h.counts().revoked,1);
  h.controller.stop();
});
test('source preserves manual calendar and bakes no Discord event details into HTML', () => {
  const page=fs.readFileSync(path.join(__dirname,'../community-events.html'),'utf8');
  assert.ok(page.includes('{% if site.data.discord_calendar.enabled %}'));
  assert.ok(page.includes('site.data.community_calendar.events'));
  assert.ok(!page.includes('Synthetic community round'));
  assert.equal(require('./calendar/events.json').events.length,0);
});
