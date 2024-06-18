import { createClient } from "redis"
import {promisify} from 'util'

/**
 * Represent a client
 */
class RedisClient
{
    /**
     * Creates a client instance.
     */
    constructor()
    {
        this.isConnected = true;
        this.client = createClient()
        this.client.on("error",(err)=>{
            console.log(`error found`, err);
            this.isConnected = false;
        });
        this.client.on("connect", ()=>{
            this.isConnected = true
        })
    }
    /**
     * a function that checks if the client is connected
     * @returns boolean
     */
    isAlive(){
        return this.isConnected;
    }

    /**
     * Gets the value of a given key
     * @param {*} key The key for the value we want to get
     * @returns a bstring
     */

    async get(key){
        return promisify(this.client.GET).bind(this.client)(key);
    }

    /**
     * Stores a key to the value
     * @param {*} key the key of the value
     * @param {*} value the value being stored
     * @param {*} duration the time before it exprires
     */
    async set(key, value, duration)
    {
        await promisify(this.client.SETEX)
        .bind(this.client)(key, value, duration )
    }

    /**
     * Deletes value associated with the key
     * @param {*} key The key of the value
     * @returns promise(void)
     */
    async del(key)
    {
        await promisify(this.client.DEL).bind(this.client)(key);
    }
}

export const redisClient  = new RedisClient;
export default redisClient;
