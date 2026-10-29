import { useEffect, useState } from 'react';
import { TIME_SLOTS, subscribeTimeSlots } from '../constants/timeSlots';
import { refreshTimeSlots } from '../services/api';

// The current pickup time slots (admin-editable). Loads the latest list on mount and re-renders
// whenever it changes.
export const useTimeSlots = (): string[] => {
  const [slots, setSlots] = useState<string[]>([...TIME_SLOTS]);
  useEffect(() => {
    const unsubscribe = subscribeTimeSlots(() => setSlots([...TIME_SLOTS]));
    refreshTimeSlots().catch(() => {});
    return unsubscribe;
  }, []);
  return slots;
};
