import React, { useState } from 'react';
import { generateResponse } from '../services/openaiService'; 
// ^ You need to implement this; it calls your server which in turn calls OpenAI

type SectionType = {
  id: string;
  title: string;
  description: string;
};

// Minimal example
function GammaLikePage() {
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 Output: We store the array of sections from the AI
  const [sections, setSections] = useState<SectionType[]>([]);
  
  // Step 2 Output: Once user finalizes, we store the final HTML (example approach)
  const [finalHtml, setFinalHtml] = useState('');

  // 1) The user clicks "Generate Outline" to get the sections from OpenAI
  const handleGenerateOutline = async () => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setError('');
    setSections([]);
    setFinalHtml('');

    try {
      // This calls your server -> which calls OpenAI
      // The AI's response should be JSON with { sections: [...] }
      const aiResponse = await generateResponse(userPrompt);

      // Assuming aiResponse has a 'content' or 'text' property with the JSON string
      const data = JSON.parse(aiResponse.content || aiResponse.text);
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('No "sections" found in AI response');
      }
      setSections(data.sections);
    } catch (err: any) {
      setError(err.message || 'Failed to generate sections');
    } finally {
      setIsLoading(false);
    }
  };

  // Move section up or down in the array
  const moveSectionUp = (index: number) => {
    if (index === 0) return; // already top
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections);
  };
  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return; // already bottom
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    setSections(newSections);
  };

  // 2) After reordering, we finalize the site
  //    You can either build the final HTML yourself or do a second AI call
  //    We'll do a simple example: build a minimal <html> out of the sections
  const handleFinalize = async () => {
    setError('');
    setIsLoading(true);
    setFinalHtml('');

    try {
      /**
       * Example approach #1: Build final HTML on the client
       *   For each section, we create some minimal HTML.
       *   In a real scenario, you might do a second call to OpenAI:
       *     "Given these final sections (with content), produce a full-coded site."
       */
      let bodyContent = '';
      sections.forEach((s) => {
        bodyContent += `
          <section id="${s.id}" style="padding:2rem; border-bottom:1px solid #ccc;">
            <h2>${s.title}</h2>
            <p>${s.description}</p>
          </section>
        `;
      });

      const doc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Generated Site</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 0; }
    section { margin: 0 auto; max-width: 800px; }
    h2 { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>
      `.trim();

      setFinalHtml(doc);

      // Alternatively, if you want a second AI call:
      //   const secondPrompt = buildSecondPrompt(sections);
      //   const secondResponse = await generateResponse(secondPrompt);
      //   setFinalHtml(secondResponse);
    } catch (err: any) {
      setError(err.message || 'Error finalizing website');
    } finally {
      setIsLoading(false);
    }
  };

  // Download final HTML as index.html
  const handleDownload = () => {
    if (!finalHtml) return;
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Gamma-like Website Generator</h1>
      {/* Step 1: Prompt input */}
      <div className="max-w-2xl bg-white p-6 rounded shadow mb-6">
        <label className="block text-gray-700 mb-2">
          Describe your website:
        </label>
        <textarea
          className="border w-full p-3 rounded mb-4"
          rows={3}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="e.g., I want a personal portfolio with about me, projects, and contact..."
        />
        <button
          onClick={handleGenerateOutline}
          disabled={isLoading || !userPrompt.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Outline'}
        </button>
        {error && <div className="text-red-600 mt-3">{error}</div>}
      </div>

      {/* Step 1 Output: The sections array. We let user reorder. */}
      {sections.length > 0 && (
        <div className="max-w-2xl bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Website Sections</h2>
          <ul>
            {sections.map((sec, index) => (
              <li
                key={sec.id}
                className="flex items-center justify-between p-2 border-b last:border-none"
              >
                <div>
                  <strong>{sec.title}</strong>
                  <p className="text-sm text-gray-500">{sec.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveSectionUp(index)}
                    className="px-2 py-1 bg-gray-200 rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSectionDown(index)}
                    className="px-2 py-1 bg-gray-200 rounded"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handleFinalize}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded"
          >
            Generate Final Website
          </button>
        </div>
      )}

      {/* Step 2 Output: The final HTML. Display & offer download. */}
      {finalHtml && (
        <div className="max-w-4xl bg-white p-6 rounded shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Final HTML</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Download
            </button>
          </div>
          {/* Render final HTML as text or in an iframe */}
          <iframe
            className="w-full h-96 border"
            title="Final Website Preview"
            srcDoc={finalHtml}
          />
        </div>
      )}
    </div>
  );
}

export default GammaLikePage;
