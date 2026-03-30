import React from 'react'
import { AlertCircle } from 'lucide-react'

const ErrorDisplay = ({ error = "" }) => {

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-rose-500 dark:text-rose-400 mb-4" />
            <p className="text-lg font-semibold text-rose-500 dark:text-rose-400 mb-2">Something went wrong</p>
            <p className="font-medium text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        </div>
    )
}

export default ErrorDisplay