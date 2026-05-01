import { useEffect, useState } from 'react';

interface StatusBarProps {
  zoom: number;
  fragmentCount: number;
  clusterCount: number;
}

export default function StatusBar({ zoom, fragmentCount, clusterCount }: StatusBarProps) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="status-bar">
      <div className="status-bar__items">
        <span>{zoom.toFixed(2)}×</span>
        <span>{fragmentCount} fragments</span>
        <span>{clusterCount} clusters</span>
      </div>
      <div className={`status-bar__dot status-bar__dot--${online ? 'online' : 'offline'}`} />
    </div>
  );
}
