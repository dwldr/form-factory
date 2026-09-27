import { spawn } from 'node:child_process';
import { createServer, connect } from 'node:net';
import { fileURLToPath } from 'node:url';

// Angular binds only to loopback. Relay HTTP and WebSocket traffic from the
// selected Ethernet address without opening a wildcard or VPN listener.
const ethernetHost = '192.168.1.20';
const port = 4200;
const sockets = new Set();
let child;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  relay.close();
  for (const socket of sockets) socket.destroy();
  child?.kill('SIGTERM');
}

const relay = createServer((client) => {
  const upstream = connect({ host: '127.0.0.1', port });
  for (const socket of [client, upstream]) {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {
      client.destroy();
      upstream.destroy();
    });
  }
  client.pipe(upstream).pipe(client);
});

relay.on('error', (error) => {
  console.error(`Cannot listen on Ethernet ${ethernetHost}:${port}: ${error.message}`);
  console.error('Check that this Ethernet address is assigned to this computer.');
  stop(1);
});

relay.listen(port, ethernetHost, () => {
  console.log(`Ethernet access: http://${ethernetHost}:${port}`);
  const cli = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));
  child = spawn(process.execPath, [cli, 'serve', '--host', '127.0.0.1', '--port', String(port)], {
    stdio: 'inherit',
    cwd: fileURLToPath(new URL('..', import.meta.url)),
  });
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 1));
});

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
