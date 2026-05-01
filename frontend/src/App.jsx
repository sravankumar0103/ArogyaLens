import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, Volume2, AlertTriangle, Pill, Globe, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:8000"; // Can be changed to network IP for mobile testing

function App() {
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [language, setLanguage] = useState('en');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        processImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (file) => {
    setStatus('processing');
    
    try {
      // 1. Send Image to OCR Endpoint
      const formData = new FormData();
      formData.append('file', file);

      const ocrResponse = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        throw new Error('Failed to upload image.');
      }
      const uploadData = await ocrResponse.json();
      
      // Get the file path saved on server
      const filePath = `uploads/${file.name}`;
      
      // Process OCR
      const extractResponse = await fetch(`${API_URL}/process/ocr?image_path=${encodeURIComponent(filePath)}`, {
        method: 'POST',
      });

      if (!extractResponse.ok) {
        throw new Error('OCR Processing failed.');
      }
      const ocrData = await extractResponse.json();

      // 2. Send Extracted Medicines to Explain Endpoint
      const explainResponse = await fetch(`${API_URL}/process/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicines: ocrData.medicines,
          target_lang: language
        })
      });

      if (!explainResponse.ok) {
        throw new Error('Explanation Engine failed.');
      }
      const explainData = await explainResponse.json();

      setResults({ 
        medicines: ocrData.medicines, 
        explanation: explainData,
        raw_text: ocrData.raw_text
      });
      setStatus('complete');
      
    } catch (error) {
      console.error(error);
      alert("Error processing document: " + error.message);
      setStatus('idle');
    }
  };

  const resetApp = () => {
    setImagePreview(null);
    setResults(null);
    setStatus('idle');
  };

  const playAudio = () => {
    if (results?.explanation?.audio_url) {
      const audio = new Audio(API_URL + results.explanation.audio_url);
      audio.play();
    } else {
      // Fallback browser TTS for demo purposes
      const utterance = new SpeechSynthesisUtterance(results.explanation.simple_explanation);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="container">
      {/* Top Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
          Arogya<span className="text-gradient">Lens</span>
        </h2>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}>
          <Globe size={18} /> {language.toUpperCase()}
        </button>
      </header>

      {/* Main Content */}
      {status === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <h1>Understand Your <span className="text-gradient">Medicine</span></h1>
          <p className="subtitle" style={{ margin: '0 auto 3rem auto' }}>
            Upload a prescription or medicine strip. We'll decode the complex terms and explain it simply in your language.
          </p>

          <div className="glass-panel upload-area" onClick={() => cameraInputRef.current.click()}>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="upload-input" 
              ref={cameraInputRef}
              onChange={handleFileChange}
            />
            <Camera size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 className="mb-2" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Tap to Open Camera</h3>
            <p style={{ color: 'var(--text-muted)' }}>Best for mobile users</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ margin: '0 1rem', fontSize: '0.9rem' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => fileInputRef.current.click()}>
            <UploadCloud size={20} /> Upload from Storage
          </button>
          <input 
            type="file" 
            accept="image/*" 
            className="upload-input" 
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      )}

      {status === 'processing' && (
        <div className="glass-panel processing-container">
          <div className="radar-spinner"></div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Analyzing Document...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Extracting medicine data and checking safety.</p>
        </div>
      )}

      {status === 'complete' && results && (
        <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Results</h2>
            <button className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '50%' }} onClick={playAudio}>
              <Volume2 size={24} />
            </button>
          </div>

          {results.explanation.warnings && (
            <div className="warning-card">
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Safety Warning</h4>
                <p>{results.explanation.warnings}</p>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '1px' }}>
              Simple Explanation
            </h4>
            <p style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>{results.explanation.simple_explanation}</p>
          </div>

          <h4 className="mb-4" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '1px' }}>Medicines Identified</h4>
          {results.medicines.map((med, idx) => (
            <div key={idx} className="med-card">
              <div className="med-icon"><Pill size={24} /></div>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{med.name}</h4>
                <p style={{ color: 'var(--text-muted)' }}>{med.dosage} • {med.frequency}</p>
              </div>
            </div>
          ))}

          <button className="btn btn-secondary mt-8" style={{ width: '100%' }} onClick={resetApp}>
            <RefreshCw size={20} /> Scan Another
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
