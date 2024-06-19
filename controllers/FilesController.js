import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';
import mime from 'mime-types';
import Bull from 'bull';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid4 } from 'uuid';
import { env } from 'process';
import { ObjectId } from 'mongodb';

const folder = env.FOLDER_PATH || '/tmp/files_manager/';
const vTypes = ['folder', 'file', 'image'];

const fileQ = new Bull('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
    /**
     * Handles file upload
     * @param {*} req  - The request object
     * @param {*} res  - The response object
     * @returns 
     */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type && !vTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== vTypes[0] && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parent = await dbClient.db.collection('files')
        .findOne({ _id: new ObjectId(parentId) });

      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parent.type !== vTypes[0]) {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

     // Create a file document
    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };

    if (type === vTypes[0]) {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json({ id: result.insertedId, ...fileDocument });
    }

    await fs.mkdir(folder, { recursive: true });

    const filePath = path.join(folder, uuid4());
    const buffer = Buffer.from(data, 'base64');
    await fs.writeFile(filePath, buffer);

    fileDocument.localPath = filePath;

    const result = await dbClient.db.collection('files').insertOne(fileDocument);

    const fileId = result.insertedId;
    if (type === vTypes[2]) {
      await fileQ.add({
        userId: new ObjectId(userId).toString(),
        fileId: fileId.toString(),
      });
    }

    return res.status(201).json({ id: fileId, ...fileDocument });
  }


  /**
   * Retrieves a specific file's metadata.
   * @param {*} req - The request object.
   * @param {*} res - The response object.
   */
  static async getShow(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }


  /**
   * Retrieves a list of files.
   * @param {*} req - The request object.
   * @param {*} res - The response object.
   */
  static async getIndex(req, res) {
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

    const user = await dbClient.db.collection('users')
      .findOne({ _id: new ObjectId(userId) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { parentId = 0, page = 0 } = req.query;
    const limit = 20;
    const skip = page * limit;

    const matchQuery = {
      userId: user._id,
      parentId: parentId !== 0 ? new ObjectId(parentId) : 0,
    };

    const files = await dbClient.db.collection('files')
      .aggregate(
        {
          $match: matchQuery,
        },
        { $skip: skip },
        { $limit: limit },
      ).toArray();

    res.status(200).json(files);
  }

  /**
   * Publishes a file by making it public.
   * @param {*} req - The request object.
   * @param {*} res - The response object.
   */
  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic: true } },
    );

    const updatedFile = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId) });

    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic: false } },
    );

    const updatedFile = await dbClient.db.collection('files')
      .findOne({ _id: new ObjectId(fileId) });

    return res.status(200).json(updatedFile);
  }


  /**
   *Gets  files.
   * @param {*} req - The request object.
   * @param {*} res - The response object.
   */
  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;
    const { size } = parseInt(req.query, 10);

    try {
      const file = await dbClient.db.collection('files')
        .findOne({ _id: new ObjectId(fileId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (!file.isPublic) {
        if (!token) {
          return res.status(404).json({ error: 'Not found' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId || file.userId.toString() !== userId.toString()) {
          return res.status(404).json({ error: 'Not found' });
        }
      }

      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      if (!file.localPath) {
        return res.status(404).json({ error: 'Not found' });
      }

      let filePath = file.localPath;

      if (size === 500 || size === 250 || size === 100) {
        filePath = `${file.localPath}_${size}`;
      }

      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ error: 'Not found' });
      }

      const dat = await fs.readFile(file.localPath);

      const mimeType = mime.contentType(file.name);
      res.setHeader('Content-Type', mimeType);

      return res.status(200).send(dat);
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
