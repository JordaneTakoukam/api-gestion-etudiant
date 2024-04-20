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


export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Vérifier si l'ID de l'utilisateur est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide,
            });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: message.userNotFound,
            });
        }

        // Supprimer chaque absence liée à l'utilisateur
        for (const absenceId of user.absences) {
            await Absence.findByIdAndDelete(absenceId);
        }

        // Supprimer l'utilisateur par son ID
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: message.userDeleted,
        });
    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
}

