import "./index.css"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SearchAppBar } from "./App.jsx"
import { AppContextProvider } from "./AppContext.jsx"

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AppContextProvider>
            <SearchAppBar />
        </AppContextProvider>
    </StrictMode>
)
