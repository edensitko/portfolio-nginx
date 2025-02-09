import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { generateResponse, ChatMessage, OpenAIResponse } from '../services/openaiService';
import './BuilderPage.css';

function BuilderPage() {
  // State for the 4-part user input
  const [typeOfSite, setTypeOfSite] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteColors, setSiteColors] = useState('');
  const [description, setDescription] = useState('');

  // State for generated site content
  const [websiteContent, setWebsiteContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  // Additional UI states
  const [showCode, setShowCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Ref for the iframe (optional)
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Questions for the multi-step input
  const questions = [
    'What type of website do you want to create?',
    'What is the name of your website?',
    'What colors would you like to use?',
    'Describe your website in detail'
  ];

  // Create a safe, sanitized preview of HTML content
  const createPreviewBlob = (htmlContent: string) => {
    try {
      const fullHtmlDocument = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              line-height: 1.6;
            }
          </style>
        </head>
        <body class="bg-gray-50">
          ${htmlContent}
        </body>
        </html>
      `;

      const blob = new Blob([fullHtmlDocument], { type: 'text/html' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating preview blob:', error);
      return '';
    }
  };

  // Build a comprehensive prompt for the AI
  const buildPrompt = () => {
    const unsplashImageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(typeOfSite)}`;

    return `Generate a complete, production-ready HTML landing page for a website with the following details:
1. Type of site: ${typeOfSite}
2. Site name: ${siteName}
3. Preferred colors: ${siteColors}
4. Description: ${description}

STRICT REQUIREMENTS:
- Create a hero section with a prominent image
- Use this specific image URL: ${unsplashImageUrl}
- If the image doesn't load, use a placeholder image
- Include an <img> tag with explicit width and height
- Alt text must describe the site type
- Use ONLY CSS for styling
- Fully responsive design
- Semantic HTML5 structure
- Engaging, concise content
- Professional color palette
- Clean typography
- NO external JavaScript
- Include appropriate meta tags

IMPORTANT INSTRUCTIONS FOR IMAGE:
- Add this HTML for the hero image:
\`<div class="hero-section relative w-full h-[500px] overflow-hidden">
    <img 
        src="${unsplashImageUrl}" 
        alt="Image representing ${typeOfSite}" 
        onerror="this.onerror=null; this.src='https://via.placeholder.com/1600x900?text=Website+Image'"
        class="w-full h-full object-cover absolute top-0 left-0"
        width="1600"
        height="900"
    />
    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <h1 class="text-white text-4xl font-bold">${siteName}</h1>
    </div>
</div>\`

IMPORTANT: Wrap all content inside a <div class="container mx-auto px-4"> for proper responsive layout.
    `.trim();
  };

  // Handle the multi-step input process
  const handleNextStep = (userInput: string) => {
    if (currentStep === 0) {
      setTypeOfSite(userInput);
    } else if (currentStep === 1) {
      setSiteName(userInput);
    } else if (currentStep === 2) {
      setSiteColors(userInput);
    } else if (currentStep === 3) {
      setDescription(userInput);
    }

    // Move to next step or generate website
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
  };

  // Generate website when all steps are complete
  const handleGenerateWebsite = async () => {
    setIsLoading(true);
    setError('');
    setWebsiteContent('');
    setShowCode(false);

    try {
      // Build the final prompt string
      const finalPrompt = buildPrompt();

      // Send request to OpenAI
      const apiResponse = await generateResponse(finalPrompt, conversationHistory);

      // Extract generated HTML
      const generatedHTML = apiResponse.choices[0].message.content?.trim() ?? '';

      // Validate generated HTML
      if (!generatedHTML || generatedHTML.length < 50) {
        throw new Error('Generated HTML is too short or empty');
      }

      // Update website content and preview
      setWebsiteContent(generatedHTML);

      // Update conversation history
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: finalPrompt },
        { role: 'assistant', content: generatedHTML }
      ];
      setConversationHistory(newHistory);

      // Create and set the preview URL
      const previewBlobUrl = createPreviewBlob(generatedHTML);
      setPreviewUrl(previewBlobUrl);

    } catch (err: any) {
      console.error('Error making API request:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to generate website. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Open the preview in a new browser tab
  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Toggle showing the raw HTML code
  const handleToggleCodeView = () => {
    setShowCode((prev) => !prev);
  };

  // Download the generated HTML as an index.html file
  const handleDownload = () => {
    if (!websiteContent) return;

    // Build a full HTML document (including <head>, <body>) so the downloaded file is standalone
    const fullHtmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.6;
            background-color: #f9fafb;
          }
        </style>
        <title>${siteName || 'My Website'}</title>
      </head>
      <body>
        ${websiteContent}
      </body>
      </html>
    `;

    const fileBlob = new Blob([fullHtmlDocument], { type: 'text/html' });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="main flex h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Left Side - Input */}
      <div className="input w-1/2 p-8 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Website Builder
            </h1>
            <p className="text-gray-600">
              Create your perfect website in just a few steps
            </p>
          </div>

          {currentStep < questions.length ? (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {questions[currentStep]}
                </label>
                {currentStep !== 3 ? (
                  <input
                    type="text"
                    value={
                      currentStep === 0 ? typeOfSite :
                      currentStep === 1 ? siteName :
                      currentStep === 2 ? siteColors : ''
                    }
                    onChange={(e) => {
                      const input = e.target.value;
                      if (currentStep === 0) setTypeOfSite(input);
                      else if (currentStep === 1) setSiteName(input);
                      else if (currentStep === 2) setSiteColors(input);
                    }}
                    className="w-full p-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition duration-300 ease-in-out text-gray-700"
                    placeholder={`Enter ${questions[currentStep].toLowerCase()}`}
                    disabled={isLoading}
                  />
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-36 p-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 text-gray-700 resize-none"
                    placeholder="Describe your website in detail..."
                    maxLength={1000}
                    disabled={isLoading}
                  />
                )}
              </div>

              <button
                onClick={() => handleNextStep(
                  currentStep === 0 ? typeOfSite :
                  currentStep === 1 ? siteName :
                  currentStep === 2 ? siteColors :
                  description
                )}
                disabled={
                  isLoading || 
                  (currentStep === 0 && !typeOfSite.trim()) ||
                  (currentStep === 1 && !siteName.trim()) ||
                  (currentStep === 2 && !siteColors.trim()) ||
                  (currentStep === 3 && !description.trim())
                }
                className={`w-full py-3 rounded-xl text-white font-semibold transition duration-300 ${
                  isLoading || 
                  (currentStep === 0 && !typeOfSite.trim()) ||
                  (currentStep === 1 && !siteName.trim()) ||
                  (currentStep === 2 && !siteColors.trim()) ||
                  (currentStep === 3 && !description.trim())
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-200'
                }`}
              >
                {currentStep < questions.length - 1 ? 'Next' : 'Generate Website'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={handleGenerateWebsite}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-white font-semibold transition duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-200'
                }`}
              >
                {isLoading ? 'Generating Magic...' : 'Craft My Website'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="prev w-1/2 p-6 bg-white/90 backdrop-blur-sm shadow-2xl overflow-y-auto preview-scrollbar">
        <div className="h-[calc(100vh-48px)] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
              <div className="animate-pulse">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-6 bounce-animation"></div>
                <p className="text-gray-600 text-lg font-semibold">
                  Crafting your perfect website...
                </p>
              </div>
            </div>
          )}

          {/* If we have a preview available */}
          {previewUrl && !isLoading ? (
            <iframe
              ref={previewIframeRef}
              src={previewUrl}
              className="w-full h-full"
              title="Website Preview"
            />
          ) : (
            !isLoading && (
              <div className="flex items-center justify-center h-full text-gray-400 text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center space-y-6">
                  <p className="text-2xl font-semibold placeholder-text">
                    Your generated website will appear here
                  </p>
                  <p className="text-gray-500 text-lg">
                    Answer the questions on the left to get started
                  </p>
                </div>
              </div>
            )
          )}

          {/* Action buttons (view code, open new tab, download) */}
          {!isLoading && websiteContent && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-4 z-20">
              <button
                onClick={handleToggleCodeView}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow"
              >
                {showCode ? 'Hide Code' : 'View Code'}
              </button>

              <button
                onClick={handleOpenInNewTab}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow"
              >
                Open in New Tab
              </button>

              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow"
              >
                Download HTML
              </button>
            </div>
          )}
        </div>

        {/* If user wants to view raw HTML code */}
        {showCode && websiteContent && (
          <div className="mt-4 bg-gray-100 p-4 rounded-xl shadow-inner">
            <h2 className="text-xl font-bold mb-2">Generated HTML Code</h2>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {websiteContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuilderPage;
