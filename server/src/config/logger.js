const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const levelOrder = ['error', 'warn', 'info', 'debug'];
const currentLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

function pad(n) {
  return String(n).padStart(2, '0');
}

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatArgs(args) {
  return args.map(a =>
    a instanceof Error ? a.stack || a.message
    : typeof a === 'object' ? JSON.stringify(a, null, 2)
    : String(a)
  ).join(' ');
}

const logger = {
  error(...args) {
    if (currentLevel >= levels.error) console.error(`\x1b[31m${timestamp()} [ERROR]\x1b[0m: ${formatArgs(args)}`);
  },
  warn(...args) {
    if (currentLevel >= levels.warn) console.warn(`\x1b[33m${timestamp()} [WARN]\x1b[0m: ${formatArgs(args)}`);
  },
  info(...args) {
    if (currentLevel >= levels.info) console.log(`\x1b[36m${timestamp()} [INFO]\x1b[0m: ${formatArgs(args)}`);
  },
  debug(...args) {
    if (currentLevel >= levels.debug) console.log(`\x1b[90m${timestamp()} [DEBUG]\x1b[0m: ${formatArgs(args)}`);
  },
};

export default logger;
