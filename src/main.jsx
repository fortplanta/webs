import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import { theme } from './theme.js';

createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={theme}>
    <App />
  </ConfigProvider>
);
