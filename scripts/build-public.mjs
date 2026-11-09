import {spawnSync} from 'node:child_process';
import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {labs} from './labs.mjs';
import {hubHTML} from './hub.mjs';
process.env.DEPLOY_PUBLIC='1';
for(const script of ['sync-shared.mjs','build-all.mjs']) {
 const result=spawnSync(process.execPath,['scripts/'+script],{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}
await mkdir('public-site/labs',{recursive:true});
for(const lab of labs)await cp(`apps/${lab.folder}/dist`,`public-site/labs/${lab.id}`,{recursive:true});
let hub=hubHTML();
for(const lab of labs)hub=hub.replaceAll(`http://127.0.0.1:${lab.port}`,`/labs/${lab.id}/`).replaceAll(`/labs/${lab.id}//?`,`/labs/${lab.id}/?`);
hub=hub.replace("event.origin!=='http://127.0.0.1:'+(5280+Number(d.lab))","event.origin!==location.origin").replaceAll(/PORT \d+/g,'LIVE LAB');
await writeFile('public-site/index.html',hub);
let guide=await readFile('docs/ASSIGNMENT.html','utf8');
guide=guide.replaceAll('href="http://127.0.0.1:5280"','href="/"');
await writeFile('public-site/assignment.html',guide);
await cp('output/pdf/Unit12_Corrected_Beginner_Guide.pdf','public-site/guide.pdf');
await cp('evidence/verification.json','public-site/verification.json');
console.log('Public gallery and eight labs assembled. Live APIs run as server functions.');
