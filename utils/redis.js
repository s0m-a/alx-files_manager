import { promisify } from 'util';
import { createClient } from 'redis';
/**
 * A redis client class
 */
class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = true;
    this.client.on('error', (err) => {
      console.log('Redis connection error:', err.message || err.toString());
      this.connected = false;
    });
  }
  /**
   * checks is the server is connected
   * @returns boolen
   */

  isAlive() {
    return this.connected;
  }
/**
 * Retrives values with a given key
 * @param {*} key, key associated with the variable
 * @returns 
 */
  async get(key) {
    const GET = promisify(this.client.GET);
    return GET.call(this.client, key);
  }
/**
 * sets the key to the varible
 * @param {*} key key associated with the variable
 * @param {*} value value associated with the key
 * @param {*} expires expiration date
 */
  async set(key, value, expires) {
    const SETEX = promisify(this.client.SETEX);
    await SETEX.call(this.client, key, expires, value);
  }

  async del(key) {
    const DEL = promisify(this.client.DEL);
    return DEL.call(this.client, key);
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
