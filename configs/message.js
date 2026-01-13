const message = {
    erreurServeur: {
        fr: "Erreur interne du serveur !",
        en: "Internal server error!"
    },

    role_non_autorise:{
        fr:"Rôle utilisateur non autorisé.",
        en:"Unauthorised user role.",
    },
    
    emailExiste: {
       fr: "Cette adresse e-mail est déjà enregistrée !",
       en: "This email address is already registered!"
    },

    emailRequis: {
        fr: "L'adresse e-mail est requise",
        en: "Email is required"
    },

    superAdminCreerAvecSuccess: {
        fr: "Super Administrateur créé avec succès !",
        en: "Super Administrator created successfully!"
    },

    superAdminDejaExistant: {
        fr: "Un compte super-admin existe déjà !",
        en: "A super-admin account already exists!"
    },

    inscriptReuissie: {
        fr: "Inscription effectuée avec succès !",
        en: "Registration successful!"
    },

    connexionReussie: {
        fr: "Connexion effectuée avec succès !",
        en: "Login successful!"
    },
    creation_reuissi: {
        fr: "Utilisateur créé avec succès",
        en: "User created successfully"
    },
    userNonTrouver: {
        fr: "Utilisateur non trouvé !",
        en: "User not found!"
    },
    motDePasseIncorrect: {
        fr: "Mot de passe incorrect !",
        en: "Incorrect password!"
    },
    success_changer_mdp: {
        fr: "Mot de passe modifié avec succès !",
        en: "Password changed successfully!"
    },
    section_manquante: {
        fr: "La section est manquante!",
        en: "Section is missing!"
    },
    departement_academique_manquante: {
        fr: "Le département académique est manquante!",
        en: "Academic department is missing!"
    },
    cycle_manquant: {
        fr: "Le cycle est manquant!",
        en: "Cycle is missing!"
    },

    niveau_manquant: {
        fr: "Le niveau est manquant!",
        en: "Level is missing!"
    },

    niveau_non_trouve: {
        fr: "Le niveau non trouvé!",
        en: "Level not found!"
    },
    section_invalide: {
        fr: "La section est invalide!",
        en: "Section is invalid!"
    },
    departement_academique_invalide: {
        fr: "Le département académique est invalide!",
        en: "Academic department is invalid!"
    },
    cycle_invalide: {
        fr: "Le cycle est invalide!",
        en: "Cycle is invalid!"
    },
    niveau_invalide: {
        fr: "Le niveau est invalide!",
        en: "Level is invalid!"
    },
    absence_invalide: {
        fr: "L'absence est invalide!",
        en: "Absence is invalid!"
    },
    grade_invalide: {
        fr: "Le grade est invalide!",
        en: "Grade is invalid!"
    },
    categorie_invalide: {
        fr: "La catégorie est invalide!",
        en: "Category is invalid!"
    },
    fonction_invalide: {
        fr: "La fonction est invalide!",
        en: "Function is invalid!"
    },
    service_invalide: {
        fr: "Le service est invalide!",
        en: "Service is invalid!"
    },

    specialite_invalide: {
        fr: "La specialite est invalide!",
        en: "Specialite is invalid!"
    },
    region_invalide: {
        fr: "La région est invalide!",
        en: "Region is invalid!"
    },
    departement_invalide: {
        fr: "Le département est invalide!",
        en: "Department is invalid!"
    },
    commune_invalide: {
        fr: "La commune est invalide!",
        en: "Commune is invalid!"
    },
    tokenAccesNonAutoriser: {
        fr: "Accès non autorisé. Token manquant !",
        en: "Unauthorized access. Token missing!"
    },

    roleAccesNonAutoriser: {
        fr: "Accès non autorisé. Rôle insuffisant !",
        en: "Unauthorized access. Insufficient role!"
    },
    invalidToken: {
        fr: "Token invalide !",
        en: "Invalid token!"
    },
    invalid_role: {
        fr: "Rôle invalide !",
        en: "Invalid role!"
    },
    motDePasseChange: {
        fr: "Mot de passe modifié avec succès !",
        en: "Password changed successfully!"
    },
    invalidInput: {
        fr: "Entrée invalide.",
        en: "Invalid input."
    },
    ajouter_avec_success: {
        fr: "Ajouter avec succès",
        en: "Added successfully"
    },
    jour_non_correspondant:{
        fr:"Le jour envoyé ne correspond pas au jour actuel.",
        en:"The submitted day does not match the current day."
    },
    presence_debut_enreg:{
        fr:"Présence enregistrée pour le début du cours.",
        en:"Attendance recorded for the start of the class."
    },
    presence_fin_enreg:{
        fr:"Présence enregistrée pour la fin du cours.",
        en:"Attendance recorded for the end of the class."
    },
    presence_confirm:{
        fr:"Présence déjà confirmée pour ce cours.",
        en:"Attendance already confirmed for this class."
    },
    horaire_non_conforme:{
        fr:"Vous ne pouvez marquer votre présence qu'entre 5 minutes avant et 15 minutes après l'horaire du cours.",
        en:"You can only mark your attendance between 5 minutes before and 15 minutes after the scheduled class time."
    },
    identifiant_invalide: {
        fr: "L'identifiant est invalide",
        en: "Identifier is invalid"
    },
    identifiant_ens_invalide: {
        fr: "L'identifiant de l'enseignant est invalide",
        en: "Teacher ID is invalid"
    },
    identifiant_user_invalide: {
        fr: "L'identifiant de l'utilisateur est invalide",
        en: "User ID is invalid"
    },
    non_trouvee: {
        fr: "Non trouvé",
        en: "Not found"
    },
    donne_a_jour: {
        fr: "Données à jour",
        en: "Data updated"
    },
    existe_code: {
        fr: "Ce code existe déjà",
        en: "This code already exists"
    },
    existe_libelle_fr: {
        fr: "Ce libellé français existe déjà",
        en: "This French label already exists"
    },
    existe_libelle_en: {
        fr: "Ce libelle anglais existe déjà",
        en: "This English label already exists"
    },
    existe_periode_fr: {
        fr: "Cette période en français existe déjà",
        en: "This period in French already exists"
    },
    existe_periode_en: {
        fr: "Cette période en anglais existe déjà",
        en: "This period in English already exists"
    },

    existe_num: {
        fr: "Ce numéro existe déjà",
        en: "This number already exists",
    },
    chevauchement: {
        fr: "Chevauchement de date",
        en: "Date overlap",
    },
    champ_obligatoire: {
        fr: "Tous les champs obligatoires doivent être fournis",
        en: "All required fields must be provided",
    },
    nombre_entier: {
        fr: "Attend un nombre entier",
        en: "Expects an integer",
    },
    mis_a_jour: {
        fr: "Mis à jour avec succès",
        en: "Updated successfully",
    },
    supprimer_avec_success: {
        fr: "Supprimer avec succès",
        en: "Deleted successfully",
    },
    region_inexistante: {
        fr: "Cette région n'existe pas",
        en: "This region does not exist",
    },
    departement_inexistant: {
        fr: "Ce département n'existe pas",
        en: "This department does not exist",
    },
    evenement_inexistant: {
        fr: "Cet évènement n'existe pas",
        en: "This event does not exist",
    },
    liste_event: {
        fr: "Liste des événements récupérée avec succès",
        en: "List of events retrieved successfully",
    },
    document_non_trouve:{
        fr:"Document non trouvé.",
        en:"Document not available."
    },
    support_non_trouve:{
        fr:"Support de cours introuvable.",
        en:"Course materials not available."
    },
    fournir_fichier:{
        fr:"Veuillez fournir un fichier.",
        en:"Please provide a file."
    },
    type_fichier_invalide:{
        fr:"Type de fichier invalide.",
        en:"Invalid file type."
    },
    erreur_upload:{
        fr:"Erreur lors de l’upload du fichier",
        en:"Error uploading file"
    },
    erreur_suppression:{
        fr:"Erreur lors de la suppression du fichier",
        en:"Error when deleting file"
    },
    liste_doc: {
        fr: "Liste des documents récupérée avec succès",
        en: "List of documents retrieved successfully",
    },
    event_a_venir: {
        fr: "Evènement à venir",
        en: "Upcoming event",
    },
    matiere_non_trouvee: {
        fr: "Cette matière n'existe pas",
        en: "This subject does not exist",
    },
    etudiant_non_trouvee: {
        fr: "Cet étudiant n'existe pas",
        en: "This student does not exist",
    },
    matiere_existe: {
        fr: "Un utilisateur avec le même matricule existe déjà",
        en: "A user with the same registration number already exists",
    },
    chapitre_non_trouve: {
        fr: "Ce chapitre n'existe pas",
        en: "This chapter does not exist",
    },
    type_ens_non_trouve: {
        fr: "L’activité pédagogique spécifiée n'a pas été trouvé.",
        en: "The specified pedagogical activity was not found.",
    },
    periode_non_trouve: {
        fr: "La période de cours n'a pas été trouvée.",
        en: "The course period was not found.",
    },
    
    existe_periode_cours: {
        fr: "Une période de cours avec les mêmes paramètres existe déjà",
        en: "A course period with the same parameters already exists",
    },
    existe_enseignant_cours:{
        fr: "L'un des enseignants a déjà un cours programmé au même moment",
        en: "One teacher already has a scheduled class at the same time",
    },
    existe_enseignant_p_cours: {
        fr: "L'enseignant principal a déjà un cours programmé au même moment",
        en: "The main teacher already has a scheduled class at the same time",
    },
    existe_enseignant_s_cours: {
        fr: "L'enseignant suppléant a déjà un cours programmé au même moment",
        en: "The substitute teacher already has a scheduled class at the same time",
    },
    existe_salle_cours_programme: {
        fr: "La salle de cours a déjà un cours programmé au même moment",
        en: "The classroom already has a scheduled class at the same time",
    },

    heure_invalide: {
        fr: "Format de l'heure invalide. Utilisez HH:MM.",
        en: "Invalid time format. Use HH:MM.",
    },

    heure_debut_fin_invalides: {
        fr: "L'heure de début doit être antérieure à l'heure de fin.",
        en: "The start time must be before the end time.",
    },

    periode_non_trouve: {
        fr: "Période d'enseignement non trouvée.",
        en: "Teaching period not found.",
    },

    devoir_non_trouve:{
        fr: "Devoir non trouvé.",
        en: "Assignment not found."
    },

    question_non_trouvee:{
        fr: "Question non trouvée.",
        en: "Question not found."
    },

    pas_de_tentatives:{
        fr:"Pas de tentative trouvée pour ce devoir.",
        en:"No attempt found for this assignment."
    },

    etudiant_tentative_non_trouvee:{
        fr:"Aucune tentative trouvée pour cet étudiant",
        en:"No attempts found for this student",
    },

    soumission_reussie:{
        fr:"Soumission réussie.",
        en:"Successful submission."
    },

    tentatives_max_atteintes:{
        fr:"Le nombre maximum de tentatives a été atteint.",
        en:"The maximum number of attempts has been reached."
    },

    permission_non_trouvee:{
        fr:"Permission non trouvee.",
        en:"Permission not found."
    },

    permission_attribuee:{
        fr:"Cette permission est déjà attribuée à l'utilisateur.",
        en:"The permission has already been granted to the user."
    },

    userNotFound: {
        fr: "Utilisateur non trouvé.",
        en: "User not found.",
    },
    userUpdated: {
        fr: "Informations du profil mises à jour avec succès.",
        en: "Profile information updated successfully.",
    },

    qcm_incorrect : {
        fr : "Les questions de type QCM doivent avoir au moins deux options.",
        en : "MCQ type questions must have at least two options."
    },

    vf_incorrect:{
        fr:"Une question VRAI ou FAUX doit avoir exactement deux options.",
        en:"A TRUE or FALSE question must have exactly two options."
    },

    somme_pourcentage_positif:{
        fr:"La somme des pourcentages positifs doit être égale à 100%.",
        en:"The sum of positive percentages must equal 100%."
    },

    somme_pourcentage_negatif:{
        fr:"La somme des pourcentages négatifs doit être supérieure ou égale à -100%.",
        en:"The sum of negative percentages must be greater than or equal to -100%."
    },
    
    userDeleted: {
        fr: "Utilisateur supprimé avec succès.",
        en: "User deleted successfully.",
    },
    serverError: {
        fr: "Erreur interne du serveur.",
        en: "Internal server error.",
    },
    alert_ajouter_success: {
        fr: "Alerte ajoutée avec succès",
        en: "Alert added successfully",
    },
    alert_supprimer_sucess: {
        fr: "Alerte supprimée avec succès",
        en: "Alert deleted successfully",
    },
    alert_non_trouver: {
        fr: "Alerte non trouvée",
        en: "Alert not found",
    },
    absence_signale_success: {
        fr: "Absence signalée avec succès",
        en: "Absence reported with success",
    },
    page_non_existante: {
        fr: "La page demandée n'existe pas.",
        en: "The requested page does not exist.",
    },

    pas_de_donnees :{
        fr:'Aucune donnée disponible pour l\'exportation', 
        en:'No data available for export'
    },

    absence_inexistante: {
        fr:"L'absence n'existe pas pour cet utilisateur",
        en:"Absence does not exist for this user"
    },
    erreur_ajout_absence: {
        fr:"Erreur serveur lors de l'ajout de l'absence à l'utilisateur",
        en:"Server error while adding absence to user"
    },
    erreur_retrait_absence: {
        fr:"Erreur serveur lors du retrait de l'absence de l'utilisateur",
        en:"Server error while removing absence from user"
    },
    absence_ajoutee_succes: {
        fr:"Absence ajoutée à l'utilisateur avec succès",
        en:"Absence added to user successfully"
    },
    absence_retiree_succes: {
        fr:"Absence retirée de l'utilisateur avec succès",
        en:"Absence removed from user successfully"
    },

    echec_rf:{
        fr:"Reconnaissance faciale échouée",
        en:"Failed facial recognition"
    },

    pp_non_trouve:{
        fr:"Photo de profil non trouvée",
        en:"Profile photo not found"
    },

    img_rf_mqte:{
        fr:"Image manquante pour la reconnaissance faciale",
        en:"Missing image for facial recognition"
    },

    img_det_imp:{
        fr:"Impossible de détecter un visage dans une ou les deux images",
        en:"Unable to detect a face in one or both images"
    },

    evaluation_non_trouvee: {
        fr: "Évaluation non trouvée",
        en: "Evaluation not found"
    },
    coeff_invalide: {
        fr: "Coefficient invalide pour une des matières",
        en: "Invalid coefficient for one of the subjects"
    },
    modification_note_impossible: {
        fr: "Impossible de modifier une évaluation dont les notes sont verrouillées",
        en: "Unable to modify an evaluation with locked grades"
    },
    suppression_eval_impossible: {
        fr: "Impossible de supprimer une évaluation qui n'est pas en brouillon",
        en: "Unable to delete an evaluation that is not in draft status"
    },
    statut_invalide: {
        fr: "Statut invalide",
        en: "Invalid status"
    },

    anonymat_non_trouve: {
        fr: "Anonymat non trouvé",
        en: "Anonymous ID not found"
    },
    anonymats_deja_generes: {
        fr: "Les anonymats ont déjà été générés pour cette évaluation",
        en: "Anonymous IDs have already been generated for this evaluation"
    },
    anonymats_generes_succes: {
        fr: "Anonymats générés avec succès",
        en: "Anonymous IDs generated successfully"
    },
    anonymat_invalide_inexistant: {
        fr: "Numéro d'anonymat invalide ou inexistant",
        en: "Invalid or non-existent anonymous number"
    },
    anonymat_invalider: {
        fr: "Cet anonymat a été invalidé",
        en: "This anonymous ID has been invalidated"
    },
    anonymat_valide: {
        fr: "Anonymat valide",
        en: "Valid anonymous ID"
    },
    anonymat_invalide_succes: {
        fr: "Anonymat invalidé avec succès",
        en: "Anonymous ID invalidated successfully"
    },

    note_obligatoire_absent: {
        fr: "La note est obligatoire si l'étudiant n'est pas absent",
        en: "A grade is required if the student is not absent"
    },
    notes_evaluation_verrouillees: {
        fr: "Les notes de cette évaluation sont verrouillées",
        en: "Grades for this evaluation are locked"
    },
    matiere_non_evaluation: {
        fr: "Cette matière ne fait pas partie de l'évaluation",
        en: "This subject is not part of the evaluation"
    },
    note_comprise: {
        fr: "La note doit être comprise entre",
        en: "The grade must be between"
    },
    aucune_note_a_deliberer: {
        fr: "Aucune note à délibérer",
        en: "No grades to deliberate"
    },
    deliberation_effectuee: {
        fr: "Délibération effectuée avec succès",
        en: "Deliberation completed successfully"
    },
    publie_succes: {
        fr: "Résultats publiés avec succès",
        en: "Results published successfully"
    },
    notes_deja_verrouillees: {
        fr: "Les notes sont déjà verrouillées",
        en: "Grades are already locked"
    },
    notes_verrouillees: {
        fr: "Notes verrouillées avec succès",
        en: "Grades locked successfully"
    },
    resultats_non_publie: {
        fr: "Les résultats ne sont pas encore publiés",
        en: "Results have not been published yet"
    },
    note_non_trouvee: {
        fr: "Aucune note trouvée pour cette évaluation",
        en: "No grades found for this evaluation"
    },
    coef_non_trouve: {
        fr: "Coefficient non trouvé",
        en: "Coefficient not found"
    },
    config_niveau_non_trouvee: {
        fr: "Configuration des niveaux non trouvée",
        en: "Level configuration not found"
    },
    nombre_semestre: {
        fr: "Le semestre doit être 1, 2 ou 3",
        en: "Semester must be 1, 2, or 3"
    }




};

export { message };
