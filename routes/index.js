import express from 'express';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';


const router = express.Router();

// Server statistics
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

/**
 * Add user
 */
router.post('/users', UsersController.postNew);

/**
 * User Authentication
 */
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

/**
 * file uploading
 */
router.post('/files', FilesController.postUpload);

/**
 * gets show and index
 */
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

router.get('/files/:id/data', FilesController.getFile);

export default router;
