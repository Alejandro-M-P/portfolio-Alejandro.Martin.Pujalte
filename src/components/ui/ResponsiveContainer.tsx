import React, { useState, useEffect } from 'react';
import { useMedia } from 'react-use';

interface Props {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}

export default function ResponsiveContainer({ desktop, mobile }: Props) {
  const [isClient, setIsClient] = useState(false);
  const isDesktop = useMedia('(min-width: 768px)');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR show desktop, then switch based on viewport
  if (!isClient) {
    return <>{desktop}</>;
  }

  return <>{isDesktop ? desktop : mobile}</>;
}
