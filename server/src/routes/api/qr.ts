import type { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { config } from '../../config.js';
import { findLanIp } from '../../lan.js';
import type { AuthService } from '../../services/AuthService.js';
import { makeAuthGuard } from '../../middleware/requireAdminAuth.js';

export async function qrRoutes(app: FastifyInstance, deps: { auth: AuthService }) {
  const guard = makeAuthGuard(deps.auth);
  app.addHook('preHandler', guard);

  app.get('/api/admin/qr', async () => {
    const { url, host, port } = resolvePublicUrl();
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: { dark: '#0b1020', light: '#ffffff' },
      width: 320,
    });
    return { url, host, port, svg };
  });
}

function resolvePublicUrl(): { url: string; host: string; port: number } {
  if (config.publicUrl) {
    try {
      // Auto-prepend https:// if no protocol is present (common Railway misconfiguration)
      let raw = config.publicUrl;
      if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
      const normalized = raw.endsWith('/') ? raw : raw + '/';
      const u = new URL(normalized);
      const port = u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
      return { url: normalized, host: u.host, port };
    } catch {
      // Malformed PUBLIC_URL — fall through to LAN IP detection
    }
  }
  const ip = findLanIp() ?? 'localhost';
  return {
    url: `http://${ip}:${config.port}/`,
    host: ip,
    port: config.port,
  };
}
