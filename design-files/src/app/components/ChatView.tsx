import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Send, MapPin, Calendar, Users, Check, Clock, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'confirmation';
}

interface Contact {
  name: string;
  company: string;
  tier: number;
}

export function ChatView() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [inputValue, setInputValue] = useState('');

  // Mock data
  const tripInfo = {
    destination: 'San Francisco',
    dates: 'Mar 20-23',
    meetingsScheduled: 3,
  };

  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      content: "I see you're headed to San Francisco, arriving March 20 and departing March 23. Want me to set up some meetings for you?",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      sender: 'user',
      content: "Yes please! Focus on existing clients and a few investor check-ins.",
      timestamp: new Date(Date.now() - 3500000),
    },
    {
      id: '3',
      sender: 'agent',
      content: "Perfect. You're there for three nights. Which time blocks are open for meetings? Any time you want to protect?",
      timestamp: new Date(Date.now() - 3400000),
    },
    {
      id: '4',
      sender: 'user',
      content: "Mornings are open. Keep evenings free.",
      timestamp: new Date(Date.now() - 3300000),
    },
    {
      id: '5',
      sender: 'agent',
      content: "Based on your CRM, here are people I'd recommend meeting in SF, ranked by priority:",
      timestamp: new Date(Date.now() - 3200000),
      type: 'text',
    },
  ]);

  const suggestedContacts: Contact[] = [
    { name: 'Sarah Chen', company: 'Acme Corp', tier: 1 },
    { name: 'Michael Torres', company: 'Vertex Partners', tier: 1 },
    { name: 'Jessica Liu', company: 'Zenith Inc', tier: 2 },
    { name: 'David Park', company: 'Summit Ventures', tier: 2 },
    { name: 'Emily Rodriguez', company: 'Peak Labs', tier: 3 },
  ];

  const handleSend = () => {
    if (inputValue.trim()) {
      // Handle send logic
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header 
        className="border-b border-gray-200 px-5 py-4"
        style={{ boxShadow: 'var(--shadow-1)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h4 className="font-bold">{tripInfo.destination}</h4>
              <p className="text-sm text-gray-600">{tripInfo.dates}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255, 107, 74, 0.1)' }}
            >
              <Check className="w-4 h-4" style={{ color: 'var(--color-coral-primary)' }} />
              <span style={{ color: 'var(--color-coral-primary)' }} className="font-semibold">
                {tripInfo.meetingsScheduled} scheduled
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex gap-3 max-w-2xl ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: message.sender === 'agent' 
                    ? 'var(--gradient-cool)' 
                    : 'var(--color-gray-200)',
                }}
              >
                {message.sender === 'agent' ? (
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--color-coral-primary)' }} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-400" />
                )}
              </div>

              {/* Message Bubble */}
              <div>
                <div
                  className="px-5 py-3 rounded-2xl"
                  style={{
                    background: message.sender === 'agent' ? 'var(--color-gray-100)' : 'var(--color-coral-primary)',
                    color: message.sender === 'agent' ? 'var(--color-black)' : 'white',
                    borderBottomLeftRadius: message.sender === 'agent' ? '4px' : '16px',
                    borderBottomRightRadius: message.sender === 'user' ? '4px' : '16px',
                  }}
                >
                  <p className="text-base leading-relaxed">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Contact Suggestions Card */}
        <div className="flex justify-start animate-slide-up">
          <div className="flex gap-3 max-w-2xl">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--gradient-cool)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--color-coral-primary)' }} />
            </div>

            <div 
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4"
              style={{ boxShadow: 'var(--shadow-2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5" style={{ color: 'var(--color-coral-primary)' }} />
                <h4 className="text-base font-semibold">Suggested Contacts</h4>
              </div>

              <div className="space-y-2">
                {suggestedContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-gray-600">{contact.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: contact.tier === 1 
                            ? 'rgba(255, 107, 74, 0.1)' 
                            : contact.tier === 2 
                            ? 'rgba(66, 165, 245, 0.1)' 
                            : 'rgba(168, 168, 168, 0.1)',
                          color: contact.tier === 1 
                            ? 'var(--color-coral-primary)' 
                            : contact.tier === 2 
                            ? '#42A5F5' 
                            : 'var(--color-gray-700)',
                        }}
                      >
                        Tier {contact.tier}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-coral-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  className="w-full py-3 text-white rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: 'var(--color-coral-primary)',
                    boxShadow: 'var(--shadow-coral)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-coral-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-coral-primary)';
                  }}
                >
                  Start outreach
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Summary Card */}
        <div className="flex justify-start animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex gap-3 max-w-2xl">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--gradient-cool)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--color-coral-primary)' }} />
            </div>

            <div 
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--gradient-warm)' }}
            >
              <h4 className="font-semibold mb-3">Trip Overview</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Staying at The Pendry, SoMa</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>3 days • 7 days away</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>8 meeting slots available</span>
                </div>
              </div>

              <div className="pt-3 border-t border-black/10">
                <p className="text-sm font-medium">
                  I'll prioritize meetings near your hotel and cluster them geographically to save travel time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div 
        className="border-t border-gray-200 px-5 py-4"
        style={{ boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-5 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                maxHeight: '120px',
                '--tw-ring-color': 'var(--color-coral-primary)',
              } as React.CSSProperties}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: inputValue.trim() ? 'var(--color-coral-primary)' : 'var(--color-gray-400)',
              boxShadow: inputValue.trim() ? 'var(--shadow-coral)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.background = 'var(--color-coral-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.background = 'var(--color-coral-primary)';
              }
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
