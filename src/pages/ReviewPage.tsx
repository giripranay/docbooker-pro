import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBooking } from '@/context/BookingContext';
import BookingLayout from '@/components/BookingLayout';
import { toast } from 'sonner';
import { Check, Calendar, User, Clock, Mail, Phone, FileText, Loader2 } from 'lucide-react';

const ReviewPage = () => {
  const navigate = useNavigate();
  const { bookingData, resetBooking } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!bookingData.userInfo.firstName || !bookingData.selectedDate) {
      navigate('/');
    }
  }, [bookingData, navigate]);

  // const handleSubmit = async () => {
  //   setIsSubmitting(true);
    
  //   // Simulate API call
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
    
  //   setIsSubmitting(false);
  //   setIsConfirmed(true);
  //   toast.success('Appointment booked successfully!');
  // };
  const handleSubmit = async () => {
  setIsSubmitting(true);

  const { userInfo, selectedDate, selectedTime } = bookingData;

  try {
    const res = await fetch('http://localhost:3001/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo,
        selectedDate,   // Date object → will be serialized as ISO string
        selectedTime,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(text);
    }

    // optional: read response JSON
    // const data = await res.json();

    setIsSubmitting(false);
    setIsConfirmed(true);
    toast.success('Appointment booked successfully!');
  } catch (err: any) {
    console.error('Failed to book appointment', err);
    setIsSubmitting(false);
    toast.error(err?.message ?? 'Failed to book appointment, please try again.');
  }
};


  const handleBookAnother = () => {
    resetBooking();
    navigate('/');
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-elevated border-border/50 animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-elevated">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Appointment Confirmed!
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a confirmation email to{' '}
              <span className="text-foreground font-medium">{bookingData.userInfo.email}</span>
            </p>
            
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {bookingData.selectedDate && format(bookingData.selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">{bookingData.selectedTime}</span>
              </div>
            </div>

            <Button variant="hero" size="lg" className="w-full" onClick={handleBookAnother}>
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { userInfo, selectedDate, selectedTime } = bookingData;

  const reviewItems = [
    { icon: User, label: 'Name', value: `${userInfo.firstName} ${userInfo.lastName}` },
    { icon: Mail, label: 'Email', value: userInfo.email },
    { icon: Phone, label: 'Phone', value: userInfo.phone },
    { icon: Calendar, label: 'Date', value: selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '' },
    { icon: Clock, label: 'Time', value: selectedTime },
  ];

  return (
    <BookingLayout
      currentStep={3}
      title="Review Your Appointment"
      subtitle="Please verify all information before confirming"
    >
      <Card className="shadow-elevated border-border/50">
        <CardContent className="p-6 md:p-8">
          {/* Appointment Details */}
          <div className="space-y-4">
            {reviewItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}

            {userInfo.reason && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Reason for Visit</p>
                  <p className="font-medium text-foreground">{userInfo.reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              By confirming this appointment, you agree to our cancellation policy. 
              Please arrive 15 minutes before your scheduled time.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            variant="hero"
            size="xl"
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirm Appointment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </BookingLayout>
  );
};

export default ReviewPage;
