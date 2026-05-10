import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';

export default function CheckoutToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (status === 'success') {
      toast.success('Subscription activated! Your credits have been updated.', { duration: 6000 });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'cancelled') {
      toast.info('Checkout cancelled. No charge was made.', { duration: 4000 });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#ede9d8',
          border: '2px solid #1c1c1c',
          color: '#1a1a1a',
          fontFamily: 'inherit',
          borderRadius: '12px',
        },
      }}
    />
  );
}
