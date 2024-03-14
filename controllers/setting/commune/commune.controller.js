import Setting from './../../../models/setting.model.js';
import { message } from '../../../configs/message.js';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';

// create
export const createCommune = async (req, res) => {
    const { code, libelle } = req.body;

    try {
        // Vérifier si la commune existe déjà
        const existingCommune = await Setting.findOne({
            'communes.code': code,
            'communes.libelle': libelle,
        });

        if (existingCommune) {
            return res.status(400).json({
                success: false,
                message: message.existe_deja,
            });
        }

        const date_creation = DateTime.now().toJSDate();

        // Créer une nouvelle commune
        const newCommune = { code, libelle, date_creation };

        // Vérifier si la collection "Setting" existe
        const setting = await Setting.findOne();

        var data = null;
        if (!setting) {
            // Créer la collection et le document
            data = await Setting.create({ communes: [newCommune] });
        } else {
            // Mettre à jour le document existant
            data = await Setting.findOneAndUpdate({}, { $push: { communes: newCommune } }, { new: true });
        }

        // Récupérer le dernier élément du tableau des communes
        const newCommuneObject = data.communes[data.communes.length - 1];

        res.json({
            success: true,
            message: message.ajouter_avec_success,
            data: newCommuneObject, // Retourner seulement l'objet de la commune créée
        });

    } catch (error) {
        console.error("Erreur interne au serveur :", error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur,
        });
    }
};


// read
export const readCommune = async (req, res) => { }


export const readCommunes = async (req, res) => { }


// update
export const updateCommune = async (req, res) => { }


// delete
export const deleteCommune = async (req, res) => { }


