import mongoose, { Schema } from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    
    role: { type: String},
    permission: { type: String },
    
});


const RolePermission = mongoose.model('RolePermission', rolePermissionSchema, 'rolePermissions');

export default RolePermission;
