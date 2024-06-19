import { redisClient } from '../utils/redis';
import { dbClient } from '../utils/db';

class AppController {
    /**
     *  Retrieves the status of Redis
     * and database clients and returns
     * it as a JSON response
     * @param {*} req - request object
     * @param {*} res - response object
     */
  static async getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  /**
   *  Retrieves statistics about the number
   * of usersand files from the database and
   * returns them as a JSON response
   * @param {*} req - request object
   * @param {*} res - response object
   */
  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    res.status(200).json({
      users: usersCount,
      files: filesCount,
    });
  }
}

export default AppController;
