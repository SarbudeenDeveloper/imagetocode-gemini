const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const {
    GoogleGenerativeAI,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const app = express();
const port = 5000;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const upload = multer({ dest: 'uploads/' });
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 18192,
    responseMimeType: "application/json",
};

app.use(express.json());
app.use(cors());

async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
}

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const file = await uploadToGemini(req.file.path, req.file.mimetype);

        const chatSession = model.startChat({
            generationConfig,
        });

        const result = await chatSession.sendMessage([{
            fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
            }
        },
        {
            text: "Write a complete html, css, js to design given image this. Try match the given component design, Provide complete code. Output will be in json {code: \"\"}"
        }]);

        fs.unlinkSync(req.file.path); // Clean up uploaded file
        const textResponse = result.response.text();
        const code = JSON.parse(textResponse);
        console.log(code);
        return res.status(200).json(code);
    } catch (error) {
        console.error('Error generating code: ', error);
        res.status(500).send('Error generating code.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
