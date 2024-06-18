/**
 * Mongo client connsction
 */
import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const DB_PORT = process.env.DB_PORT || '27017';
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
    const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;
    this._client = new MongoClient(DB_URL);
    this.connected = false;
    (async () => {
      try {
        await this._client.connect();
        this.connected = true;
        this._db = this._client.db(DB_DATABASE);
        await this._db.collection('users').createIndex({ email: 1 }, { unique: true });
      } catch (error) {
        console.log(error);
      }
    })();
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers(arg= {}) {
    return this._db.collection('users').countDocuments(arg);
  }

  async nbFiles(arg = {}) {
    return this._db.collection('files').countDocuments(arg);
  }

}

const dbClient = new DBClient();

module.exports = dbClient;
