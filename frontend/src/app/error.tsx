'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an audit service
    console.error('Audit Error Captured:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
        <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>
      
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-main">
        System Integrity Exception
      </h1>
      
      <p className="mb-8 max-w-md text-text-muted">
        The system encountered a schema mismatch or internal logic error. 
        Our audit team has been notified.
      </p>

      <div className="mb-8 w-full max-w-lg overflow-hidden rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left font-mono text-xs text-red-400">
        <div className="flex items-center gap-2 mb-2 border-b border-red-500/10 pb-2">
          <AlertCircle className="h-4 w-4" />
          <span className="font-bold">Error Digest: {error.digest || 'Internal Exception'}</span>
        </div>
        <p className="whitespace-pre-wrap">{error.message}</p>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/')}
        >
          Back to Dashboard
        </Button>
        <Button
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Attempt Recovery
        </Button>
      </div>
    </div>
  );
}

