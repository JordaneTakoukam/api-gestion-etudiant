import express from 'express';
import {createPermission, updatePermission, deletePermission, getPermissions, getPermissionsWithPagination, createManyPermission} from '../controllers/permissions/permission.controller.js';

const router = express.Router();

// Route pour créer une permission
router.post('/create', createPermission);
router.post('/createManyPermission', createManyPermission);


// Route pour mettre à jour une permission par ID
router.put('/update/:permissionId', updatePermission);

// Route pour supprimer une permission par ID
router.delete('/delete/:permissionId', deletePermission);

// Route pour récupérer la liste des permissions
router.get('/getPermissions', getPermissions);
router.get('/getPermissionsWithPagination', getPermissionsWithPagination);

export default router;
