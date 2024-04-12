import User from '../../models/user.model.js';
import { message } from '../../configs/message.js';

// Mettre à jour un utilisateur existant
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUserData = req.body;

        const user = await User.findByIdAndUpdate(id, updatedUserData, { new: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: message.userNotFound,
            });
        }

        const userData = user.toObject();
        delete userData.mot_de_passe;
        res.json({
            success: true,
            message: message.userUpdated,
            data: userData,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
        res.status(500).json({
            success: false,
            message: message.serverError,
        });
    }
};

// Supprimer un utilisateur
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: message.userNotFound,
            });
        }

        res.json({
            success: true,
            message: message.userDeleted,
        });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur :", error);
        res.status(500).json({
            success: false,
            message: message.serverError,
        });
    }
};
