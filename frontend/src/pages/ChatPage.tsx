import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatMessage } from '../components/ChatMessage';
import { Message, Conversation } from '../types';
import { Send, ArrowLeft, Maximize2, Minimize2, ExternalLink, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateResponse } from '../services/openaiService';

function ChatPage() {
  const navigate = useNavigate();

  // We’ll store multiple conversations but focus on the "current" one
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // The user’s current typed input
  const [prompt, setPrompt] = useState('');

  // Preview states
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  // Track which "step" we’re on in the Q&A sequence
  const [currentStep, setCurrentStep] = useState(0);

  // Store answers to the four questions
  const [siteType, setSiteType] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteColors, setSiteColors] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Step-based questions in Hebrew (adjust text as needed)
  const questions = [
    'איזה סוג אתר תרצה לבנות?',
    'מהו שם האתר?',
    'אילו צבעים מועדפים?',
    'תאר את האתר בפירוט.'
  ];
  const unsplashImageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(siteType)}`;

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Update preview when the last assistant message includes HTML
  useEffect(() => {
    if (currentConversation?.messages.length) {
      const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.preview) {
        setPreviewContent(lastMessage.preview);
      }
    }
  }, [currentConversation?.messages]);

  // Create a new conversation and immediately ask the first question
  const createNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'צ׳אט חדש',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversation(newConversation);
    setSiteType('');
    setSiteName('');
    setSiteColors('');
    setSiteDescription('');
    setCurrentStep(0);

    // Add the first question from the "assistant"
    const firstQuestion: Message = {
      role: 'assistant',
      content: questions[0],
      timestamp: Date.now(),
    };
    const updatedConversation = {
      ...newConversation,
      messages: [firstQuestion],
      updatedAt: Date.now(),
    };
    setConversations([updatedConversation, ...conversations]);
    setCurrentConversation(updatedConversation);
  };

  /**
   * Build the final prompt once we have all four answers
   */
  const buildFinalPrompt = (): string => {
    const unsplashImageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(siteType)}`;

    return `
צור עמוד HTML מלא על בסיס הפרטים:
1. סוג האתר: ${siteType}
2. שם האתר: ${siteName}
3. צבעים מועדפים: ${siteColors}
4. תיאור האתר: ${siteDescription}

STRICT REQUIREMENTS:
- Create a hero section with a prominent image
- Use this specific image URL: ${unsplashImageUrl}
- If the image doesn't load, use a placeholder image
- Include an <img> tag with explicit width and height
- Alt text must describe the site type
- Fully responsive design
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
        alt="Image representing ${siteType}" 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !currentConversation) return;

    // 1) Add the user’s answer to the conversation
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    let updatedConversation: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((conv) => (conv.id === currentConversation.id ? updatedConversation : conv))
    );
    setCurrentConversation(updatedConversation);
    setPrompt('');

    // 2) Store answer in the relevant state
    if (currentStep === 0) {
      setSiteType(prompt);
    } else if (currentStep === 1) {
      setSiteName(prompt);
    } else if (currentStep === 2) {
      setSiteColors(prompt);
    } else if (currentStep === 3) {
      setSiteDescription(prompt);
    }

    // 3) Move to the next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // If we haven’t reached the last question, show the next question
    if (nextStep < questions.length) {
      const nextQuestionMessage: Message = {
        role: 'assistant',
        content: questions[nextStep],
        timestamp: Date.now(),
      };
      updatedConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, nextQuestionMessage],
        updatedAt: Date.now(),
      };
      setConversations((prev) =>
        prev.map((conv) => (conv.id === currentConversation.id ? updatedConversation : conv))
      );
      setCurrentConversation(updatedConversation);
      return;
    }

    // 4) If all four answers are gathered, build the final prompt and call the API
    if (nextStep === questions.length) {
      try {
        const finalPrompt = buildFinalPrompt();

        // System/assistant message to confirm we're now sending the request
        const finalRequestMessage: Message = {
          role: 'assistant',
          content: 'מעבד את כל הפרטים ובונה עבורך אתר...',
          timestamp: Date.now(),
        };
        updatedConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, finalRequestMessage],
          updatedAt: Date.now(),
        };
        setConversations((prev) =>
          prev.map((conv) => (conv.id === currentConversation.id ? updatedConversation : conv))
        );
        setCurrentConversation(updatedConversation);

        // Call OpenAI
        const aiResponse = await generateResponse(finalPrompt);

        const generatedHtml = aiResponse?.choices?.[0]?.message?.content || '';
        const assistantMessage: Message = {
          role: 'assistant',
          timestamp: Date.now(),
          content: 'הנה האתר שנוצר:',
          // Use `preview` to show the generated HTML in the right pane
          preview: generatedHtml
        };

        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, assistantMessage],
          updatedAt: Date.now(),
        };

        setConversations((prev) =>
          prev.map((conv) => (conv.id === currentConversation.id ? finalConversation : conv))
        );
        setCurrentConversation(finalConversation);
      } catch (error: any) {
        const errorMessage: Message = {
          role: 'assistant',
          content: `❌ Error: ${error.message}`,
          timestamp: Date.now(),
          preview: 'An error occurred while generating the response.'
        };

        const errorConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, errorMessage],
          updatedAt: Date.now(),
        };

        setConversations((prev) =>
          prev.map((conv) => (conv.id === currentConversation.id ? errorConversation : conv))
        );
        setCurrentConversation(errorConversation);
      }
    }
  };

  // Expand/collapse preview
  const togglePreview = () => {
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  // Open preview in new tab
  const openInNewTab = () => {
    if (previewContent) {
      // Create a new Blob so the user can see the generated HTML in a new tab
      const htmlBlob = new Blob([previewContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(htmlBlob);
      window.open(blobUrl, '_blank');
    }
  };

  /**
   * Download the generated HTML as 'index.html'
   */
  const handleDownload = () => {
    if (!previewContent) return;

    // Build a minimal HTML document wrapper
    const fullHtmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteName || 'My Website'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      font-family: 'Inter', sans-serif; 
      line-height: 1.6;
      background-color: #f9fafb;
    }
  </style>
</head>
<body>
  ${previewContent}
</body>
</html>
    `;

    // Create the Blob object
    const fileBlob = new Blob([fullHtmlDocument], { type: 'text/html' });
    const fileUrl = URL.createObjectURL(fileBlob);

    // Create an anchor link and programmatically click to download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up our Object URL
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      <Sidebar
        conversations={conversations}
        onNewChat={createNewChat}
        onSelectChat={(id) => setCurrentConversation(conversations.find((c) => c.id === id) || null)}
        selectedId={currentConversation?.id}
      />

      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className={`flex flex-col ${isPreviewExpanded ? 'hidden' : 'flex-1'}`}>
          <div className="bg-white p-4 border-b flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 ml-2" />
              חזרה לדף הבית
            </button>
            <button
              onClick={togglePreview}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <Maximize2 className="h-5 w-5 ml-2" />
              הרחב תצוגה מקדימה
            </button>
          </div>

          {currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {currentConversation.messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                <div className="flex gap-4 max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      currentStep < questions.length
                        ? 'הקלד תשובה...' 
                        : 'המתן לתוצאת האתר או שאל שאלה נוספת...'
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ברוכים הבאים לצ׳אט</h1>
                <p className="text-gray-600 mb-4">התחל צ׳אט חדש כדי להתחיל</p>
                <button
                  onClick={createNewChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  צור צ׳אט חדש
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div
          className={`border-r border-gray-200 bg-white relative ${
            isPreviewExpanded ? 'w-full' : 'w-1/2'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">תצוגה מקדימה</h2>
            <div className="space-x-3 flex">
              {/* Open in new tab */}
              {previewContent && (
                <button
                  onClick={openInNewTab}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ExternalLink className="h-5 w-5 ml-2" />
                  פתח בלשונית חדשה
                </button>
              )}

              {/* Download HTML */}
              {previewContent && (
                <button
                  onClick={handleDownload}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <Download className="h-5 w-5 ml-2" />
                  הורד HTML
                </button>
              )}

              {/* Expand/Collapse */}
              <button
                onClick={togglePreview}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                {isPreviewExpanded ? (
                  <>
                    <Minimize2 className="h-5 w-5 ml-2" />
                    צמצם תצוגה מקדימה
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-5 w-5 ml-2" />
                    הרחב תצוגה מקדימה
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-65px)] w-full">
            {previewContent ? (
              <div
                className="w-full h-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <p>אין תצוגה מקדימה זמינה</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
