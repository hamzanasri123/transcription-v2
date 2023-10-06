# Utilisez une image Node.js officielle comme base
FROM node:14

# Définissez le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copiez le fichier package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installez les dépendances de l'application
RUN npm install

# Copiez les autres fichiers de l'application dans le conteneur
COPY . .

# Exposez le port que votre application utilise (par exemple, 3000)
EXPOSE 3000

# Commande pour démarrer votre application
CMD ["npm", "start"]
