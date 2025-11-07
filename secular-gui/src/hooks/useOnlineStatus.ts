import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/system/status', {
          method: 'GET',
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });
        if (mounted) {
          setIsOnline(response.ok);
        }
      } catch (error) {
        if (mounted) {
          setIsOnline(false);
        }
      }
    };

    // Check immediately on mount
    checkApiStatus();

    // Then check every 5 seconds
    intervalId = setInterval(checkApiStatus, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}
