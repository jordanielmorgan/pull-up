import { useNavigate } from "react-router";
import { MessageCircle, Calendar, MapPin, Clock, Users, Plus, User, Bell } from "lucide-react";

interface Trip {
  id: string;
  destination: string;
  dates: string;
  status: 'planning' | 'active' | 'completed';
  meetingsScheduled: number;
  meetingsTarget: number;
  daysUntil?: number;
}

export function HomeView() {
  const navigate = useNavigate();

  // Mock data
  const upcomingTrips: Trip[] = [
    {
      id: '1',
      destination: 'San Francisco',
      dates: 'Mar 20-23',
      status: 'planning',
      meetingsScheduled: 3,
      meetingsTarget: 6,
      daysUntil: 7,
    },
    {
      id: '2',
      destination: 'New York',
      dates: 'Apr 5-8',
      status: 'planning',
      meetingsScheduled: 0,
      meetingsTarget: 5,
      daysUntil: 23,
    },
  ];

  const stats = [
    { label: 'Meetings this month', value: '12', trend: '+3 from last month' },
    { label: 'Avg response time', value: '2.5h', trend: 'Getting faster' },
    { label: 'Success rate', value: '87%', trend: 'Excellent' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-coral-primary)' }}
            >
              <Plane className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Pull-Up</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-700" />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <User className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="mb-2">Hi Peter,</h1>
          <p className="text-xl text-gray-700">You have 2 upcoming trips. Let's make them count.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
              style={{ 
                animationDelay: `${index * 50}ms`,
                boxShadow: 'var(--shadow-2)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--color-coral-primary)' }}
                />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Trips */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3>Upcoming Trips</h3>
            <button 
              className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-coral-primary)' }}
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {upcomingTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer animate-slide-up"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  boxShadow: 'var(--shadow-2)',
                }}
                onClick={() => navigate(`/chat/${trip.id}`)}
              >
                {/* Trip Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold">{trip.destination}</h4>
                      {trip.status === 'planning' && (
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ 
                            background: 'rgba(255, 107, 74, 0.1)',
                            color: 'var(--color-coral-primary)',
                          }}
                        >
                          Planning
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{trip.dates}</span>
                      </div>
                      {trip.daysUntil !== undefined && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{trip.daysUntil} days away</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all duration-200"
                    style={{
                      background: 'var(--color-coral-primary)',
                      boxShadow: 'var(--shadow-coral)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${trip.id}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-coral-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-coral-primary)';
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">Plan</span>
                  </button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Meetings scheduled</span>
                    <span className="font-semibold">{trip.meetingsScheduled} of {trip.meetingsTarget}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(trip.meetingsScheduled / trip.meetingsTarget) * 100}%`,
                        background: 'var(--color-coral-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                {trip.meetingsScheduled > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{trip.meetingsScheduled} confirmed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Mission District</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section 
          className="rounded-3xl p-8 text-center space-y-4"
          style={{ background: 'var(--gradient-cool)' }}
        >
          <div className="max-w-md mx-auto">
            <h3 className="mb-2">Have a trip coming up?</h3>
            <p className="text-gray-700 mb-6">
              Add it to your calendar and I'll help you schedule meetings automatically.
            </p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-all duration-200"
              style={{ boxShadow: 'var(--shadow-2)' }}
            >
              <Plus className="w-5 h-5" />
              Connect Calendar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Plane(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}
