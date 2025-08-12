const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require("dotenv").config();
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');  // Importing UUID for unique file naming
const { downloadFile} = require("./utils/utils.js")
const {apiKeyMiddleware} = require("./middleware/checkApiKey.js")
const app = express();
app.use(express.json());

app.use(cors());
process.env.UV_THREADPOOL_SIZE = 128;

const PORT = process.env.PORT || 3000;

// Function to process the transcription (run Whisper CLI)
const processTranscription = (audioFilePath, outputFilePath, res) => {
    const whisperExecutablePath = '/root/whisperCppModel/whisper.cpp/build/bin/whisper-cli';  // Path to Whisper CLI
    const modelPath = '/root/whisperCppModel/whisper.cpp/models/ggml-base.en.bin';  // Path to model file

    const command = `${whisperExecutablePath} --model ${modelPath} --file ${audioFilePath} --threads 60 --processors 8 --output-txt --output-file ${outputFilePath}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).send({ error: 'Transcription failed during command execution' });
        }

        if (stderr) {
            console.warn(`stderr: ${stderr}`);
        }

        fs.readFile(outputFilePath + '.txt', 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading transcription file: ${err.message}`);
                return res.status(500).send({ error: 'Failed to read transcription output' });
            }
		 // Clean up transcription result by removing newline characters
            const cleanedTranscription = data.replace(/\n/g, ' ').trim();
            res.status(200).json({ transcription: cleanedTranscription, message:"Audio Transcribe successfully" });

            // Clean up the downloaded audio file and output file
            fs.unlink(audioFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting downloaded file:', unlinkErr.message);
                } else {
                    console.log('Downloaded audio file deleted successfully');
                }
            });

            fs.unlink(outputFilePath + '.txt', (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting transcription output file:', unlinkErr.message);
                } else {
                    console.log('Transcription output file deleted successfully');
                }
            });
        });
    });
};

app.post('/transcribe', apiKeyMiddleware, async (req, res) => {
    try {
        const { audioUrl } = req.body;  // Get audio file URL from the request body
        if (!audioUrl) {
            return res.status(400).send({ error: 'Audio URL is required' });
        }

        const uniqueId = uuidv4();  // Generate a unique ID for each request
        const audioFileName = `${uniqueId}_downloaded_audio.mp3`;  // Generate unique name for the downloaded file
        const audioFilePath = path.join(__dirname, audioFileName);  // Audio file path

        const outputFileName = `${uniqueId}_output`;  // Generate unique name for the output file
        const outputFilePath = path.join(__dirname, outputFileName);  // Output file path

        // Download the audio file from the URL
        console.log("Downloading audio file...");
        await downloadFile(audioUrl, audioFilePath);

        console.log("Audio file downloaded:", audioFilePath);

        // Process the transcription
        processTranscription(audioFilePath, outputFilePath, res);

    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
        return res.status(500).send({ error: 'An unexpected error occurred' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

