import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import User from '../../../../models/user.model.js';

export const ajouterEtModifierImageProfil = async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(404).json({ success: false, message: { fr: "Identifiant requis", en: "User ID is required" } });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: { fr: "Identifiant invalide", en: "Invalid user ID" } });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: { fr: "L'utilisateur n'existe pas", en: "User does not exist" } });
    }

    const dateCreation = DateTime.fromMillis(Date.now());

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/images/images_profile/');
        },
        filename: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            const timestamp = dateCreation.toFormat('X');
            const fileName = `${timestamp}${extension}`;
            cb(null, fileName);
        }
    });

    const upload = multer({ storage }).single('image_profil');

    upload(req, res, async (err) => {
        if (err) {
            console.error("Erreur lors du téléchargement de l'image :", err);
            return res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors du téléchargement de l'image.", en: "An error occurred during image upload." } });
        }

        if (!req.file || !req.file.filename) {
            return res.status(400).json({ success: false, message: { fr: "L'image n'a pas été ajoutée.", en: "Image was not added." } });
        }

        const image_profil_url = `/private/images_profile/${req.file.filename}`;

        // update
        if (user.photo_profil) {
            const fileName = path.basename(user.photo_profil);
            const imagePath = path.join('./public/images/images_profile', fileName);

            fs.unlink(imagePath, async (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image :", err);
                    return res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la suppression de l'image.", en: "An error occurred during image deletion." } });
                }

                try {
                    await User.findByIdAndUpdate(userId, { photo_profil: image_profil_url }, { new: true });
                    res.status(200).json({
                        success: true,
                        data: image_profil_url,
                        message: { fr: "L'image a été modifiée avec succès.", en: "Image has been successfully updated." }
                    });
                } catch (error) {
                    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
                    res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la mise à jour de l'utilisateur.", en: "An error occurred while updating the user." } });
                }
            });
        }
        // ajout
        else {
            try {
                await User.findByIdAndUpdate(userId, { photo_profil: image_profil_url }, { new: true });
                res.status(200).json({
                    success: true,
                    data: image_profil_url,
                    message: { fr: "L'image a été ajoutée avec succès.", en: "Image has been successfully added." }
                });
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
                res.status(500).json({ success: false, message: { fr: "Une erreur s'est produite lors de la mise à jour de l'utilisateur.", en: "An error occurred while updating the user." } });
            }
        }
    });
};
