import express from 'express';
import {
    setCoefficientDiscipline,
    getCoefficientDiscipline,
    getCoefficientsDisciplineByNiveau,
    deleteCoefficientDiscipline,
    copierCoefficientsDiscipline,
    getLatestCoefficientDiscipline
} from '../controllers/evaluation/coefficient_discipline.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/coefficient-discipline/set
 * @desc    Créer ou mettre à jour un coefficient de discipline
 * @access  Admin
 */
router.post('/set', setCoefficientDiscipline);

/**
 * @route   GET /api/v1/coefficient-discipline/:niveauId
 * @desc    Obtenir le coefficient de discipline pour un niveau/année/semestre
 * @access  Admin, Enseignant
 */
router.get('/:niveauId', getCoefficientDiscipline);

/**
 * @route   GET /api/v1/coefficient-discipline/niveau/:niveauId
 * @desc    Obtenir tous les coefficients de discipline d'un niveau
 * @access  Admin
 */
router.get('/niveau/:niveauId', getCoefficientsDisciplineByNiveau);

/**
 * @route   GET /api/v1/coefficient-discipline/latest/:niveauId
 * @desc    Obtenir le coefficient de discipline le plus récent pour un niveau
 * @access  Admin, Enseignant
 */
router.get('/latest/:niveauId', getLatestCoefficientDiscipline);

/**
 * @route   DELETE /api/v1/coefficient-discipline/:coefficientId
 * @desc    Supprimer un coefficient de discipline
 * @access  Admin
 */
router.delete('/:coefficientId', deleteCoefficientDiscipline);

/**
 * @route   POST /api/v1/coefficient-discipline/copier
 * @desc    Copier un coefficient de discipline d'une période vers une autre
 * @access  Admin
 */
router.post('/copier', copierCoefficientsDiscipline);

export default router;