import React, { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import prettier from "prettier/standalone";
import * as parserBabel from "prettier/parser-babel";
import estreePlugin from "prettier/plugins/estree";
import './CodeEditor.css';

const defaultCode = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
  python: `print("Hello World")`,
  javascript: `console.log("Hello World")`,
};

const languageLabel = {
  java: 'JAVA',
  python: 'PYTHON',
  javascript: 'JAVASCRIPT',
};

const CodeEditor = () => {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(defaultCode['java']);
  const [autocomplete, setAutocomplete] = useState(true);
  const [testCases, setTestCases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [formatError, setFormatError] = useState(null);
  const [showError, setShowError] = useState(false);
  const editorRef = useRef(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (formatError) setShowError(true);
  }, [formatError]);

  useEffect(() => {
    const editor = editorRef.current?.editor;
    if (!editor) return;

    editor.commands.addCommand({
      name: 'deleteCurrentLine',
      bindKey: { win: 'Ctrl-X', mac: 'Cmd-X' },
      exec: (editor) => {
        const range = editor.getSelectionRange();
        if (range.isEmpty()) editor.removeLines();
        else document.execCommand('cut');
      },
    });
  }, []);

  useEffect(() => {
    setCode(defaultCode[language]);
  }, [language]);

  const extractCoreErrorMessage = (rawError) => {
    if (!rawError) return 'Unknown Error';
    if (language === 'python') {
      const match = rawError.match(/Cannot parse:[^\n]*/);
      return match ? match[0] : rawError.split('\n')[0];
    }
    return rawError;
  };

  const formatCode = async () => {
    setFormatError(null);
    setIsFormatting(true);
    if (language === 'javascript') {
      try {
        const formatted = await prettier.format(code, {
          parser: "babel",
          plugins: [parserBabel, estreePlugin],
        });
        if (typeof formatted === 'string') setCode(formatted);
        else setFormatError('Formatting Error');
      } catch (error) {
        setFormatError(`JavaScript 포맷팅 오류: ${error.message || 'Unknown Error'}`);
      } finally {
        setIsFormatting(false);
      }
    } else {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:8080/codes/format', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: languageLabel[language] }),
        });
        const data = await res.json();
        if (typeof data?.data?.formattedCode === 'string') {
          setCode(data.data.formattedCode);
        } else {
          const rawError = data?.data?.errorMessage || data.message || data.stderr || JSON.stringify(data);
          setFormatError(`Formatting Failed: ${extractCoreErrorMessage(rawError)}`);
        }
      } catch (error) {
        setFormatError(`Formatting Failed: ${error.message || 'Unknown Error'}`);
      } finally{
        setIsFormatting(false);
      }
    }
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '', result: null, loading: false }]);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const validateTestCases = () => testCases.every(tc => tc.input.trim() && tc.output.trim());

  const runCode = async () => {
    if (!validateTestCases()) {
      alert("Please enter both input and output for all test cases.");
      return;
    }

    setResultsVisible(true);
    setIsRunning(true);
    const updated = testCases.map(tc => ({ ...tc, loading: true, result: null }));
    setTestCases(updated);

    const results = await Promise.all(updated.map(async (tc) => {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:8080/codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            input: tc.input,
            expectedAnswer: tc.output,
            language: languageLabel[language],
          }),
        });
        const data = await res.json();
        return {
          ...tc,
          loading: false,
          result: {
            input: tc.input,
            expected: data.data.expectedAnswer,
            actual: data.data.realAnswer,
            errorMessage: data.data.errorMessage,
          },
        };
      } catch {
        return {
          ...tc,
          loading: false,
          result: {
            input: tc.input,
            expected: tc.output,
            actual: null,
            errorMessage: 'Network error',
          },
        };
      }
    }));
    setIsRunning(false);
    setTestCases(results);
  };

  const getResultStatus = (r) => {
    if (!r) return null;
    if (r.errorMessage) return 'error';
    return r.expected.trim() === r.actual?.trim() ? 'success' : 'fail';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => alert('Code copied successfully!'))
      .catch(() => alert('Failed to copy the code.'));
  };

  return (
    <div className="code-editor-container">
      <div className="code-section">
        <h2>Code Input</h2>
        <div className="button-row">
          <button className="btn btn-copy" onClick={copyCode}>:clipboard: Copy Code</button>
          <button className="btn btn-format" onClick={formatCode} disabled={isFormatting}>:wrench: Format Code</button>
          <button className="btn btn-autocomplete" onClick={() => setAutocomplete(prev => !prev)}>
            :gear: Autocomplete {autocomplete ? 'Off' : 'On'}
          </button>
          <select
            className="btn btn-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        {showError && formatError && (
          <div className="error-box">
            <div><strong>Error:</strong> {formatError}</div>
            <button className="close-btn" onClick={() => setShowError(false)}>✕</button>
          </div>
        )}

        <AceEditor
          mode={language}
          theme="monokai"
          name="code-editor"
          value={code}
          onChange={setCode}
          ref={editorRef}
          width="100%"
          fontSize={14}
          minLines={15}
          maxLines={Infinity}
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            enableBasicAutocompletion: autocomplete,
            enableLiveAutocompletion: autocomplete,
            enableSnippets: true,
            tabSize: 4,
            useWorker: false,
          }}
        />
      </div>

      <div className="action-section">
        <button className="modal-btn" onClick={() => setShowModal(true)}>Test Case Settings</button>
        <button className="run-btn" onClick={runCode} disabled={testCases.length === 0 || isRunning}>Run Code</button>
      </div>

      {resultsVisible && testCases.some(tc => tc.result || tc.loading) && (
        <div className="results-section">
          <h2>Results</h2>
          {testCases.map((tc, i) => {
            const r = tc.result;
            const status = getResultStatus(r);
            if (!r && !tc.loading) return null;
            return (
              <div key={i} className={`result-card ${status}`}>
                {tc.loading ? (
                  <div className="loading">:hourglass_flowing_sand: Running...</div>
                ) : (
                  <>
                    <ResultBlock label="Input" value={r.input} />
                    <ResultBlock label="Expected Output" value={r.expected} />
                    {r.actual !== null && <ResultBlock label="Actual Output" value={r.actual} />}
                    {status === 'error' && (
                      <ResultBlock label="Error Message" value={r.errorMessage} isError />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TestCaseModal
          testCases={testCases}
          onChange={handleTestCaseChange}
          onAdd={addTestCase}
          onRemove={removeTestCase}
          onClose={() => {
            if (!validateTestCases()) {
              alert("Please enter both input and output for all test cases.");
              return;
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const ResultBlock = ({ label, value, isError }) => (
  <div className="result-block">
    <div className="result-label">{label}</div>
    <pre className={`result-content ${isError ? 'error-text' : ''}`}>{value}</pre>
  </div>
);

const TestCaseModal = ({ testCases, onChange, onAdd, onRemove, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Test Case Settings</h3>
      {testCases.map((tc, i) => (
        <div key={i} className="modal-testcase-row">
          <textarea
            placeholder="Input"
            value={tc.input}
            onChange={(e) => onChange(i, 'input', e.target.value)}
            className={tc.input === '' ? 'input-error' : ''}
            rows={3}
          />
          <textarea
            placeholder="Output"
            value={tc.output}
            onChange={(e) => onChange(i, 'output', e.target.value)}
            className={tc.output === '' ? 'input-error' : ''}
            rows={3}
          />
          <button className="delete-btn" onClick={() => onRemove(i)}>❌</button>
        </div>
      ))}
      <button className="add-btn" onClick={onAdd}>+ Add Test Case</button>
      <div className="modal-actions">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

export default CodeEditor;