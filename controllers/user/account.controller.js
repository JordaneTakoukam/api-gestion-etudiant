import User from './../../models/user.model.js'


// get par l'id
export const getUser = async (req, res) => {
    const userId = req.params.id; // Récupérer l'ID de l'utilisateur depuis les paramètres de la requête

    try {
        // Chercher l'utilisateur par son ID dans la base de données
        const user = await User.findById(userId);

        if (!user) {
            // Si aucun utilisateur n'est trouvé avec cet ID, retourner une réponse 404
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }

        // Si l'utilisateur est trouvé, retourner ses informations
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        // En cas d'erreur, retourner une réponse 500 avec un message d'erreur
        console.error("Erreur :", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
}


// get par plage et pagination
export const getUsers = async (req, res) => { }


// mettre a jour
export const updateUser = async (req, res) => { }


// supprimer
export const deleteUsers = async (req, res) => { }

// reset password
export const updatePassword = async (req, res) => { }