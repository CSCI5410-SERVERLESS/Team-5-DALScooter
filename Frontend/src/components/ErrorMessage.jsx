import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ error }) => {
    if (!error) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
            </div>
        </div>
    );
};

export default ErrorMessage;