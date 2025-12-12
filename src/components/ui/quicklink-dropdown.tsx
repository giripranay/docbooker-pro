import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { triggerQuicklink } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useBooking } from '@/context/BookingContext';

const QUICKLINKS = [
  { id: 'book-appointment', label: 'Book Appointment' }
//   { id: 'recalc-availability', label: 'Recalculate Availability' },
//   { id: 'cleanup-jobs', label: 'Cleanup Jobs' },
];

const QuickLinkDropdown: React.FC = () => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { setBackgroundStatus } = useBooking();

//   const onTrigger = async (id: string) => {
//     setLoadingId(id);
//     setBackgroundStatus({ state: 'pending', message: `Triggered ${id}` });

//     // show an initial toast and keep handle to update it
//     const t = toast({ title: 'Queued', description: `Starting ${id}…` });

//     const res = await triggerQuicklink(id);

//     if (res.ok) {
//       setBackgroundStatus({ state: 'success', message: res.message });
//       t.update({ id: t.id, title: 'Started', description: res.message ?? 'Background job started.' });
//     } else {
//       setBackgroundStatus({ state: 'failure', message: res.message });
//       t.update({ id: t.id, title: 'Failed', description: res.message ?? 'Failed to start job.' });
//     }

//     setLoadingId(null);
//   };

const onTrigger = async (id: string) => {
  setLoadingId(id);
  setBackgroundStatus({ state: 'pending', message: `Triggered ${id}` });

  const t = toast({ title: 'Queued', description: `Starting ${id}…` });

  const res = await triggerQuicklink(id, (status, message) => {
    // this runs multiple times while polling
    if (status === 'pending' || status === 'running') {
      setBackgroundStatus({ state: 'pending', message: message ?? 'Job in progress…' });
      t.update({ id: t.id, title: 'In Progress', description: message ?? 'Working…' });
    } else if (status === 'success') {
      setBackgroundStatus({ state: 'success', message: message ?? 'Completed.' });
      t.update({ id: t.id, title: 'Completed', description: message ?? 'Job finished successfully.' });
    } else if (status === 'failure') {
      setBackgroundStatus({ state: 'failure', message: message ?? 'Failed.' });
      t.update({ id: t.id, title: 'Failed', description: message ?? 'Job failed.' });
    }
  });

  // final result after polling completes
  if (!res.ok) {
    // already updated above, but you can add extra handling if needed
    console.error('Final job result: failed', res.message);
  }

  setLoadingId(null);
};


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-3 py-1">
          Quicklinks
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={8} className="min-w-[14rem]">
        {QUICKLINKS.map((q) => (
          <DropdownMenuItem
            key={q.id}
            onSelect={(e) => {
              // prevent keyboard default selection behavior which passes a string
              e.preventDefault();
              void onTrigger(q.id);
            }}
            className="flex items-center justify-between"
          >
            <span>{q.label}</span>
            {loadingId === q.id ? <span className="text-xs opacity-70">Starting…</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickLinkDropdown;
