import {providers} from './providers.mjs';
import {normalizeEarthquakes,normalizeWorldBank,normalizeForecast,normalizeBooks,normalizeEvents} from '../shared/sources.js';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
const results=await Promise.all(Object.entries(providers).map(async([key,source])=>{
 const started=Date.now();
 try {
  const response=await fetch(source.url,{cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw Error('HTTP '+response.status);
  const text=await response.text(),raw=JSON.parse(text);
  const rows=key==='earthquakes'?normalizeEarthquakes(raw):['growth','population'].includes(key)?normalizeWorldBank(raw):key==='books'?normalizeBooks(raw):key==='events'?normalizeEvents(raw):normalizeForecast(raw,key==='temperature'?'temperature_2m':'precipitation');
  if(!rows.length) throw Error('No usable records');
  return {key,provider:source.name,url:source.url,http:response.status,usableRecords:rows.length,fetchedAt:new Date().toISOString(),milliseconds:Date.now()-started,sha256:createHash('sha256').update(text).digest('hex'),requiresKey:false,paidService:false};
 }catch(error){return {key,url:source.url,error:error.message};}
}));
await mkdir('evidence/v2',{recursive:true});
await writeFile('evidence/v2/live-provider-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),policy:'Fresh upstream requests; metadata only saved; no response cache or fallback.',results},null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.error))process.exitCode=1;
