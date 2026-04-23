import { CheckCircle, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    isDarkMode: boolean;
}

export function Toast({ message, type, onClose, isDarkMode }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 min-w-[320px] max-w-md animate-slide-in ${
                type === 'success'
                    ? isDarkMode
                        ? 'bg-green-900/90 border-green-600 text-green-100'
                        : 'bg-green-50 border-green-500 text-green-900'
                    : isDarkMode
                        ? 'bg-red-900/90 border-red-600 text-red-100'
                        : 'bg-red-50 border-red-500 text-red-900'
            }`}
        >
            {type === 'success'
                ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    )
                : (
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                    )}
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors cursor-pointer ${
                    isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
