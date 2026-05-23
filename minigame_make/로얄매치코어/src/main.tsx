/**
 * main.tsx — React 엔트리 포인트
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { App } from './App.js';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
