// openAIClient.ts
import OpenAI from 'openai';

// OpenAIResponse.ts
export interface OpenAIResponseChoice {
  message: {
    content: string | null;
    role: string;
  };
  index: number;
  finish_reason: string | null;
}

export interface OpenAIResponse {
  text: any;
  content: any;
  choices: OpenAIResponseChoice[];
  // Add other properties as needed (e.g., usage)
}

// Detailed logging utility
export const logOpenAIRequest = (prompt: string) => {
  console.group(' OpenAI API Request Diagnostics');
  console.log('Prompt:', prompt);
  console.log('Environment Variables:');
  console.log('API Key Present:', !!import.meta.env.VITE_OPENAI_API_KEY);
  console.log('API Key Length:', import.meta.env.VITE_OPENAI_API_KEY?.length || 0);
  console.log(
    'API Key (first 5 chars):',
    import.meta.env.VITE_OPENAI_API_KEY
      ? import.meta.env.VITE_OPENAI_API_KEY.substring(0, 5) + '...'
      : 'No key'
  );
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

// Comprehensive error logging utility
export const logOpenAIError = (error: any) => {
  console.group(' OpenAI API Error Diagnostics');
  console.error('Full Error Object:', error);
  console.log('Error Name:', error.name);
  console.log('Error Message:', error.message);
  console.log('Error Code:', error.code);
  console.log('Status Code:', error.status);
  console.log('Type:', error.type);
  console.log('Param:', error.param);
  console.log('Timestamp:', new Date().toISOString());

  // Additional context for common OpenAI errors
  if (error.message && error.message.includes('API key')) {
    console.warn(' API Key Issue Detected');
    console.log('Possible Causes:');
    console.log('- API key is invalid');
    console.log('- API key has expired');
    console.log('- API key lacks required permissions');
  }

  console.groupEnd();
};

// Option 1: Using the official OpenAI Node.js library
export const openaiClient = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,  // Only for client-side usage
});

/**
 * If you want to use the official OpenAI client, you can do:
 *
 * const response = await openaiClient.chat.completions.create({
 *   model: 'gpt-3.5-turbo',
 *   messages: [
 *     { role: 'system', content: 'System message...' },
 *     { role: 'user', content: prompt }
 *   ],
 *   max_tokens: 300,
 * });
 *
 * Then the returned object is typed by the `openai` library.
 * Example:
 * const content = response.choices[0].message.content;
 */

// Option 2: Using native fetch API to call the OpenAI REST API
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const generateResponse = async (
  prompt: string, 
  previousMessages: ChatMessage[] = []
): Promise<OpenAIResponse> => {
  try {
    console.log('Generating response with prompt:', prompt);
    console.log('Previous messages count:', previousMessages.length);
    console.log('API Key present:', !!import.meta.env.VITE_OPENAI_API_KEY);
    
    // Prepare messages with previous context and new prompt
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: 'You are an expert web developer and AI assistant. Always provide complete, production-ready solutions. When asked to improve or fix code, carefully analyze the previous context and provide precise, implementable suggestions.' 
      },
      ...previousMessages,  // Include previous conversation context
      { 
        role: 'user', 
        content: `Generate a complete, production-ready HTML landing page for a website based on this description: ${prompt}. 
        Requirements:
        - Fully responsive Tailwind CSS design
        - Show a preview of the website IN FULL size in the browser
        - Clean, professional-looking design
        - Semantic HTML5 structure
        - Engaging, concise content
        - Attractive, cohesive color palette
        - Clean typography
        - Subtle animations and interactions`
      }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 2500,  // Increased to allow more detailed responses
        temperature: 0.7
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Full error response:', errorData);
      throw new Error(`OpenAI API error: ${errorData || response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    console.log('Received data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Complete error in generateResponse:', error);
    logOpenAIError(error);
    throw error;
  }
};

// Comprehensive configuration check
export function checkOpenAIConfiguration() {
  console.group(' OpenAI Configuration Comprehensive Check');
  
  // Check API Key
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log('API Key Status:');
  console.log('- Present:', !!apiKey);
  console.log('- Length:', apiKey?.length || 0);
  console.log('- First 5 chars:', apiKey ? apiKey.substring(0, 5) + '...' : 'N/A');
  
  // Check environment
  console.log('\nEnvironment:');
  console.log('- Mode:', import.meta.env.MODE);
  console.log('- Prod:', import.meta.env.PROD);
  console.log('- Dev:', import.meta.env.DEV);
  
  console.groupEnd();
  
  // Return a boolean for programmatic use
  return !!apiKey;
}
