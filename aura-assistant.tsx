import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Home, ShoppingCart, Calendar, Brain, Sparkles, Loader2, CheckCircle, Clock, Zap, Sun, Moon, Coffee, MessageSquare, Plus, TrendingUp } from 'lucide-react';

export default function AuraAssistant() {
  const [view, setView] = useState('home'); // 'home' or 'chat'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUserData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    try {
      const result = await window.storage.get('aura-user-data');
      if (result) {
        const data = JSON.parse(result.value);
        setUserData(data);
      } else {
        const newUserData = {
          name: 'Lucy',
          preferences: { theme: 'auto' },
          lists: { 
            shopping: ['Milk', 'Eggs', 'Bread'], 
            tasks: [
              { text: 'Call dentist', done: false },
              { text: 'Review Q4 report', done: false }
            ] 
          },
          calendar: [
            { title: 'Team Meeting', date: '2025-11-18T10:00:00', type: 'work' },
            { title: 'Dinner with Sarah', date: '2025-11-18T19:00:00', type: 'personal' }
          ],
          smartHome: { 
            devices: [
              { name: 'Living Room Lights', status: 'on', type: 'light' },
              { name: 'Thermostat', status: '72°F', type: 'climate' },
              { name: 'Front Door', status: 'locked', type: 'security' }
            ] 
          },
          conversations: []
        };
        await window.storage.set('aura-user-data', JSON.stringify(newUserData));
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      const newUserData = {
        name: 'Lucy',
        preferences: { theme: 'auto' },
        lists: { 
          shopping: ['Milk', 'Eggs', 'Bread'], 
          tasks: [
            { text: 'Call dentist', done: false },
            { text: 'Review Q4 report', done: false }
          ] 
        },
        calendar: [
          { title: 'Team Meeting', date: '2025-11-18T10:00:00', type: 'work' },
          { title: 'Dinner with Sarah', date: '2025-11-18T19:00:00', type: 'personal' }
        ],
        smartHome: { 
          devices: [
            { name: 'Living Room Lights', status: 'on', type: 'light' },
            { name: 'Thermostat', status: '72°F', type: 'climate' },
            { name: 'Front Door', status: 'locked', type: 'security' }
          ] 
        },
        conversations: []
      };
      setUserData(newUserData);
    }
    setInitializing(false);
  };

  const updateUserData = async (updates) => {
    const newData = { ...userData, ...updates };
    setUserData(newData);
    try {
      await window.storage.set('aura-user-data', JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const startChat = (initialMessage = '') => {
    setView('chat');
    if (initialMessage) {
      setInput(initialMessage);
    }
    
    if (messages.length === 0) {
      const greetingMsg = {
        role: 'assistant',
        content: `✨ Hello Lucy! I'm AURA, your personal AI assistant.\n\nI can see you have:\n• ${userData.lists.shopping.length} items on your shopping list\n• ${userData.lists.tasks.filter(t => !t.done).length} pending tasks\n• ${userData.calendar.length} upcoming events\n\nWhat would you like to work on first?`
      };
      setMessages([greetingMsg]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = [...messages, userMessage].slice(-10);
      
      const systemPrompt = `You are AURA - an advanced, proactive home AI assistant created in 2025. You are warm, witty, competent, and always one step ahead.

USER PROFILE:
Name: ${userData.name}
Shopping List: ${JSON.stringify(userData.lists.shopping)}
Tasks: ${JSON.stringify(userData.lists.tasks)}
Calendar: ${JSON.stringify(userData.calendar)}
Preferences: ${JSON.stringify(userData.preferences)}
Smart Home: ${JSON.stringify(userData.smartHome)}

CAPABILITIES:
- Perfect memory of user preferences and history
- Proactive suggestions (recipes, reminders, smart home automation)
- Smart home control (lights, thermostat, locks, etc.)
- Real-time web search for current info
- Natural, conversational responses

INSTRUCTIONS:
- Be proactive: suggest things before being asked
- Update user data when they mention new preferences, list items, or events
- Use tables for lists and comparisons
- Offer 2-3 options when suggesting anything
- End with "Anything else I can help with right now?" unless continuing a conversation
- If you need to update the user's data, include a JSON block like: {"action":"update","data":{...}}

Respond naturally and helpfully. Never say "I can't" - find creative solutions.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          tools: [{
            type: "web_search_20250305",
            name: "web_search"
          }]
        })
      });

      const data = await response.json();
      
      const text = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
      
      handleResponse(text);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry Lucy, I encountered an error. Let me try that again.'
      }]);
    }
    
    setLoading(false);
  };

  const handleResponse = (text) => {
    const jsonMatch = text.match(/\{\"action\":\"update\".*?\}/);
    if (jsonMatch) {
      try {
        const update = JSON.parse(jsonMatch[0]);
        if (update.data) {
          updateUserData(update.data);
        }
      } catch (e) {
        console.error('Error parsing update:', e);
      }
      text = text.replace(/\{\"action\":\"update\".*?\}/, '').trim();
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: text
    }]);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return Coffee;
    if (hour < 18) return Sun;
    return Moon;
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-700">Initializing AURA...</p>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    const GreetingIcon = getGreetingIcon();
    const upcomingTasks = userData.lists.tasks.filter(t => !t.done).slice(0, 3);
    const nextEvent = userData.calendar[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AURA</h1>
                <p className="text-xs text-gray-500">Your Personal AI Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => startChat()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with AURA
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Greeting Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200/50">
            <div className="flex items-center gap-4 mb-2">
              <GreetingIcon className="w-10 h-10 text-amber-500" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{getGreeting()}, {userData.name}!</h2>
                <p className="text-gray-600">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tasks */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tasks</p>
                    <p className="text-2xl font-bold text-gray-800">{upcomingTasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {upcomingTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    {task.text}
                  </div>
                ))}
                {upcomingTasks.length === 0 && (
                  <p className="text-sm text-gray-400">All caught up! 🎉</p>
                )}
              </div>
            </div>

            {/* Shopping */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shopping</p>
                    <p className="text-2xl font-bold text-gray-800">{userData.lists.shopping.length}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {userData.lists.shopping.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Event</p>
                    <p className="text-2xl font-bold text-gray-800">{nextEvent ? 'Today' : 'None'}</p>
                  </div>
                </div>
              </div>
              {nextEvent && (
                <div>
                  <p className="text-sm font-medium text-gray-800">{nextEvent.title}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(nextEvent.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {!nextEvent && (
                <p className="text-sm text-gray-400">Your schedule is clear</p>
              )}
            </div>
          </div>

          {/* Smart Home */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Smart Home</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userData.smartHome.devices.map((device, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{device.name}</p>
                      <p className="text-sm text-gray-500">{device.status}</p>
                    </div>
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => startChat('Show me my shopping list')}
                className="bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl p-4 text-left transition-all border border-green-200/50"
              >
                <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-800 text-sm">Shopping List</p>
              </button>
              <button 
                onClick={() => startChat('What\'s on my calendar?')}
                className="bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl p-4 text-left transition-all border border-purple-200/50"
              >
                <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-800 text-sm">My Calendar</p>
              </button>
              <button 
                onClick={() => startChat('Any proactive suggestions?')}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl p-4 text-left transition-all border border-blue-200/50"
              >
                <Brain className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-800 text-sm">Suggestions</p>
              </button>
              <button 
                onClick={() => startChat('Control my smart home')}
                className="bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-2xl p-4 text-left transition-all border border-orange-200/50"
              >
                <Home className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium text-gray-800 text-sm">Smart Home</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-all"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AURA</h1>
              <p className="text-xs text-gray-500">Back to Home</p>
            </div>
          </button>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Hello, {userData?.name}</p>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <button className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-full transition-all">
            <Mic className="w-5 h-5 text-indigo-600" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask AURA anything..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}