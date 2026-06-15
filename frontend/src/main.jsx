import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      {/* BUG FIX (Issue 4): SocketProvider manages the socket.io connection
          using useRef — kept outside Redux to avoid non-serializable warnings */}
      <SocketProvider>
        <App />
      </SocketProvider>
    </Provider>
  </BrowserRouter>
)
