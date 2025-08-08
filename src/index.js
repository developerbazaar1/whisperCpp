const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());  // Use express.json() to parse incoming JSON requests

const PORT = process.env.PORT || 3000;

app.post('/transcribe', async (req, res) => {
    try {
        const audioFileName = 'oneHourAudio.mp3';  // Hardcoded for now

        const whisperExecutablePath = '/root/whisperCppModel/whisper.cpp/build/bin/whisper-cli';  // Path to Whisper CLI
        const modelPath = '/root/whisperCppModel/whisper.cpp/models/ggml-base.en.bin';  // Path to model file
        const audioFilePath = path.join(__dirname, audioFileName);  // Audio file path

        console.log("Audio path:", audioFilePath);

        // Check if the audio file exists
        if (!fs.existsSync(audioFilePath)) {
            return res.status(404).send({ error: 'Audio file not found' });
        }

        // Define the output file path for transcription
        const outputFilePath = path.join(__dirname, 'output');

        // Build the command for Whisper CLI
        const command = `${whisperExecutablePath} --model ${modelPath} --file ${audioFilePath} --threads 60 --processors 6 --output-txt --output-file ${outputFilePath}`;

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            // Check if there's an error from executing the command
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).send({ error: 'Transcription failed during command execution' });
            }

            // Log stderr (useful for debugging, but we don't consider it a failure here)
            if (stderr) {
                console.warn(`stderr: ${stderr}`);
            }

            // Read the output file (transcription result)
            fs.readFile(outputFilePath + '.txt', 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading transcription file: ${err.message}`);
                    return res.status(500).send({ error: 'Failed to read transcription output' });
                }

                // Send the transcription result back to the client
                res.json({ transcription: data });
            });
        });
    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
        return res.status(500).send({ error: 'An unexpected error occurred' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

