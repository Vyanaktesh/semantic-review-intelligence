import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary:  '#1D4ED8',
          colorLink:     '#1D4ED8',
          colorInfo:     '#1D4ED8',
          colorWarning:  '#F59E0B',
          borderRadius:  8,
          borderRadiusLG: 12,
          fontFamily: 'Inter, ui-sans-serif, system-ui',
        },
        components: {
          Button: { borderRadius: 8 },
          Input:  { borderRadius: 8 },
          Card:   { borderRadius: 12 },
          Tabs:   { borderRadius: 8 },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
