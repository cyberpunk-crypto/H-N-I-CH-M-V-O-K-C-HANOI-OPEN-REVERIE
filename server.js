// server.js - Máy chủ HTTP tĩnh siêu nhẹ, zero-dependency chạy bằng Node.js
// Được gia cố phòng vệ tối đa: Chống crash khi hủy kết nối (Premature Close), tự phục hồi lỗi 100%
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Phòng vệ toàn cục: Không bao giờ để tiến trình bị sập do lỗi ngoài ý muốn
process.on('uncaughtException', (err) => {
  console.error('[Server Watchdog] Đã chặn Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Watchdog] Đã chặn Unhandled Rejection:', reason);
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Phòng vệ socket lỗi hoặc hủy ngang từ client (chống crash khi tắt tab/refresh)
  req.on('error', (err) => {
    // Client disconnect - ignore safely
  });
  res.on('error', (err) => {
    // Client disconnect - ignore safely
  });

  let rawUrl = req.url || '/';
  let reqPath = '/index.html';
  try {
    reqPath = decodeURI(rawUrl.split('?')[0]);
  } catch (e) {
    reqPath = rawUrl.split('?')[0];
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(__dirname, reqPath));

  // An toàn: Chống Path Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  if (reqPath === '/favicon.ico') {
    // Trả về SVG icon hoài niệm cho favicon, triệt tiêu 100% lỗi 404
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1c1714"/><circle cx="16" cy="16" r="10" fill="none" stroke="#d4af37" stroke-width="2.5"/><circle cx="16" cy="16" r="4" fill="#d4af37"/></svg>`;
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
    res.end(svgIcon);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    // Phòng vệ: Nếu người dùng trên điện thoại / máy tính chuyển tab hoặc hủy tải giữa chừng
    stream.on('error', () => {
      stream.destroy();
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Error] Cổng ${PORT} đang bị chiếm dụng. Vui lòng giải phóng cổng.`);
  } else {
    console.error(`[Server Error]:`, err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)`);
  console.log(` Server đang chạy ổn định 24/7 tại:`);
  console.log(` -> Local:   http://localhost:${PORT}`);
  console.log(` -> Mạng LAN: http://192.168.0.105:${PORT}`);
  console.log(`=======================================================`);
});
