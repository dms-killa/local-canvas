// src/components/chat/ChatUI.tsx
// Chat UI implementation for local AI writing tool

import { useState, useRef, useEffect } from 'react';
import { aiProvider } from '../../../src/index';
import { memoryStorage } from '../../../src/stores/memory/index';

// Interface for chat messages
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Chat UI component
export const ChatUI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await aiProvider.generate('test');
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get response from AI provider
      const response = await aiProvider.generate(inputValue);
      
      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I could not connect to the AI service. Please check if Ollama is running.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Retrieve context from memory for the current message
  const handleRetrieveContext = async (prompt: string) => {
    try {
      const relevantPast = await memoryStorage.retrieveContext(prompt);
      return relevantPast.join('\n');
    } catch (error) {
      console.error('Error retrieving context:', error);
      return '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M14 4a2 2 0 0 0-2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h1a2 2 0 0 0 2-2V4z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Chat Assistant</h1>
            <p className="text-sm text-purple-100">Ask questions about your writing or get advice</p>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={isConnected ? 'text-green-700' : 'text-red-600'}>
            {isConnected ? 'Connected to AI service' : 'AI service is offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M14 4a2 2 0 0 0-2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h1a2 2 0 0 0 2-2V4z" />
            </svg>
            <p>Ask a question about your writing or get advice</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                {message.content}
              </div>
              <div className="text-xs text-gray-500 ml-2 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-1 text-gray-500">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your writing..."
            disabled={!isConnected}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected || isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// ChatManager class for session management
export class ChatManager {
  private messages: Message[] = [];
  private maxMessages = 100;

  constructor() {
    // Load any saved chat sessions from storage
    this.loadHistory();
  }

  // Add a new message to the chat
  addMessage(message: Message): void {
    this.messages.push(message);
    
    // Limit the number of messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    
    // Save to storage
    this.saveHistory();
  }

  // Get all messages
  getMessages(): Message[] {
    return [...this.messages];
  }

  // Clear all messages
  clearMessages(): void {
    this.messages = [];
    this.saveHistory();
  }

  // Save chat history to storage
  private saveHistory(): void {
    try {
      // In a real implementation, this would save to localStorage or a database
      // For now, we'll just log it
      console.log('Chat history saved:', this.messages.length, 'messages');
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // Load chat history from storage
  private loadHistory(): void {
    try {
      // In a real implementation, this would load from localStorage or a database
      // For now, we'll just log it
      console.log('Chat history loaded');
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }
}

// Export the chat manager instance
export const chatManager = new ChatManager();

// Export the types for type safety
export type { Message } from './ChatUI';
