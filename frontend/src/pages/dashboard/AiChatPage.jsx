import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services';
import {
  Bot, Send, User, Sparkles, Loader2, Trash2, Zap,
  Plus, MessageSquare, PanelLeftClose, PanelLeft, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AiChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId]);

  // Load chat list on mount
  const fetchChatList = useCallback(async () => {
    try {
      const { data } = await aiService.getChats();
      setChatList(data.chats || []);
    } catch {
      // silently fail
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  // Load a specific chat
  const loadChat = async (id) => {
    if (id === chatId) return;
    try {
      const { data } = await aiService.getChat(id);
      setChatId(data.chat._id);
      setMessages(
        data.chat.messages.map((m, i) => ({
          id: `${data.chat._id}-${i}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
      );
    } catch {
      toast.error('Failed to load chat');
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setChatId(null);
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  // Delete a chat
  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await aiService.deleteChat(id);
      setChatList((prev) => prev.filter((c) => c._id !== id));
      if (chatId === id) {
        startNewChat();
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  // Send message
  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiService.chat(messageText, chatId);

      // Update chatId if this was a new chat
      if (!chatId && data.chatId) {
        setChatId(data.chatId);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Refresh chat list to show the new/updated chat
      fetchChatList();
    } catch {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again in a moment.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, i) => {
      let processed = line;
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-dark-card text-brand-orange-500 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

      if (line.startsWith('### ')) {
        elements.push(<h4 key={i} className="text-white font-bold text-sm mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.replace('### ', '') }} />);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={i} className="text-white font-bold text-base mt-4 mb-1.5" dangerouslySetInnerHTML={{ __html: processed.replace('## ', '') }} />);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
            <span className="text-brand-orange-500 mt-1.5 text-[6px]">●</span>
            <span dangerouslySetInnerHTML={{ __html: processed.replace(/^[-*]\s/, '') }} />
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)[1];
        elements.push(
          <div key={i} className="flex items-start gap-2.5 ml-1 my-0.5">
            <span className="text-brand-orange-500 font-bold text-xs mt-0.5 min-w-[16px]">{num}.</span>
            <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(<p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />);
      }
    });
    return elements;
  };

  // Format relative time
  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] animate-fade-in gap-0">
      {/* ──── Chat History Sidebar ──── */}
      <div
        className={`shrink-0 border-r border-dark-border bg-[#0a0a0a] rounded-l-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-72' : 'w-0 border-r-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-dark-border shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingChats ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-dark-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : chatList.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-xs text-gray-500">No conversations yet</p>
            </div>
          ) : (
            chatList.map((c) => (
              <button
                key={c._id}
                onClick={() => loadChat(c._id)}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  chatId === c._id
                    ? 'bg-dark-surface border border-brand-orange-500/30 text-white'
                    : 'text-gray-400 hover:bg-dark-surface hover:text-gray-200'
                }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${chatId === c._id ? 'text-brand-orange-500' : 'text-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(c.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, c._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ──── Main Chat Area ──── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-dark-surface text-gray-400 hover:text-white transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-brand-orange-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">AI Nutritionist</h1>
            <p className="text-xs text-gray-500">Analyzes your real meal data</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-orange-500/20 to-amber-500/10 flex items-center justify-center mb-6 border border-brand-orange-500/20">
                <Bot className="w-10 h-10 text-brand-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                What can I help you with?
              </h2>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                I analyze your <span className="text-brand-orange-500 font-medium">actual meal data</span> to give
                personalized nutrition advice. Type any question below.
              </p>
            </div>
          ) : (
            /* Messages */
            <div className="p-4 sm:p-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-1 ${
                      msg.isError
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-gradient-to-br from-brand-orange-500 to-amber-600'
                    }`}>
                      <Bot className={`w-5 h-5 ${msg.isError ? 'text-red-400' : 'text-white'}`} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-orange-500 text-white rounded-br-md'
                        : msg.isError
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-md'
                        : 'bg-dark-card border border-dark-border text-gray-300 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="prose-dark">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mt-1">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange-500 to-amber-600 flex items-center justify-center mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-2xl rounded-bl-md px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your nutrition data...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="px-4 sm:px-6 pb-4 pt-2 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-dark-card border border-dark-border focus-within:border-brand-orange-500/50 transition-colors">
            <div className="pl-3">
              <Zap className="w-5 h-5 text-gray-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your nutrition..."
              disabled={loading}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 disabled:bg-dark-surface disabled:text-gray-600 text-white flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-2">
            Powered by AI • Responses are based on your logged meal data
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
