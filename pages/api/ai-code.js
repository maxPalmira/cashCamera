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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this image and provide a JSON response in this exact format: {
                "title": "A brief, catchy title",
                "description": "A detailed visual description focusing on shapes, colors, composition, and physical elements",
                "emotional_analysis": "A separate analysis focusing on emotions, expressions, body language, and mood",
                "relevant_quote": "A famous quote that relates to the mood, emotion, or theme of the image. Include author attribution",
                "fashion_commentary": "A high-fashion magazine style critique of the clothing and accessories",
                "beauty_analysis": "IF FEMALE: Detailed makeup analysis in beauty magazine style, covering techniques, color choices, and overall impact. IF MALE: Detailed facial hair/grooming analysis in men's magazine style. IF NO PERSON: omit this field",
                "political_analysis": "An analysis of any political leanings suggested by the image, including style choices, symbols, or context. If no clear indicators: 'No clear political indicators visible'",
                "fragrance_suggestion": "A luxury perfume/cologne recommendation that matches the mood, style, and personality shown in the image, including scent notes and brand",
                "cosmetic_suggestions": "Professional aesthetic medicine suggestions including potential surgical and non-surgical enhancements (e.g., Botox, fillers, surgical procedures) to enhance facial features and skin quality. Include estimated recovery times if applicable.",
                "eyewear_suggestions": "Personalized eyewear recommendations based on face shape, style, and current trends. Include specific frame styles, brands, and colors that would complement the person's features",
                "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
              }`
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
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    // Parse response with better error handling
    const content = response.choices[0].message.content;
    let parsedContent;
    
    try {
      console.log('Raw content:', content);
      
      const jsonString = content.replace(/^```json\n?|\n?```$/g, '').trim();
      parsedContent = JSON.parse(jsonString);

      if (!parsedContent.title || !parsedContent.description || !parsedContent.emotional_analysis) {
        throw new Error('Invalid response structure');
      }
    } catch (e) {
      console.error('Parsing error:', e);
      parsedContent = {
        title: "Image Analysis",
        description: "Unable to process description",
        emotional_analysis: "Unable to process emotional analysis",
        tags: []
      };
    }

    const safeResponse = {
      title: parsedContent.title || "Untitled",
      description: parsedContent.description || "No description available",
      emotional_analysis: parsedContent.emotional_analysis || "No emotional analysis available",
      relevant_quote: parsedContent.relevant_quote || "No relevant quote available",
      fashion_commentary: parsedContent.fashion_commentary || "No fashion commentary available",
      beauty_analysis: parsedContent.beauty_analysis || null,
      political_analysis: parsedContent.political_analysis || "No political analysis available",
      fragrance_suggestion: parsedContent.fragrance_suggestion || "No fragrance suggestion available",
      cosmetic_suggestions: parsedContent.cosmetic_suggestions || "No cosmetic suggestions available",
      eyewear_suggestions: parsedContent.eyewear_suggestions || "No eyewear suggestions available",
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