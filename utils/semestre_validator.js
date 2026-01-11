/**
 * Utilitaire pour valider la logique Niveau-Semestre
 * 
 * Règles métier :
 * - Niveau 1 : Semestres 1 et 2
 * - Niveau 2 : Semestre 3 uniquement
 * - Niveau 3+ : À définir selon vos besoins
 */

import Setting from '../models/setting.model.js';

/**
 * Configuration des semestres par niveau
 * Cette configuration peut être étendue selon vos besoins
 */
const SEMESTRE_CONFIG = {
    // Par défaut, on utilise le code du niveau pour déterminer les semestres autorisés
    // Niveau 1 (L1, M1, etc.) : semestres 1 et 2
    // Niveau 2 (L2, M2, etc.) : semestre 3
    // Vous pouvez personnaliser cette logique
};

/**
 * Détermine les semestres autorisés pour un niveau donné
 * 
 * @param {Object} niveau - L'objet niveau (doit contenir un code)
 * @returns {Array} - Liste des semestres autorisés [1, 2] ou [3]
 */
export const getSemestresAutorises = (niveau) => {
    if (!niveau || !niveau.code) {
        throw new Error('Niveau invalide');
    }

    // Extraire le numéro du niveau depuis le code (ex: "L1" -> 1, "L2" -> 2)
    const niveauCode = niveau.code.toString();
    const niveauNumero = parseInt(niveauCode.replace(/\D/g, '')) || 1;

    // Logique métier :
    // Niveau 1 (première année) : semestres 1 et 2
    // Niveau 2 (deuxième année) : semestre 3 uniquement
    // Niveau 3+ : semestres 1 et 2 (à adapter selon vos besoins)
    
    if (niveauNumero === 1) {
        return [1, 2];
    } else if (niveauNumero === 2) {
        return [3];
    } else {
        // Pour les niveaux 3+, vous pouvez définir votre logique
        // Par défaut, on retourne semestres 1 et 2
        return [1, 2];
    }
};

/**
 * Valide qu'un semestre est autorisé pour un niveau donné
 * 
 * @param {Number} semestre - Le numéro du semestre (1, 2 ou 3)
 * @param {Object} niveau - L'objet niveau
 * @returns {Boolean} - true si le semestre est autorisé
 */
export const validerSemestreNiveau = (semestre, niveau) => {
    const semestresAutorises = getSemestresAutorises(niveau);
    return semestresAutorises.includes(semestre);
};

/**
 * Récupère un niveau depuis la base de données et valide le semestre
 * 
 * @param {String} niveauId - ID du niveau
 * @param {Number} semestre - Numéro du semestre
 * @returns {Object} - { valide: Boolean, semestresAutorises: Array, niveau: Object }
 */
export const validerSemestreNiveauById = async (niveauId, semestre) => {
    try {
        // Récupérer le niveau depuis les settings
        const settings = await Setting.findOne().select('niveaux');
        
        if (!settings || !settings.niveaux) {
            throw new Error('Configuration des niveaux non trouvée');
        }

        const niveau = settings.niveaux.find(n => n._id.toString() === niveauId.toString());
        
        if (!niveau) {
            throw new Error('Niveau non trouvé');
        }

        const semestresAutorises = getSemestresAutorises(niveau);
        const valide = semestresAutorises.includes(semestre);

        return {
            valide,
            semestresAutorises,
            niveau
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Génère un message d'erreur explicite pour un semestre invalide
 * 
 * @param {Object} niveau - L'objet niveau
 * @param {Number} semestre - Le semestre demandé
 * @returns {String} - Message d'erreur
 */
export const getMessageErreurSemestre = (niveau, semestre) => {
    const semestresAutorises = getSemestresAutorises(niveau);
    
    if (semestresAutorises.length === 1) {
        return `Le niveau ${niveau.code} n'a que le semestre ${semestresAutorises[0]}`;
    } else {
        return `Le niveau ${niveau.code} a les semestres ${semestresAutorises.join(' et ')} uniquement. Le semestre ${semestre} n'est pas autorisé.`;
    }
};

/**
 * Récupère tous les semestres disponibles dans le système
 * 
 * @returns {Array} - [1, 2, 3]
 */
export const getTousSemestres = () => {
    return [1, 2, 3];
};

/**
 * Vérifie si un semestre existe dans le système
 * 
 * @param {Number} semestre - Numéro du semestre
 * @returns {Boolean}
 */
export const semestreExiste = (semestre) => {
    return getTousSemestres().includes(semestre);
};

/**
 * Middleware Express pour valider niveau-semestre
 * Utilisation : router.post("/create", validateNiveauSemestre, createEvaluation)
 */
export const validateNiveauSemestreMiddleware = async (req, res, next) => {
    try {
        const { niveau, semestre } = req.body;

        if (!niveau || !semestre) {
            return res.status(400).json({
                success: false,
                message: 'Niveau et semestre sont requis'
            });
        }

        const validation = await validerSemestreNiveauById(niveau, semestre);

        if (!validation.valide) {
            return res.status(400).json({
                success: false,
                message: getMessageErreurSemestre(validation.niveau, semestre),
                data: {
                    semestresAutorises: validation.semestresAutorises,
                    semestreDemande: semestre
                }
            });
        }

        // Ajouter les infos de validation au req pour utilisation ultérieure
        req.niveauValidation = validation;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    getSemestresAutorises,
    validerSemestreNiveau,
    validerSemestreNiveauById,
    getMessageErreurSemestre,
    getTousSemestres,
    semestreExiste,
    validateNiveauSemestreMiddleware
};