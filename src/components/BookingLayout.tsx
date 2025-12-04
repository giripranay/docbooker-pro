import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StepIndicator from './StepIndicator';

interface BookingLayoutProps {
  children: ReactNode;
  currentStep: number;
  showBack?: boolean;
  title: string;
  subtitle?: string;
}

const steps = ['Your Info', 'Date & Time', 'Review'];

const BookingLayout = ({ children, currentStep, showBack = true, title, subtitle }: BookingLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-2xl py-8 px-4 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          {showBack && currentStep > 1 && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <StepIndicator currentStep={currentStep} steps={steps} />
          
          <div className="text-center mt-8 animate-slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BookingLayout;
