const supertest = require('supertest');
const chai = require('chai');
const app = require('../server.js'); // Ajustez le chemin selon l'emplacement de votre fichier index.js

const expect = chai.expect;
const request = supertest(app);

describe('Test des routes API', () => {

    describe('GET /', () => {
        it('devrait retourner index.html', async () => {
            const response = await request.get('/');
            expect(response.status).to.equal(200);
            expect(response.text).to.include('<title>Transcription de Vidéo</title>');
        });
    });

    describe('POST /transcribe', () => {
        it('devrait retourner une erreur 400 si aucun fichier n\'est fourni', async () => {
            const response = await request.post('/transcribe');
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Un fichier vidéo est nécessaire.');
        });

        // Pour les tests qui envoient des fichiers, cela dépend du fichier que vous avez.
        // Pour cet exemple, supposons que vous ayez un `exemple.mp4` dans un dossier `testFiles` :
      /*   it('devrait accepter un fichier vidéo et démarrer le traitement', async () => {
            const response = await request.post('/transcribe')
                .attach('sampleFile', './testFiles/exemple.mp4'); // Ajustez le chemin selon l'emplacement du fichier
            expect(response.status).to.equal(200);
            expect(response.text).to.equal('Fichier reçu et traitement démarré.');
        }).timeout("5000") */

        /* it('devrait refuser un fichier non vidéo', async () => {
            const response = await request.post('/transcribe')
                .attach('sampleFile', './testFiles/notAVideo.txt'); // Ajustez le chemin selon l'emplacement du fichier
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Un fichier vidéo est nécessaire.');
        }) */
    });
});
