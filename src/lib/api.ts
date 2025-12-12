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

type StatusCallback = (status: string, message?: string) => void;

export async function triggerQuicklink(
  id: string,
  onStatus?: StatusCallback,
): Promise<ApiResult> {
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
    onStatus?.('pending', data.message ?? 'Job queued');

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

      onStatus?.(sData.status, sData.message);

      if (sData.status === 'success') {
        return { ok: true, message: sData.message ?? 'Job completed successfully' };
      }

      if (sData.status === 'failure') {
        return { ok: false, message: sData.message ?? 'Job failed' };
      }

      // if 'pending' or 'running' → loop again
    }
  } catch (err: any) {
    return { ok: false, message: err?.message ?? String(err) };
  }
}
