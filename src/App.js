import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Generative AI client with your API key
const API_KEY = 'AIzaSyDo34CgnUM1BGN9_Mo2TM-VTCRx698p5q4';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  tools: [
    {
      codeExecution: {},
    },
  ],
});

const App = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // Function to handle query submission
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await model.generateContent(query);
      setResponse(result.response.text());
    } catch (error) {
      console.error('Error generating content:', error);
      setResponse('An error occurred while generating the response.');
    } finally {
      setLoading(false);
    }
  };

  // Voice input functionality
  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery((prevQuery) => `${prevQuery} ${transcript}`.trim());
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognition.start();
  };

  // Extract all code blocks or fallback to raw text
  const extractCodeBlocks = (text) => {
    const matches = [...text.matchAll(/```([a-zA-Z]*)\n([\s\S]*?)```/g)];
    if (matches.length > 0) {
      return matches.map((match) => ({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      }));
    }

    // Fallback: Attempt to detect indented code-like blocks
    const lines = text.split('\n');
    const potentialCode = lines.filter((line) => line.startsWith('    ') || line.trim().length > 0);
    if (potentialCode.length > 0) {
      return [
        {
          language: 'plaintext',
          code: potentialCode.join('\n').trim(),
        },
      ];
    }

    return [];
  };

  const codeBlocks = extractCodeBlocks(response);

  // Function to copy code to clipboard
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  // Extract and display the non-code text from the response
  const extractTextResponse = (text) => {
    return text.replace(/```[\s\S]*?```/g, '').trim();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1> Accurate results/No History saving</h1>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter the problem + language like(c,python or java)"
        rows={5}
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          onClick={handleGenerate}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '30px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'HelloCode'}
        </button>
        <button
          onClick={handleVoiceInput}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '30px',
            border: 'none',
            backgroundColor: listening ? '#ff4d4d' : '#007bff',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {listening ? 'Listening...' : '🎤 Speak'}
        </button>
      </div>
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>AI Response:</h3>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '16px' }}>
            {extractTextResponse(response)}
          </p>
          {codeBlocks.length > 0 ? (
            codeBlocks.map((block, index) => (
              <div key={index} style={{ position: 'relative', marginTop: '10px' }}>
                <h4>Code Example ({block.language}):</h4>
                <pre
                  style={{
                    backgroundColor: '#f4f4f4',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    overflowX: 'auto',
                    position: 'relative',
                  }}
                >
                  <code>
                    {block.code}
                  </code>
                </pre>
                <button
                  onClick={() => handleCopy(block.code)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    borderRadius: '3px',
                  }}
                >
                  Copy Code
                </button>
              </div>
            ))
          ) : (
            <p style={{ marginTop: '20px', fontSize: '16px' }}>
              No code blocks found in the response.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
