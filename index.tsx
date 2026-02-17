import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ParticipationProvider } from './contexts/ParticipationContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ParticipationProvider>
      <App />
    </ParticipationProvider>
  </React.StrictMode>
);