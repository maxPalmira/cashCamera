// ai-code/index.js
import { OpenAI } from 'openai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: './tmp',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    const uploadMiddleware = upload.single('image');
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read and encode the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Create completion using gpt-4o
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What’s in this image?' },
            {
              type: 'image_url',
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    // Parse the response
    const content = response.choices[0].message.content;
    // Process the content as required

    return res.status(200).json({ analysis: content });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      error: 'Error processing image',
      details: error.message,
    });
  }
}
