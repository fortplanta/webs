import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import { theme as baseTheme } from './theme.js';
import useGlassTheme from './glassTheme.js';

function Root() {
  const glassConfig = useGlassTheme();

  // Merge: base tokens first, glass overrides on top (glass wins on shape/motion)
  const config = {
    ...glassConfig,
    theme: {
      ...glassConfig.theme,
      token: {
        ...baseTheme.token,          // our brand colors, font, spacing
        ...glassConfig.theme?.token, // glass shape + motion overrides
      },
      components: {
        ...baseTheme.components,     // our component-level tokens
      },
    },
  };

  return (
    <ConfigProvider {...config}>
      <App />
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
