import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
const rootRender = createRoot(root);

rootRender.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
