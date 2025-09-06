import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

const AiLab: React.FC = () => {
  const [code, setCode] = useState(`// Welcome to AI Lab!
// Write your TypeScript/JavaScript code here

const greeting = "Hello, World!";
console.log(greeting);

// Try running some code:
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log("Sum:", sum);

// You can also define functions:
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log("Factorial of 5:", factorial(5));`);

  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showCodexSidebar, setShowCodexSidebar] = useState(false);
  const [codexPrompt, setCodexPrompt] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRunCode = () => {
    if (!iframeRef.current) return;

    setIsRunning(true);
    setOutput('');

    // Create a sandboxed execution environment
    const sandboxCode = `
      <html>
        <body>
          <script>
            let logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
              logs.push(args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '));
              originalLog.apply(console, args);
            };

            try {
              ${code}
            } catch (error) {
              console.log('Error:', error.message);
            }

            // Send results back to parent
            window.parent.postMessage({
              type: 'EXECUTION_RESULT',
              output: logs.join('\\n')
            }, '*');
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([sandboxCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
  };

  const handleCodexSubmit = async () => {
    if (!codexPrompt.trim()) return;

    // Stub for Codex API - simulate response
    const mockResponse = `// Codex suggestion based on: "${codexPrompt}"

function enhancedFunction() {
  // This is a placeholder suggestion
  console.log("Codex API integration coming soon!");
  return "Enhanced code here";
}

// Usage example:
enhancedFunction();`;

    setCode((prevCode) => prevCode + '\n\n' + mockResponse);
    setCodexPrompt('');
    setShowCodexSidebar(false);
  };

  const handleIframeMessage = (event: MessageEvent) => {
    if (event.data.type === 'EXECUTION_RESULT') {
      setOutput(event.data.output);
      setIsRunning(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">AI Lab</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 bg-cosmic-accent hover:bg-cosmic-highlight text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button
            onClick={() => setShowCodexSidebar(true)}
            className="px-4 py-2 bg-cosmic-light hover:bg-cosmic-accent text-white rounded-lg transition-colors"
          >
            Ask Codex
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex space-x-4">
        {/* Editor */}
        <div className="flex-1 bg-cosmic-dark rounded-lg overflow-hidden border border-cosmic-light">
          <Editor
            height="100%"
            language="typescript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="w-96 bg-cosmic-dark rounded-lg border border-cosmic-light p-4">
          <h3 className="text-white font-semibold mb-3">Output</h3>
          <div className="bg-black rounded p-3 h-96 overflow-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {output || 'Click "Run Code" to execute your code...'}
            </pre>
          </div>
        </div>
      </div>

      {/* Hidden iframe for sandboxed execution */}
      <iframe
        ref={iframeRef}
        className="hidden"
        sandbox="allow-scripts"
        title="Code Execution Sandbox"
      />

      {/* Codex Sidebar */}
      {showCodexSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-cosmic-dark rounded-lg p-6 w-96 max-w-full mx-4 border border-cosmic-light">
            <h3 className="text-white text-xl font-bold mb-4">Ask Codex</h3>
            <textarea
              value={codexPrompt}
              onChange={(e) => setCodexPrompt(e.target.value)}
              placeholder="Describe what you want to implement..."
              className="w-full h-32 bg-cosmic-light text-white rounded p-3 mb-4 resize-none"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCodexSidebar(false)}
                className="px-4 py-2 text-cosmic-light hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCodexSubmit}
                className="px-4 py-2 bg-cosmic-accent hover:bg-cosmic-highlight text-white rounded transition-colors"
              >
                Generate Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiLab;
