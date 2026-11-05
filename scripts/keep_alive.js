// scripts/keep_alive.js - Tiến trình tự giám sát (Watchdog Supervisor)
// Tự động khởi động lại server.js ngay lập tức nếu tiến trình bị dừng hoặc thoát.
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let runningChild = null;
let isShuttingDown = false;

function startServer() {
  if (isShuttingDown) return;

  console.log(`[Watchdog] Khởi chạy server.js tại ${projectRoot}...`);
  runningChild = spawn('node', ['server.js'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  runningChild.on('error', (err) => {
    console.error(`[Watchdog] Lỗi khi chạy server:`, err);
  });

  runningChild.on('exit', (code, signal) => {
    console.warn(`[Watchdog] server.js đã thoát với mã ${code} / tín hiệu ${signal}.`);
    if (!isShuttingDown) {
      console.log(`[Watchdog] Tự động hồi sinh máy chủ sau 1 giây...`);
      setTimeout(startServer, 1000);
    }
  });
}

process.on('SIGINT', () => {
  isShuttingDown = true;
  if (runningChild) runningChild.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  if (runningChild) runningChild.kill('SIGTERM');
  process.exit(0);
});

startServer();
