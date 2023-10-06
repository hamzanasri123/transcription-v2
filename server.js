const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const videoIntelligence = require('@google-cloud/video-intelligence');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('.')); // Pour servir des fichiers statiques comme index.html


if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
const upload = multer({ storage: storage });


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/transcribe', upload.single('sampleFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Un fichier vidéo est nécessaire.');
    }

    const localFilePath = req.file.path;

    try {
        const gcsUri = await uploadToGCS(localFilePath);
        await analyzeVideoTranscript(gcsUri);
        res.send("Fichier reçu et traitement démarré.");
    } catch (error) {
        res.status(500).send('Erreur: ' + error.message);
    } finally {
        fs.unlinkSync(localFilePath);
    }
});

async function uploadToGCS(localFilePath) {
    const bucketName = 'mybuckettranscvide'; 
    const storageClient = new Storage({
        projectId: "cogent-osprey-336709",
        keyFilename: path.join(__dirname, "cogent-osprey-336709-f424dc67d60c.json")
    });
    const destFileName = path.basename(localFilePath);
    await storageClient.bucket(bucketName).upload(localFilePath, {
        destination: destFileName,
    });
    return `gs://${bucketName}/${destFileName}`;
}

async function analyzeVideoTranscript(gcsUri) {
    const client = new videoIntelligence.VideoIntelligenceServiceClient({
        projectId: "cogent-osprey-336709",
        keyFilename: path.join(__dirname, "cogent-osprey-336709-f424dc67d60c.json")
    });
    const videoContext = {
        speechTranscriptionConfig: {
            languageCode: 'fr-FR',
            enableAutomaticPunctuation: true,
        },
    };

    const request = {
        inputUri: gcsUri,
        features: ['SPEECH_TRANSCRIPTION'],
        videoContext: videoContext,
    };

    const [operation] = await client.annotateVideo(request);
    const [operationResult] = await operation.promise();
    const annotationResults = operationResult.annotationResults[0];

    let transcriptText = '';

    for (const speechTranscription of annotationResults.speechTranscriptions) {
        for (const alternative of speechTranscription.alternatives) {
            transcriptText += `Transcript: ${alternative.transcript}\n`;
            transcriptText += `Confidence: ${alternative.confidence}\n`;
            for (const wordInfo of alternative.words) {
                const word = wordInfo.word;
                const start_time = wordInfo.startTime.seconds + wordInfo.startTime.nanos * 1e-9;
                const end_time = wordInfo.endTime.seconds + wordInfo.endTime.nanos * 1e-9;
                transcriptText += '\t' + start_time + 's - ' + end_time + 's: ' + word + '\n';
            }
        }
    }

    saveTranscriptionToFile(transcriptText);
}

function saveTranscriptionToFile(transcriptionText) {
    const dirName = "transcriptions";
    const fileName = `transcription_${Date.now()}.txt`;
    const fullPath = path.join(__dirname, dirName, fileName);

    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }

    fs.writeFileSync(fullPath, transcriptionText);
    console.log(`Transcription sauvegardée dans: ${fullPath}`);
}

const server = app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});

module.exports = server