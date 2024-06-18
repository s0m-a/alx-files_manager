import { existsSync, readFileSync } from 'fs';

/**
 * Loads environment variables
 */
const eLoader = () => {
  const env = process.env.npm_lifecycle_event || 'dev';
  const path = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  if (existsSync(path)) {
    const data = readFileSync(path, 'utf-8').trim().split('\n');

    for (const line of data) {
      const delim = line.indexOf('=');
      const vars = line.substring(0, delim);
      const val = line.substring(delim + 1);
      process.env[vars] = val;
    }
  }
};

export default eLoader;
