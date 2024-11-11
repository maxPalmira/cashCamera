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
                "symbolic_meaning": "Deep analysis of symbols, metaphors, and hidden meanings present in the image",
                "cultural_significance": "Analysis of cultural references, traditions, and societal implications",
                "psychological_insight": "Psychological interpretation of body language, expressions, and environmental cues",
                "artistic_elements": "Analysis of composition, color theory, lighting, and artistic techniques used",
                "historical_context": "Connections to historical periods, movements, or significant moments",
                "haircut_suggestion": "Detailed haircut recommendations including style, length, layers, and face-framing elements that would enhance features. Include celebrity references if applicable",
                "hair_color_suggestion": "Recommended hair color palette including base color, highlights, lowlights, or balayage techniques that would complement skin tone and eyes",
                "winter_wear_suggestion": "Curated winter wardrobe suggestions including outerwear, accessories, and layering pieces that match the person's style and body type",
                "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
                "business_opportunity": "A detailed analysis of potential business opportunities based on the image's elements, including market gaps, innovative ideas, and monetization strategies that could lead to significant financial gains. Include specific action steps and timeline.",
                "chakra_analysis": "Detailed analysis of the chakra energies present in the image, including which chakras are dominant, blocked, or need balancing. Include specific recommendations for chakra alignment.",
                "energy_reading": "Comprehensive analysis of the energetic frequencies, auras, and vibrational patterns detected in the image. Include both positive and negative energy fields, and suggestions for energy optimization.",
                "suggested_cities": "Three personalized city recommendations based on the image's aesthetic, mood, and style. Include how each city would impact personal growth. Format: CityName, Country: Impact description",
                "book_recommendations": "Three to five personalized book recommendations based on the image analysis, including title, author, and why it would resonate with the person or scene. Format each recommendation on a new line."
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
      symbolic_meaning: parsedContent.symbolic_meaning || "No symbolic analysis available",
      cultural_significance: parsedContent.cultural_significance || "No cultural analysis available",
      psychological_insight: parsedContent.psychological_insight || "No psychological insight available",
      artistic_elements: parsedContent.artistic_elements || "No artistic analysis available",
      historical_context: parsedContent.historical_context || "No historical context available",
      haircut_suggestion: parsedContent.haircut_suggestion || "No haircut suggestions available",
      hair_color_suggestion: parsedContent.hair_color_suggestion || "No hair color suggestions available",
      winter_wear_suggestion: parsedContent.winter_wear_suggestion || "No winter wear suggestions available",
      tags: Array.isArray(parsedContent.tags) ? parsedContent.tags : [],
      suggested_cities: parsedContent.suggested_cities || "No city suggestions available",
      business_opportunity: parsedContent.business_opportunity || "No business opportunities identified",
      chakra_analysis: parsedContent.chakra_analysis || "No chakra analysis available",
      energy_reading: parsedContent.energy_reading || "No energy reading available",
      book_recommendations: parsedContent.book_recommendations || "No book recommendations available"
    };

    const generateTags = (content) => {
      const allText = [
        content.title,
        content.description,
        content.emotional_analysis,
        content.fashion_commentary,
        content.symbolic_meaning,
        content.cultural_significance,
        content.psychological_insight,
        content.artistic_elements,
        content.business_opportunity,
        content.chakra_analysis,
        content.energy_reading,
        content.book_recommendations
      ].join(' ');

      // Extract key words and phrases
      const words = allText.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3) // Filter out short words
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      // If we have parsed tags from the API, include them first
      const existingTags = Array.isArray(content.tags) ? content.tags : [];
      const combinedTags = [...existingTags, ...words];
      
      // Select 15 unique tags, prioritizing existing tags
      const finalTags = combinedTags
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .slice(0, 15);

      // Ensure we always have 15 tags
      while (finalTags.length < 15) {
        finalTags.push(`Tag ${finalTags.length + 1}`);
      }

      return finalTags;
    };

    const tags = generateTags(parsedContent);

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