import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isSameDay, isWeekend } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBooking } from '@/context/BookingContext';
import BookingLayout from '@/components/BookingLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Clock, ArrowRight } from 'lucide-react';

const timeSlots = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];

const DateTimePage = () => {
  const navigate = useNavigate();
  const { bookingData, setSelectedDate, setSelectedTime } = useBooking();
  const [date, setDate] = useState<Date | undefined>(bookingData.selectedDate || undefined);
  const [time, setTime] = useState<string>(bookingData.selectedTime || '');

  useEffect(() => {
    if (!bookingData.userInfo.firstName) {
      navigate('/');
    }
  }, [bookingData.userInfo, navigate]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleTimeSelect = (selectedTime: string) => {
    setTime(selectedTime);
    setSelectedTime(selectedTime);
  };

  const handleContinue = () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    if (!time) {
      toast.error('Please select a time slot');
      return;
    }
    navigate('/book/review');
  };

  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || isWeekend(date);
  };

  return (
    <BookingLayout
      currentStep={2}
      title="Select Date & Time"
      subtitle="Choose your preferred appointment slot"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                📅
              </span>
              Select Date
            </h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={disabledDays}
              className="rounded-lg border-0 pointer-events-auto"
              classNames={{
                day_selected: "gradient-primary text-primary-foreground hover:bg-primary",
                day_today: "bg-secondary text-secondary-foreground",
              }}
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </span>
              Select Time
            </h3>
            
            {date ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Available slots for {format(date, 'EEEE, MMMM d')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleTimeSelect(slot)}
                      className={cn(
                        "py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200",
                        time === slot
                          ? "gradient-primary text-primary-foreground shadow-card"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-30" />
                <p>Please select a date first</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selection Summary */}
      {(date || time) && (
        <Card className="mt-6 shadow-card border-border/50 animate-scale-in">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {date && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                    <span className="text-primary font-semibold">
                      {format(date, 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {time && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
                    <span className="text-accent font-semibold">{time}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <Button
        variant="hero"
        size="xl"
        className="w-full mt-6"
        onClick={handleContinue}
        disabled={!date || !time}
      >
        Continue to Review
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </BookingLayout>
  );
};

export default DateTimePage;
