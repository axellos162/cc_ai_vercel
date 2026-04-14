import pc from 'picocolors';

function formatTimestamp() {
  return new Date().toISOString();
}

export const logger = {
  info(msg) {
    console.log(pc.green(`[${formatTimestamp()}]`), msg);
  },
  warn(msg) {
    console.log(pc.yellow(`[${formatTimestamp()}]`), msg);
  },
  error(msg) {
    console.log(pc.red(`[${formatTimestamp()}]`), msg);
  }
};
