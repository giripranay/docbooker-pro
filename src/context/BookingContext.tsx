import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  reason: string;
}

export interface BookingData {
  userInfo: UserInfo;
  selectedDate: Date | null;
  selectedTime: string;
}

export type BackgroundState = 'idle' | 'pending' | 'success' | 'failure' | 'needs-info';

export interface BackgroundStatus {
  state: BackgroundState;
  message?: string;
  jobId?: string;
}

interface BookingContextType {
  bookingData: BookingData;
  setUserInfo: (info: UserInfo) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string) => void;
  resetBooking: () => void;
  backgroundStatus: BackgroundStatus;
  setBackgroundStatus: (s: BackgroundStatus) => void;
}

const initialBookingData: BookingData = {
  userInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    reason: '',
  },
  selectedDate: null,
  selectedTime: '',
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [backgroundStatus, setBackgroundStatus] = useState<BackgroundStatus>({ state: 'idle' });

  const setUserInfo = (info: UserInfo) => {
    setBookingData((prev) => ({ ...prev, userInfo: info }));
  };

  const setSelectedDate = (date: Date | null) => {
    setBookingData((prev) => ({ ...prev, selectedDate: date }));
  };

  const setSelectedTime = (time: string) => {
    setBookingData((prev) => ({ ...prev, selectedTime: time }));
  };

  const resetBooking = () => {
    setBookingData(initialBookingData);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        setUserInfo,
        setSelectedDate,
        setSelectedTime,
        resetBooking,
        backgroundStatus,
        setBackgroundStatus,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
