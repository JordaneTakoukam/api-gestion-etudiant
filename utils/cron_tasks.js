import cron from 'node-cron';
import Setting from '../models/setting.model.js';
import Periode from '../models/periode.model.js';
import { enregistrerAbsencesApresCours } from '../controllers/abscences/absence.controller.js';
import moment from 'moment-timezone';

// Planifier le cron job pour qu'il s'exécute à 18h chaque jour du lundi au vendredi
cron.schedule('0 20 * * 1-5', async () => {
    console.log("Exécution du cron à 20h pour l'enregistrement des absences.");

    try {
        // Récupérer les paramètres
        let settings = await Setting.find().select('niveaux anneeCourante semestreCourant');
        let setting = settings.length > 0 ? settings[0] : null;

        if (!setting) {
            console.error("Paramètres non trouvés : arrêt du cron.");
            return;
        }

        const niveaux = setting.niveaux || [];
        const anneeCourante = setting.anneeCourante || 2023;
        const semestreCourant = setting.semestreCourant || 1;

        if (niveaux.length === 0) {
            console.log("Aucun niveau configuré : arrêt du cron.");
            return;
        }

        // Obtenir le jour actuel selon le fuseau horaire de Douala
        const jourCameroun = moment().tz("Africa/Douala").day();

        // Parcourir tous les niveaux
        for (const niveau of niveaux) {
            // Filtrer les périodes
            const filter = {
                niveau: niveau._id,
                annee: anneeCourante,
                semestre: semestreCourant,
                jour: jourCameroun,
                pause: false,
            };

            const periodes = await Periode.find(filter);

            if (periodes.length === 0) {
                console.log(`Aucune période trouvée pour le niveau ${niveau._id} le jour ${jourCameroun}.`);
                continue;
            }

            // Enregistrer les absences pour toutes les périodes
            await Promise.all(
                periodes.map(async (periode) => {
                    try {
                        await enregistrerAbsencesApresCours(
                            niveau._id,
                            periode.annee,
                            periode.semestre,
                            jourCameroun,
                            periode.heureDebut,
                            periode.heureFin
                        );
                        console.log(`Absences enregistrées pour le niveau ${niveau._id}`);
                    } catch (error) {
                        console.error(`Erreur pour la matière ${periode.matiere} :`, error);
                    }
                })
            );
        }

        console.log("Enregistrement des absences terminé.");
    } catch (error) {
        console.error("Erreur globale lors de l'enregistrement des absences :", error);
    }
});

