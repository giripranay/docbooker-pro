import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useBooking, UserInfo } from '@/context/BookingContext';
import { toast } from 'sonner';


function StatusPopup() {
  const { backgroundStatus, setBackgroundStatus } = useBooking();
  const navigate = useNavigate();

  if (!backgroundStatus || backgroundStatus.state === 'idle') return null;

  const colorByState = (s: string) => {
    switch (s) {
      case 'pending':
        return 'bg-yellow-500/95 text-black';
      case 'success':
        return 'bg-green-600 text-white';
      case 'failure':
        return 'bg-red-600 text-white';
      case 'needs-info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-50 max-w-xl w-[90%] shadow-lg rounded-md ${colorByState(backgroundStatus.state)}`}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">{backgroundStatus.message || backgroundStatus.state}</div>
        </div>
        <div className="flex items-center gap-2">
          {backgroundStatus.state === 'needs-info' && (
            <button
              className="px-3 py-1 rounded bg-white/20 hover:bg-white/30"
              onClick={() => {
                setBackgroundStatus({ state: 'idle' });
                navigate('/book/extra-info');
              }}
            >
              Provide Info
            </button>
          )}
          <button
            className="px-2 py-1 rounded bg-white/10"
            onClick={() => setBackgroundStatus({ state: 'idle' })}
            aria-label="close status"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { setUserInfo, setBackgroundStatus } = useBooking();
  const [formData, setFormData] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    reason: '',
  });

  const [appointmentType, setAppointmentType] = useState<string>('general');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setUserInfo(formData);
    // start background booking process and then navigate to date-time step
    // startBookingProcess(formData, appointmentType);
    navigate('/book/date-time');
  };

  const startBookingProcess = async (userInfo: UserInfo, type: string) => {
    // optimistic pending state
    setBackgroundStatus({ state: 'pending', message: 'Booking request sent' });

    try {
      const resp = await fetch('http://localhost:3002/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInfo, appointmentType: type }),
      });

      if (!resp.ok) {
        // fallback: simulate background processing
        setBackgroundStatus({ state: 'pending', message: 'Queued locally (simulated) — processing' });
        setTimeout(() => setBackgroundStatus({ state: 'success', message: 'Appointment booked (simulated)' }), 2500);
        return;
      }

      const data = await resp.json();
      const jobId = data?.jobId;

      if (!jobId) {
        setBackgroundStatus({ state: 'success', message: 'Appointment booked' });
        return;
      }

      // poll job status
      const pollJob = async (id: string, attempts = 0) => {
        try {
          const r = await fetch(`http://localhost:3002/api/job/${id}`);
          if (!r.ok) throw new Error('job poll failed');
          const j = await r.json();
          if (j.status === 'completed') {
            setBackgroundStatus({ state: 'success', message: j.message || 'Booking completed' });
            return;
          }
          if (j.status === 'needs-info') {
            setBackgroundStatus({ state: 'needs-info', message: j.message || 'More info required' });
            return;
          }
          if (j.status === 'failed') {
            setBackgroundStatus({ state: 'failure', message: j.message || 'Booking failed' });
            return;
          }
          if (attempts < 10) setTimeout(() => pollJob(id, attempts + 1), 2000);
          else setBackgroundStatus({ state: 'failure', message: 'Booking timed out' });
        } catch (err) {
          if (attempts < 2) setTimeout(() => pollJob(id, attempts + 1), 1500);
          else setBackgroundStatus({ state: 'failure', message: 'Unable to poll job status' });
        }
      };

      pollJob(jobId);
    } catch (err) {
      setBackgroundStatus({ state: 'failure', message: 'Failed to start booking' });
    }
  };

  const features = [
    { icon: Calendar, title: 'Easy Scheduling', description: 'Book appointments in minutes' },
    { icon: Clock, title: 'Flexible Times', description: 'Choose what works for you' },
    { icon: Shield, title: 'Secure & Private', description: 'Your data is protected' },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <StatusPopup />
      {/* Hero Section */}
      <div className="container max-w-6xl py-12 px-4">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-6 shadow-elevated">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Book Your <span className="text-primary">Doctor</span> Appointment
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Schedule your visit with ease. Fill in your details below to get started.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-slide-up">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="max-w-2xl mx-auto shadow-elevated border-border/50 animate-scale-in">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Your Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <select
                    id="appointmentType"
                    name="appointmentType"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="w-full h-12 rounded border px-3 bg-transparent"
                  >
                    <option value="general">General Consultation</option>
                    <option value="followup">Follow-up</option>
                    <option value="vaccine">Vaccine</option>
                    <option value="telehealth">Telehealth</option>
                  </select>
                </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Please describe the reason for your appointment..."
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full mt-6">
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
