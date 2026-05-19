import { createRoot } from 'react-dom/client';
import App from './App';
import { Demo } from './components/Demo';

const isDemo = new URLSearchParams(window.location.search).has('demo');

createRoot(document.getElementById('root')).render(isDemo ? <Demo /> : <App />);
