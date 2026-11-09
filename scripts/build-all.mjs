import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { labs } from './labs.mjs';
await mkdir('evidence/builds', { recursive: true });
const cli = resolve('node_modules/vite/bin/vite.js');
const results = await Promise.all(
  labs.map(
    (lab) =>
      new Promise((resolveResult) => {
        let output = '';
        const started = Date.now(),
          child = spawn(process.execPath, [cli, 'build'], {
            cwd: resolve('apps', lab.folder),
            windowsHide: true,
          });
        child.stdout.on('data', (b) => (output += b));
        child.stderr.on('data', (b) => (output += b));
        child.on('error', (e) => (output += e.message));
        child.on('close', async (code) => {
          await writeFile(`evidence/builds/${lab.folder}.log`, output);
          console.log(
            `${lab.folder}: ${code === 0 ? 'PASS' : 'FAIL'} (${((Date.now() - started) / 1000).toFixed(1)}s)`,
          );
          resolveResult({
            lab: lab.folder,
            exitCode: code,
            seconds: (Date.now() - started) / 1000,
          });
        });
      }),
  ),
);
await writeFile('evidence/build-results.json', JSON.stringify(results, null, 2));
if (results.some((r) => r.exitCode !== 0)) process.exitCode = 1;
