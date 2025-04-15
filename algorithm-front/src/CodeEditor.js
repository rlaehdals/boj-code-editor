import React, { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
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
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current?.editor;
    if (!editor) return;

    editor.commands.addCommand({
      name: 'deleteCurrentLine',
      bindKey: { win: 'Ctrl-X', mac: 'Cmd-X' },
      exec: (editor) => {
        const range = editor.getSelectionRange();
        if (range.isEmpty()) {
          editor.removeLines();
        } else {
          document.execCommand('cut');
        }
      },
    });
  }, []);

  useEffect(() => {
    setCode(defaultCode[language]);
  }, [language]);

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
      alert("모든 테스트 케이스에 입력값과 출력값을 입력해주세요.");
      return;
    }

    setResultsVisible(true);
    const updated = testCases.map(tc => ({ ...tc, loading: true, result: null }));
    setTestCases(updated);

    const results = await Promise.all(
      updated.map(async (tc) => {
        try {
          const res = await fetch('https://dkim-boj-code-edit.p-e.kr/api/codes', {
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
              errorMessage: '네트워크 오류',
            },
          };
        }
      })
    );

    setTestCases(results);
  };

  const getResultStatus = (r) => {
    if (!r) return null;
    if (r.errorMessage) return 'error';
    return r.expected.trim() === r.actual?.trim() ? 'success' : 'fail';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => alert('코드가 복사되었습니다!'))
      .catch(() => alert('복사에 실패했습니다.'));
  };

  return (
    <div className="code-editor-container">
      <div className="code-section">
        <h2>코드 입력</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <button
            onClick={copyCode}
            style={{
              backgroundColor: '#2d2d2d',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              height: '32px',
            }}
          >
            📋 코드 복사
          </button>
          <button
            onClick={() => setAutocomplete((prev) => !prev)}
            style={{
              backgroundColor: '#2d2d2d',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              height: '32px',
            }}
          >
            ⚙️ 자동완성 {autocomplete ? '끄기' : '켜기'}
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              backgroundColor: '#2d2d2d',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              height: '32px', // 버튼 높이에 맞춤
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option> {/* JavaScript 추가 */}
          </select>
        </div>
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
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
        />
      </div>

      <div className="action-section">
        <button className="modal-btn" onClick={() => setShowModal(true)}>테스트 케이스 설정</button>
        <button className="run-btn" onClick={runCode} disabled={testCases.length === 0}>코드 실행</button>
      </div>

      {resultsVisible && testCases.some(tc => tc.result || tc.loading) && (
        <div className="results-section">
          <h2>결과</h2>
          {testCases.map((tc, i) => {
            const r = tc.result;
            const status = getResultStatus(r);
            if (!r && !tc.loading) return null;
            return (
              <div key={i} className={`result-card ${status}`}>
                {tc.loading ? (
                  <div className="loading">⏳ 실행 중...</div>
                ) : (
                  <>
                    <ResultBlock label="입력값" value={r.input} />
                    <ResultBlock label="기대한 출력" value={r.expected} />
                    {r.actual !== null && <ResultBlock label="실제 출력" value={r.actual} />}
                    {status === 'error' && (
                      <ResultBlock label="에러 메시지" value={r.errorMessage} isError />
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
              alert("모든 테스트 케이스에 입력값과 출력값을 입력해주세요.");
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
      <h3>테스트 케이스 설정</h3>
      {testCases.map((tc, i) => (
        <div key={i} className="modal-testcase-row">
          <textarea
            placeholder="입력값"
            value={tc.input}
            onChange={(e) => onChange(i, 'input', e.target.value)}
            className={tc.input === '' ? 'input-error' : ''}
            rows={3}
          />
          <textarea
            placeholder="출력값"
            value={tc.output}
            onChange={(e) => onChange(i, 'output', e.target.value)}
            className={tc.output === '' ? 'input-error' : ''}
            rows={3}
          />
          <button className="delete-btn" onClick={() => onRemove(i)}>❌</button>
        </div>
      ))}
      <button className="add-btn" onClick={onAdd}>+ 테스트 케이스 추가</button>
      <div className="modal-actions">
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  </div>
);

export default CodeEditor;
