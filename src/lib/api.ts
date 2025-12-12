// lib/api.ts
export interface ApiResult {
  ok: boolean;
  message?: string;
}

interface TriggerResponse {
  ok: boolean;
  jobId?: string;
  status?: string;
  message?: string;
}

/**
 * onStatus(status, message, jobId?) - callback called during queue/poll with optional jobId
 */
type StatusCallback = (status: string, message?: string, jobId?: string) => void;

export async function triggerQuicklink(
  id: string,
  onStatus?: StatusCallback,
): Promise<ApiResult & { jobId?: string }> {
  try {
    // 1) queue job
    const res = await fetch(`http://localhost:3001/api/quicklink/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, message: text };
    }

    const data: TriggerResponse = await res.json().catch(() => ({} as any));

    if (!data.ok || !data.jobId) {
      return { ok: false, message: data.message ?? 'Failed to queue job' };
    }

    const jobId = data.jobId;
    onStatus?.('pending', data.message ?? 'Job queued', jobId);

    // 2) poll job status until done
    //    (you can adjust interval + timeout as needed)
    while (true) {
      await new Promise((r) => setTimeout(r, 2000));

      const sRes = await fetch(`http://localhost:3001/api/jobs/${jobId}`);
      if (!sRes.ok) {
        const text = await sRes.text().catch(() => 'Unknown error');
        return { ok: false, message: text };
      }

      const sData: { ok: boolean; status: string; message?: string } =
        await sRes.json().catch(() => ({
          ok: false,
          status: 'unknown',
          message: 'Invalid status payload',
        }));

      onStatus?.(sData.status, sData.message, jobId);

      if (sData.status === 'success') {
        return { ok: true, message: sData.message ?? 'Job completed successfully', jobId };
      }

      if (sData.status === 'failure') {
        return { ok: false, message: sData.message ?? 'Job failed', jobId };
      }

      // if 'pending' or 'running' → loop again
    }
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
}

/**
 * Send a message / response to an active job.
 * Backend must expose POST /api/jobs/:jobId/message
 */
export async function sendJobMessage(jobId: string, message: string): Promise<ApiResult> {
  try {
    const res = await fetch(`http://localhost:3001/api/jobs/${encodeURIComponent(jobId)}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      return { ok: false, message: text };
    }

    const data = await res.json().catch(() => ({} as any));
    return { ok: true, message: data?.message ?? 'Message sent' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
}
