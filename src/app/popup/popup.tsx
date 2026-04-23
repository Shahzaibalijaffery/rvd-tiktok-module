import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import PopupApp from './PopupApp';
import './Popup.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PopupApp />
    </StrictMode>,
);
