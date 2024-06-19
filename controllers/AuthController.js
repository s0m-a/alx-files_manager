import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';
import { v4 as uuid4 } from 'uuid';
import sha1 from 'sha1';

class AuthController {
    /**
     * Handles user login by validating
     * credentials and issuing an authentication token.
     * @param {*} req - The request object
     * @param {*} res - The response object
     * @returns 
     */
  static async getConnect(req, res) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Basic ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const base64C = header.split(' ')[1];
    const credential = Buffer.from(base64C, 'base64').toString('ascii');

    const [email, password] = credential.split(':');
    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await dbClient.db.collection('users')
      .findOne({ email, password: sha1(password) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = uuid4();
    const authKey = `auth_${token}`;

    await redisClient.set(authKey, user._id.toString(), 24 * 60 * 60);
    res.status(200).json({ token });
  }

  /**
   * Handles user logout by deleting the
   * authentication token from Redis
   * @param {*} req - The request object
   * @param {*} res - The response object
   * @returns 
   */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(key);
    res.status(204).send();
  }
}

export default AuthController;
