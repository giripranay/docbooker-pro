import { useEffect, useRef, useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { sendJobMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ChatMsg = {
  id: string;
  from: 'system' | 'job' | 'user';
  text?: string;
  ts: number;
  file?: {
    name: string;
    url: string;
  };
};


const JobChat: React.FC = () => {
  const pdfChunksRef = useRef<string[]>([]);
  const { backgroundStatus, setBackgroundStatus } = useBooking();
  const { toast } = useToast();
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pdfBytesRef = useRef<Uint8Array[]>([]);
  // open chat when there's an active job or needs-info
  useEffect(() => {
    if (backgroundStatus.state !== 'idle') setOpen(true);
  }, [backgroundStatus.state]);

  // append status messages from backgroundStatus
  // (removed automatic mirroring of backgroundStatus.message into chat)

  useEffect(() => {
    // scroll to bottom on new message
    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, open]);


   // -----------------------------
  // SSE Connection for job updates
  // -----------------------------
  useEffect(() => {
  if (!backgroundStatus.jobId) return;

  const eventSource = new EventSource(
    `http://localhost:3002/api/sse/${backgroundStatus.jobId}`
  );

  eventSource.addEventListener('question', (e: MessageEvent) => {
    const payload = JSON.parse(e.data);
    setMessages((prev) => [
      ...prev,
      {
        id: payload.id,
        from: 'job',
        text: payload.text,
        ts: Date.now(),
      },
    ]);
  });

  eventSource.addEventListener('progress', (e: MessageEvent) => {
  const payload = JSON.parse(e.data);

  setMessages((prev) => [
    ...prev,
    {
      id: `${Date.now()}-p`,
      from: 'job',
      text: payload.text ?? payload.message ?? 'Working...',
      ts: Date.now(),
    },
  ]);
});


  // 📄 PDF chunk
  eventSource.addEventListener('pdf_chunk', (e: MessageEvent) => {
  const payload = JSON.parse(e.data);

  // Decode THIS chunk only
  const binary = atob(payload.data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  pdfBytesRef.current.push(bytes);
});



  // ✅ PDF complete
  eventSource.addEventListener('pdf_complete', (e: MessageEvent) => {
  const payload = JSON.parse(e.data);

  const blob = new Blob(pdfBytesRef.current, {
    type: 'application/pdf',
  });

  pdfBytesRef.current = [];

  const url = URL.createObjectURL(blob);

  setMessages((prev) => [
    ...prev,
    {
      id: `${Date.now()}-file`,
      from: 'job',
      ts: Date.now(),
      file: {
        name: payload.fileName,
        url,
      },
    },
  ]);
});

  

  eventSource.addEventListener('status', (e: MessageEvent) => {
  const payload = JSON.parse(e.data);

  setMessages((prev) => [
    ...prev,
    {
      id: `${Date.now()}-status`,
      from: 'job',
      text: payload.text,
      ts: Date.now(),
    },
  ]);
});


  eventSource.addEventListener('error', () => {
    eventSource.close();
  });

  return () => eventSource.close();
}, [backgroundStatus.jobId]);


const onSend = async () => {
  const text = input.trim();
  if (!text || !backgroundStatus?.jobId) return;

  // Get the last unanswered question from messages
  const lastQuestionMsg = [...messages].reverse().find((m) => m.from === 'job' && m.text && m.text !== 'Job is running…');
  const question = lastQuestionMsg?.text ?? "Unknown question";

  // Optimistically update chat
  const userMsg: ChatMsg = { id: `${Date.now()}-u`, from: 'user', text, ts: Date.now() };
  setMessages((m) => [...m, userMsg]);
  setInput('');

  const result = await sendJobMessage(backgroundStatus.jobId, question, text);

  if (!result.ok) {
    toast({ title: 'Failed to send', description: result.message ?? 'Unable to send message' });
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}-err`, from: 'system', text: result.message ?? 'Failed to send', ts: Date.now() },
    ]);
    return;
  }

  // Append job response (optional)
//   setMessages((m) => [
//     ...m,
//     { id: `${Date.now()}-r`, from: 'job', text: result.message ?? 'Message delivered', ts: Date.now() },
//   ]);
};



  if (!open) {
    // collapsed chat button (show when there's any background activity)
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="rounded-full w-12 h-12 bg-primary/90 text-primary-foreground shadow-lg"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] md:w-[380px]">
      <div className="flex flex-col bg-card border border-border/50 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-border/50">
          <div className="font-medium">Background Job Chat</div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">{backgroundStatus?.state}</div>
            <button
              className="px-2 py-1 rounded hover:bg-primary/10"
              onClick={() => setOpen(false)}
              aria-label="close chat"
            >
              ✕
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="p-3 max-h-64 overflow-auto space-y-2 bg-card">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground">No messages yet</div>
          )}

          {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    m.from === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/30 text-secondary-foreground'
                  }`}
                >
                  {m.text && <div>{m.text}</div>}

                  {m.file && (
                    <a
                      href={m.file.url}
                      download={m.file.name}
                      className="flex items-center gap-2 underline mt-1"
                    >
                      📄 {m.file.name}
                    </a>
                  )}
                </div>
              </div>
            ))}

        </div>

        <div className="p-3 border-t border-border/50 bg-card/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder="Reply or provide information..."
              className="flex-1 rounded px-3 py-2 bg-background border border-border/30 focus:outline-none"
            />
            <button
              onClick={() => void onSend()}
              className="px-3 py-2 rounded bg-primary text-primary-foreground"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobChat;
