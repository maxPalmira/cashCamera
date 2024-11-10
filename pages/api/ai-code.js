import OpenAI from 'openai';
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
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)){
  fs.mkdirSync(tmpDir);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API Key:', process.env.OPENAI_API_KEY); // Temporary debug log

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

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Analyze image using OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image and provide a JSON response with exactly this format: {\"title\": \"brief title\", \"description\": \"detailed description\", \"tags\": [\"tag1\", \"tag2\", \"tag3\"]}" 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    // Parse the response and format it
    const content = response.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      parsedContent = {
        title: "Image Analysis",
        description: content,
        tags: []
      };
    }

    const safeResponse = {
      title: parsedContent.title || "Untitled",
      description: parsedContent.description || "No description available",
      tags: Array.isArray(parsedContent.tags) ? parsedContent.tags : []
    };

    const tags = safeResponse.tags || [];
    while (tags.length < 5) {
      tags.push(`Tag ${tags.length + 1}`);
    }

    return res.status(200).json({
      ...safeResponse,
      tags: tags
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ 
      title: "Error",
      description: "Failed to analyze image",
      tags: []
    });
  }
} 