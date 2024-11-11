// components/ImageAnalyzer.jsx
import React, { useState } from 'react';
import { Upload, Camera, ImageIcon, TagIcon, Type, FileText, Heart, Quote, Scissors, Sparkles, Droplet, Flag, Stethoscope, Glasses, Lightbulb, Globe2, Brain, Palette, Clock, DollarSign, Zap, Flower, BookOpen } from 'lucide-react';

const ImageAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('/api/ai-code', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <Camera className="w-7 h-7 text-blue-600" />
            <span>AI Image Analysis</span>
          </div>
          <p className="mt-2 text-gray-600">Upload an image to get AI-powered insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300
                ${preview ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drop your image here, or</p>
                  <p className="text-sm text-blue-600">browse files</p>
                </div>
                <p className="text-xs text-gray-500">Supported formats: JPG, PNG, GIF</p>
              </label>
            </div>

            {preview && (
              <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full object-cover"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedImage || loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-300
                ${!selectedImage || loading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>

          {/* Analysis Results */}
          <div className={`space-y-4 transition-opacity duration-300 ${analysis ? 'opacity-100' : 'opacity-50'}`}>
            {analysis ? (
              <>
                <ResultCard icon={<Type />} title="Title" content={analysis.title} />
                <ResultCard icon={<FileText />} title="Description" content={analysis.description} />
                <ResultCard 
                  icon={<Heart />} 
                  title="Emotional Analysis" 
                  content={analysis.emotional_analysis} 
                />
                <ResultCard 
                  icon={<Quote />} 
                  title="Relevant Quote" 
                  content={analysis.relevant_quote} 
                />
                <ResultCard 
                  icon={<Scissors />} 
                  title="Fashion Commentary" 
                  content={analysis.fashion_commentary} 
                />
                {analysis.beauty_analysis && (
                  <ResultCard 
                    icon={<Sparkles />} 
                    title="Beauty Analysis" 
                    content={analysis.beauty_analysis} 
                  />
                )}
                <ResultCard 
                  icon={<Glasses />} 
                  title="Eyewear Suggestions" 
                  content={analysis.eyewear_suggestions} 
                />
                <ResultCard 
                  icon={<Flag />} 
                  title="Political Analysis" 
                  content={analysis.political_analysis} 
                />
                <ResultCard 
                  icon={<Droplet />} 
                  title="Fragrance Suggestion" 
                  content={analysis.fragrance_suggestion} 
                />
                <ResultCard 
                  icon={<Stethoscope />} 
                  title="Cosmetic Suggestions" 
                  content={analysis.cosmetic_suggestions} 
                />
                <ResultCard 
                  icon={<Lightbulb />} 
                  title="Symbolic Meaning" 
                  content={analysis.symbolic_meaning} 
                />
                <ResultCard 
                  icon={<Globe2 />} 
                  title="Cultural Significance" 
                  content={analysis.cultural_significance} 
                />
                <ResultCard 
                  icon={<Brain />} 
                  title="Psychological Insight" 
                  content={analysis.psychological_insight} 
                />
                <ResultCard 
                  icon={<Palette />} 
                  title="Artistic Elements" 
                  content={analysis.artistic_elements} 
                />
                <ResultCard 
                  icon={<Clock />} 
                  title="Historical Context" 
                  content={analysis.historical_context} 
                />
                <ResultCard 
                  icon={<Globe2 />} 
                  title="Suggested Cities" 
                  content={analysis.suggested_cities} 
                />
                <ResultCard 
                  icon={<DollarSign />} 
                  title="Million Dollar Opportunity" 
                  content={analysis.business_opportunity} 
                />
                <ResultCard 
                  icon={<Flower />} 
                  title="Chakra Analysis" 
                  content={analysis.chakra_analysis} 
                />
                <ResultCard 
                  icon={<Zap />} 
                  title="Energy Reading" 
                  content={analysis.energy_reading} 
                />
                <ResultCard 
                  icon={<BookOpen />} 
                  title="Recommended Books" 
                  content={analysis.book_recommendations} 
                />
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-gray-700">
                    <TagIcon className="w-5 h-5" />
                    <h3 className="font-medium">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Analysis results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ icon, title, content }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
    <div className="flex items-center gap-2 mb-3 text-gray-700">
      {icon}
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="text-gray-600">{content}</p>
  </div>
);

export default ImageAnalyzer;