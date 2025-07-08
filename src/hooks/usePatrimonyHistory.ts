
import { useState, useEffect } from 'react';
import { Asset } from '@/types/finance';

interface PatrimonyHistoryEntry {
  date: string;
  value: number;
}

export function usePatrimonyHistory(assets: Asset[]) {
  const [historyData, setHistoryData] = useState<PatrimonyHistoryEntry[]>([]);
  
  // Create a new history entry whenever assets change
  useEffect(() => {
    // Calculate total asset value
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    // Only add to history if we have assets
    if (assets.length > 0) {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have an entry for today
      const existingEntryIndex = historyData.findIndex(
        entry => entry.date.startsWith(today)
      );
      
      if (existingEntryIndex >= 0) {
        // Update today's entry
        const updatedHistory = [...historyData];
        updatedHistory[existingEntryIndex] = {
          date: today,
          value: totalValue,
        };
        setHistoryData(updatedHistory);
      } else {
        // Add new entry for today
        setHistoryData([
          ...historyData,
          {
            date: today,
            value: totalValue
          }
        ]);
      }
    }
  }, [assets]);
  
  return { historyData };
}
