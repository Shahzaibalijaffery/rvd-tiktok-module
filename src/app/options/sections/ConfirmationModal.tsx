import { X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDarkMode: boolean;
    isDestructive?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDarkMode,
    isDestructive: _isDestructive = false,
}: ConfirmationModalProps) {
    if (!isOpen)
        return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md rounded-xl border-2 p-5 sm:p-6 ${
                    isDarkMode ? 'bg-[#1a1a1a] border-[#3f3f3f]' : 'bg-white border-gray-200'
                }`}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-1 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="pr-8 sm:pr-8">
                    <h3 className={`text-base sm:text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-5 sm:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={onClose}
                        className={`flex-1 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                            isDarkMode
                                ? 'border-[#3f3f3f] bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white'
                                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
                        }`}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800 sm:py-2.5"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
