import { promisify } from 'util';
import { createClient } from 'redis';

/**
 * Representation of a Redis client.
 */
class RedisClient {
  /**
   * Creates RedisClient instance
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if client's connection to the Redis server
   * @returns {boolean}
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the value of a given key.
   * @param {String} key The key of the item to retrieve.
   * @returns promise
   */
  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  /**
   * Saves a key and its value with an expiration time.
   * @param {String} key of the item to save.
   * @param {String | Number | Boolean} value item to store
   * @param {Number} duration  expiration time of the item
   * @returns null
   */
  async set(key, value, duration) {
    await promisify(this.client.SETEX)
      .bind(this.client)(key, duration, value);
  }

  /**
   * Deletes the value of a given key
   * @param {String} key of the item to delete
   * @returns null}
   */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
