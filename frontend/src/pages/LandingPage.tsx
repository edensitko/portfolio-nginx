import React, { useState, useEffect } from 'react';
import { Rocket, Check, ArrowRight, Eye, AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateResponse, checkOpenAIConfiguration } from '../services/openaiService';

function LandingPage() {
  const navigate = useNavigate();
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check OpenAI configuration on component mount
  useEffect(() => {
    const isConfigured = checkOpenAIConfiguration();
    if (!isConfigured) {
      setError('OpenAI API is not configured correctly');
    }
  }, []);

  const handleAiInteraction = async () => {
    // Reset previous states
    setIsLoading(true);
    setShowPreview(false);
    setError(null);

    try {
      // Define a more specific prompt
      const prompt = "Provide 3 innovative startup ideas for 2024 in the tech industry. Format each idea with a title and brief description.";
      
      // Log the prompt being sent
      console.log('Sending Prompt:', prompt);

      // Generate response
      const response = await generateResponse(prompt);
      
      // Validate response
      if (!response) {
        throw new Error('No response received from OpenAI');
      }

      // Set response and show preview
      setAiResponse(response.choices[0].message.content || '');
      setShowPreview(true);
      setRetryCount(0);  // Reset retry count on successful response
    } catch (err: any) {
      // Detailed error handling
      console.error('OpenAI Interaction Error:', err);
      
      // Set user-friendly error message
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while generating the response';
      
      setError(errorMessage);
      setIsLoading(false);
      
      // Implement retry logic
      if (retryCount < 3) {
        setRetryCount(prevCount => prevCount + 1);
        console.log(`Retry attempt ${retryCount + 1}`);
      } else {
        console.error('Max retries reached');
      }
    } finally {
      // Always set loading to false
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleAiInteraction();
  };

  const renderPreviewText = (text: string) => {
    // If text is empty, return a default message
    if (!text || text.trim() === '') {
      return (
        <p className="text-gray-500 italic">
          לא התקבלה תגובה. אנא נסה שוב או בדוק את הגדרות ה-API.
        </p>
      );
    }

    // Split text into lines, handling different possible line breaks
    const lines = text.split(/\n|\r\n/).filter(line => line.trim() !== '');

    return lines.map((line, index) => {
      // Render bold text (with more flexible matching)
      if (/^\*{1,2}.*\*{1,2}$/.test(line)) {
        return (
          <h3 key={index} className="text-lg font-bold text-blue-800 mt-3">
            {line.replace(/\*{1,2}/g, '')}
          </h3>
        );
      }
      
      // Render bullet points (with more flexible matching)
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={index} className="flex items-start mt-1">
            <span className="text-blue-600 mr-2 mt-1">•</span>
            <p className="text-gray-700 flex-1">{line.replace(/^[•-]\s*/, '').trim()}</p>
          </div>
        );
      }
      
      // Render regular text
      return (
        <p key={index} className="text-gray-700 mt-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="bg-blue-600 text-white p-2 rounded-full inline-flex items-center mb-8">
            <Rocket className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">חדש! גרסה 2.0 זמינה עכשיו</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            הדרך המהירה ביותר להגשים את החלום שלך
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            פלטפורמה חדשנית שעוזרת לך להפוך את הרעיון שלך למציאות. עם הכלים המתקדמים שלנו, תוכל להתחיל לבנות את העתיד כבר היום.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/chat')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
            >
              התחל עכשיו
              <ArrowRight className="mr-2 h-5 w-5" />
            </button>
            <button 
              onClick={handleAiInteraction}
              className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold border border-gray-200 hover:border-gray-300 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading ? 'טוען...' : 'רעיונות סטארטאפ'}
              <Eye className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="mt-12 p-6 bg-white border border-blue-100 rounded-xl shadow-lg max-w-4xl mx-auto text-right">
              <div className="flex items-center mb-4">
                {error ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 ml-3" />
                ) : (
                  <Eye className="h-6 w-6 text-blue-600 ml-3" />
                )}
                <h3 className="text-xl font-semibold text-blue-900">
                  {error ? 'שגיאה בהפקת הרעיונות' : 'תצוגה מקדימה של רעיונות סטארטאפ'}
                </h3>
              </div>
              
              <div className={`p-4 rounded-lg ${error ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className="space-y-2">
                  {error ? (
                    <div>
                      <p className="text-red-700 mb-4">
                        {error}
                        <br />
                        <span className="text-sm text-gray-600">אנא נסה שוב או בדוק את הגדרות ה-API</span>
                      </p>
                      {retryCount < 3 && (
                        <button 
                          onClick={handleRetry}
                          className="flex items-center justify-center w-full bg-blue-100 text-blue-800 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          נסה שוב ({3 - retryCount} נסיונות נותרו)
                        </button>
                      )}
                    </div>
                  ) : (
                    renderPreviewText(aiResponse)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">מהיר ויעיל</h3>
            <p className="text-gray-600">התחל לעבוד תוך דקות עם הממשק האינטואיטיבי שלנו</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">קל לשימוש</h3>
            <p className="text-gray-600">ממשק משתמש ידידותי שמתאים לכל רמת מומחיות</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">תמיכה 24/7</h3>
            <p className="text-gray-600">צוות התמיכה שלנו זמין תמיד לעזור לך להצליח</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">מוכן להתחיל?</h2>
            <p className="text-xl mb-8 opacity-90">הצטרף לאלפי משתמשים מרוצים שכבר משתמשים בפלטפורמה שלנו</p>
            <form className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="הכנס את האימייל שלך"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                הירשם
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p> 2024 כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;