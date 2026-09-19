import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/zilla-slab/latin-500.css';
import '@fontsource/zilla-slab/latin-600.css';
import '@fontsource/zilla-slab/latin-700.css';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import './styles/app.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
