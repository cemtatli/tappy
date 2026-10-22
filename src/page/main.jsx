import { createRoot } from 'react-dom/client';
import './app.css';
import { GlassProvider } from './components/glassyui/glass-provider';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(
  <GlassProvider defaultTheme="light">
    <App />
  </GlassProvider>
);
