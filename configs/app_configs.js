export const appConfigs = {
    role: {
        superAdmin: 'super-admin',
        admin: 'admin',
        enseignant: 'enseignant',
        delegue: 'delegue',
        etudiant: 'etudiant',
    },
    genre: {
        masculin: "m",
        feminin: "f",
    },

    defaultSuperUser: {
        nom: "Arturo",
        prenom: "Palace",
        email: "super.admin@gmail.com",
        genre: "m",
        defautlPassword: process.env.DEFAULT_SUPER_ADMIN_PASSWORD,
    }

}