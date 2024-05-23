import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../../../../models/user.model.js';

export const deletePhotoProfil = async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ success: false, message: { fr: "Identifiant requis", en: "User ID is required" } });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: { fr: "Identifiant invalide", en: "Invalid user ID" } });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: { fr: "L'utilisateur n'existe pas", en: "User does not exist" } });
        }

        if (!user.photo_profil) {
            return res.status(400).json({ success: false, message: { fr: "Aucune photo de profil à supprimer.", en: "No profile photo to delete." } });
        }

        // Récupérer uniquement le nom du fichier à partir du chemin complet
        const fileName = path.basename(user.photo_profil);
        const imagePath = path.join('./public/images/images_profile', fileName);

        fs.unlink(imagePath, async (err) => {
            if (err) {
                console.error("Erreur lors de la suppression de l'image :", err);
                return res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la suppression de l'image.", en: "An error occurred during image deletion." } });
            }

            try {
                await User.findByIdAndUpdate(userId, { $unset: { photo_profil: "" } }, { new: true });
                res.status(200).json({
                    success: true,
                    message: { fr: "L'image a été supprimée avec succès.", en: "Profile photo successfully deleted." }
                });
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
                res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la mise à jour de l'utilisateur.", en: "An error occurred while updating the user." } });
            }
        });
    } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur :", error);
        res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la recherche de l'utilisateur.", en: "An error occurred while fetching the user." } });
    }
};
