function authorizationMiddleware(requiredPermission) {
    return (req, res, next) => {
        const userPermissions = req.user.permissions; // Récupérer les permissions de l'utilisateur

        // Vérifier si l'utilisateur a la permission requise
        if (userPermissions && userPermissions.includes(requiredPermission)) {
            return next(); // L'utilisateur a la permission, passer à la route suivante
        }

        // L'utilisateur n'a pas la permission
        return res.status(403).json({ message: 'Accès interdit : vous n’avez pas la permission requise.' });
    };
}

// Utilisation du middleware pour une route spécifique
app.get('/some-protected-route', authorizationMiddleware('permission_name'), (req, res) => {
    res.send('Vous avez accès à cette ressource protégée.');
});
