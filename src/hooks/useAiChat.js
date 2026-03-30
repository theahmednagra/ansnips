import { useState, useCallback, useRef } from 'react';
import config from '../config/config';

// Groq API Configuration
const GROQ_API_KEY = config.groqApiKey;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const RATE_LIMIT = {
    maxRequests: 25, // Conservative limit (Groq allows 30/min)
    timeWindow: 60000,
    requests: [],
};

export const useAiChat = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [streamingText, setStreamingText] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);

    const abortControllerRef = useRef(null);
    const streamingAbortRef = useRef(false);

    const checkRateLimit = useCallback(() => {
        const now = Date.now();
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
            (time) => now - time < RATE_LIMIT.timeWindow
        );

        if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
            return false;
        }

        RATE_LIMIT.requests.push(now);
        return true;
    }, []);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        streamingAbortRef.current = true;
        setLoading(false);
        setStreamingText('');
    }, []);

    const sendMessage = useCallback(
        async (userMessage) => {
            if (!checkRateLimit()) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }

            setMessages((prev) => [...prev, { type: 'sent', text: userMessage }]);
            setLoading(true);
            setError(null);
            setStreamingText('');
            streamingAbortRef.current = false;
            abortControllerRef.current = new AbortController();

            try {
                // Build conversation history in OpenAI format
                const messagesPayload = [
                    {
                        role: 'system',
                        content: `You are a helpful, intelligent assistant. Keep responses clear and concise. Always wrap code in proper markdown code blocks with language tags (javascript, python, etc.). Use inline code with single backticks only for short variable names or commands within sentences. Format your responses using markdown for better readability.`,
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ];

                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile', // Best model for general chat
                        messages: messagesPayload,
                        temperature: 0.7,
                        max_tokens: 2048,
                        top_p: 1,
                        stream: false, // We'll handle streaming manually for better control
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.error?.message || `API request failed: ${response.status}`
                    );
                }

                const data = await response.json();
                const aiResponse = data.choices[0].message.content;

                // Simulate streaming for better UX
                let displayedText = '';
                const words = aiResponse.split(' ');

                for (let i = 0; i < words.length; i++) {
                    if (streamingAbortRef.current) {
                        if (displayedText.trim()) {
                            setMessages((prev) => [
                                ...prev,
                                { type: 'received', text: displayedText },
                            ]);
                            setConversationHistory([
                                ...conversationHistory,
                                { role: 'user', content: userMessage },
                                { role: 'assistant', content: displayedText },
                            ]);
                        }
                        return;
                    }

                    displayedText += (i > 0 ? ' ' : '') + words[i];
                    setStreamingText(displayedText);
                    await new Promise((resolve) => setTimeout(resolve, 15)); // Faster streaming
                }

                // Update conversation history
                setConversationHistory([
                    ...conversationHistory,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: aiResponse },
                ]);

                setMessages((prev) => [...prev, { type: 'received', text: aiResponse }]);
                setStreamingText('');

                return aiResponse;
            } catch (error) {
                if (error.name === 'AbortError') {
                    setError('Generation stopped');
                } else {
                    console.error('AI Chat Error:', error);
                    setError(error.message || 'Failed to get response. Please try again.');
                }
                throw error;
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
            }
        },
        [conversationHistory, checkRateLimit]
    );

    const clearChat = useCallback(() => {
        setConversationHistory([]);
        setMessages([]);
        setStreamingText('');
        setError(null);
        setLoading(false);
        streamingAbortRef.current = false;
    }, []);

    return {
        messages,
        loading,
        error,
        streamingText,
        sendMessage,
        clearChat,
        stopGeneration,
        setMessages, // Export for loading saved conversations
    };
};