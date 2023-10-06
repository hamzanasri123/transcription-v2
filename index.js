const express = require('express');
const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const videoIntelligence = require('@google-cloud/video-intelligence');
const app = express();
const port = 3000;

// Middleware pour analyser les corps des requêtes JSON
app.use(bodyParser.json());

app.post('/transcribe', async (req, res) => {
    if (!req.body.gcsUri) {
        return res.status(400).send('LURL GCS est nécessaire.');
    }

    try {
        const transcript = await analyzeVideoTranscript(req.body.gcsUri);
        res.json({ transcript });
    } catch (error) {
        res.status(500).send('Erreur lors de la transcription: ' + error.message);
    }
});

async function analyzeVideoTranscript(gcsUri) {
    const client = new videoIntelligence.VideoIntelligenceServiceClient({
        projectId: "cogent-osprey-336709",
        keyFilename: path.join(__dirname, "cogent-osprey-336709-f424dc67d60c.json")
    });
    const videoContext = {
        speechTranscriptionConfig: {
            languageCode: 'en-US',
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
           /// transcriptText += `Confidence: ${alternative.confidence}\n`;

            for (const wordInfo of alternative.words) {
                const word = wordInfo.word;
                /* const start_time = wordInfo.startTime.seconds + wordInfo.startTime.nanos * 1e-9;
                const end_time = wordInfo.endTime.seconds + wordInfo.endTime.nanos * 1e-9; */
                transcriptText += word + " ";

                //transcriptText += '\t' + start_time + 's - ' + end_time + 's: ' + word + '\n';
            }
        }
    }
    saveTranscriptionToFile(transcriptText);
    return transcriptText;
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

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
