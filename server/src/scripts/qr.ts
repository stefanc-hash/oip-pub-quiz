import qrcode from 'qrcode-terminal';
import { config } from '../config.js';
import { findLanIp } from '../lan.js';

const ip = findLanIp();
if (!ip) {
  console.error('Could not determine LAN IP. Are you connected to a network?');
  process.exit(1);
}

const url = `http://${ip}:${config.port}/`;
console.log('');
console.log(`  Scan to join the quiz: ${url}`);
console.log('');
qrcode.generate(url, { small: true });
console.log('');
console.log('  Admin: ' + url + 'admin');
console.log('  Display: ' + url + 'display');
console.log('');
