import { readFile } from 'node:fs/promises';
try {
  const s = JSON.parse(await readFile('.runtime/session.json', 'utf8')),
    status = await fetch('http://127.0.0.1:5280/api/status', {
      signal: AbortSignal.timeout(3000),
    }).then((r) => r.json());
  if (status.managerPid !== s.managerPid)
    throw Error('Running launcher does not match this workspace session.');
  const r = await fetch('http://127.0.0.1:5280/api/stop', {
    method: 'POST',
    body: s.token,
  });
  if (!r.ok) throw Error('Session token was rejected.');
  console.log('Stopped this workbench’s eight servers.');
} catch (e) {
  console.error('No matching active workbench was stopped: ' + e.message);
  process.exitCode = 1;
}
