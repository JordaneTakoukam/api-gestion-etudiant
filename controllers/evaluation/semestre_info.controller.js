/**
 * Contrôleur pour fournir les informations sur les semestres
 * Permet au frontend de connaître les semestres autorisés pour chaque niveau
 */

import Setting from '../../models/setting.model.js';
import { 
    getSemestresAutorises, 
    getTousSemestres,
    validerSemestreNiveauById 
} from '../../utils/semestre_validator.js';
import { message } from '../../configs/message.js';
import mongoose from 'mongoose';

/**
 * Obtenir les semestres autorisés pour un niveau spécifique
 * GET /api/v1/evaluation/semestres/niveau/:niveauId
 */
export const getSemestresByNiveau = async (req, res) => {
    const { niveauId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        // Récupérer le niveau depuis les settings
        const settings = await Setting.findOne().select('niveaux');
        
        if (!settings || !settings.niveaux) {
            return res.status(404).json({
                success: false,
                message: 'Configuration des niveaux non trouvée'
            });
        }

        const niveau = settings.niveaux.find(n => n._id.toString() === niveauId);
        
        if (!niveau) {
            return res.status(404).json({
                success: false,
                message: 'Niveau non trouvé'
            });
        }

        const semestresAutorises = getSemestresAutorises(niveau);

        res.status(200).json({
            success: true,
            data: {
                niveauId: niveau._id,
                niveauCode: niveau.code,
                semestresAutorises,
                description: semestresAutorises.length === 1 
                    ? `Le niveau ${niveau.code} a uniquement le semestre ${semestresAutorises[0]}`
                    : `Le niveau ${niveau.code} a les semestres ${semestresAutorises.join(' et ')}`
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des semestres:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir tous les semestres avec leurs niveaux associés
 * GET /api/v1/evaluation/semestres/all
 */
export const getAllSemestresInfo = async (req, res) => {
    try {
        const settings = await Setting.findOne().select('niveaux');
        
        if (!settings || !settings.niveaux) {
            return res.status(404).json({
                success: false,
                message: 'Configuration des niveaux non trouvée'
            });
        }

        // Construire un mapping semestre -> niveaux
        const semestresInfo = {
            1: { semestre: 1, niveaux: [] },
            2: { semestre: 2, niveaux: [] },
            3: { semestre: 3, niveaux: [] }
        };

        settings.niveaux.forEach(niveau => {
            const semestresAutorises = getSemestresAutorises(niveau);
            
            semestresAutorises.forEach(sem => {
                semestresInfo[sem].niveaux.push({
                    _id: niveau._id,
                    code: niveau.code,
                    libelleFr: niveau.libelleFr,
                    libelleEn: niveau.libelleEn
                });
            });
        });

        res.status(200).json({
            success: true,
            data: {
                semestres: Object.values(semestresInfo),
                configuration: {
                    semestre1: "Niveau 1 (première année)",
                    semestre2: "Niveau 1 (première année)",
                    semestre3: "Niveau 2 (deuxième année)"
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des informations semestres:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Obtenir la configuration complète niveau-semestre
 * GET /api/v1/evaluation/semestres/configuration
 */
export const getConfigurationNiveauSemestre = async (req, res) => {
    try {
        const settings = await Setting.findOne().select('niveaux');
        
        if (!settings || !settings.niveaux) {
            return res.status(404).json({
                success: false,
                message: 'Configuration des niveaux non trouvée'
            });
        }

        const configuration = settings.niveaux.map(niveau => {
            const semestresAutorises = getSemestresAutorises(niveau);
            
            return {
                niveau: {
                    _id: niveau._id,
                    code: niveau.code,
                    libelleFr: niveau.libelleFr,
                    libelleEn: niveau.libelleEn
                },
                semestresAutorises,
                description: semestresAutorises.length === 1 
                    ? `Semestre ${semestresAutorises[0]} uniquement`
                    : `Semestres ${semestresAutorises.join(' et ')}`
            };
        });

        res.status(200).json({
            success: true,
            data: {
                configuration,
                regles: {
                    niveau1: "2 semestres (1 et 2)",
                    niveau2: "1 semestre (3)",
                    niveau3Plus: "À définir selon vos besoins"
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};

/**
 * Valider une combinaison niveau-semestre
 * GET /api/v1/evaluation/semestres/valider/:niveauId/:semestre
 */
export const validerCombinaisonNiveauSemestre = async (req, res) => {
    const { niveauId, semestre } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(niveauId)) {
            return res.status(400).json({
                success: false,
                message: message.identifiant_invalide
            });
        }

        const semestreNum = parseInt(semestre);
        
        if (isNaN(semestreNum) || ![1, 2, 3].includes(semestreNum)) {
            return res.status(400).json({
                success: false,
                message: 'Le semestre doit être 1, 2 ou 3'
            });
        }

        const validation = await validerSemestreNiveauById(niveauId, semestreNum);

        res.status(200).json({
            success: true,
            data: {
                valide: validation.valide,
                niveau: {
                    _id: validation.niveau._id,
                    code: validation.niveau.code
                },
                semestreDemande: semestreNum,
                semestresAutorises: validation.semestresAutorises,
                message: validation.valide 
                    ? `Combinaison valide : ${validation.niveau.code} - Semestre ${semestreNum}`
                    : `Combinaison invalide : Le niveau ${validation.niveau.code} n'a pas de semestre ${semestreNum}`
            }
        });
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
        res.status(500).json({
            success: false,
            message: message.erreurServeur
        });
    }
};