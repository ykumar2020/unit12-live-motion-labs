import { cp, mkdir } from 'node:fs/promises';
import { labs } from './labs.mjs';
for (const lab of labs) {
  await mkdir(`apps/${lab.folder}/src/shared`, { recursive: true });
  await cp('shared', `apps/${lab.folder}/src/shared`, { recursive: true });
}
console.log('Shared classroom modules copied into all eight src/shared folders.');
