const message = {
    erreurServeur: {
        fr: "Erreur interne du serveur !",
        en: "Internal server error!"
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
        fr:"Vous ne pouvez marquer votre présence qu'entre 5 minutes avant et 5 minutes après l'horaire du cours.",
        en:"You can only mark your attendance between 5 minutes before and 5 minutes after the scheduled class time."
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
    }
};

export { message };
