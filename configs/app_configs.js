export const appConfigs = {
    
    role: {
        superAdmin: 'super-admin',
        admin: 'admin',
        enseignant: 'enseignant',
        delegue: 'delegue',
        etudiant: 'etudiant',
    },
    typeNotifications:{
        absence:"absence", 
        approbation_chap:"approbation_chap", 
        approbation_obj:"approbation_obj"
    },
    genre: {
        masculin: "M",
        feminin: "F",
    },


    defaultSuperUser: {
        nom: "Arturo",
        prenom: "Palace",
        email: "super.admin@gmail.com",
        genre: "M",
        defautlPassword: process.env.DEFAULT_SUPER_ADMIN_PASSWORD,
    },
    user: "suport.resetpass@gmail.com",
    pass: "nyxsjvahaavoilbg",
    appName: "SchoolApp",
    appEmail: "contact@gestion-etudiant.com",
    frontEndUrl: "http://localhost:5173/"

}