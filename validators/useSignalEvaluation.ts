import { useState, useEffect } from 'react';
interface SignalPayload { id: string; content: string; }

export function useSignalEvaluation() {
  const [signal, setSignal] = useState<SignalPayload|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    async function fetchMock(){
      const resp = await import('../mock/signal.json');
      setSignal(resp.default as SignalPayload);
      setLoading(false);
    }
    fetchMock();
  },[]);
  return { signal, loading };
}
