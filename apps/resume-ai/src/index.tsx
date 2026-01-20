import React from 'react';
import ReactDOM from 'react-dom/client';
import OfflineAIWriter from './components/OfflineAIWriter';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <OfflineAIWriter />
  </React.StrictMode>
);
