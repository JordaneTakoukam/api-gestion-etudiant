import mongoose, { Schema } from 'mongoose';

const userPermissionSchema = new mongoose.Schema({
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    permission: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' },
    is_granted:{type:Boolean}
});


const UserPermission = mongoose.model('UserPermission', userPermissionSchema, 'userPermissions');

export default UserPermission;
