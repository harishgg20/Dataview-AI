from typing import Dict, Optional
import pandas as pd
from datetime import datetime, timedelta
import threading

class DataFrameCache:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DataFrameCache, cls).__new__(cls)
                    cls._instance.cache = {}
                    cls._instance.access_time = {}
                    cls._instance.max_size = 50 # Keep max 50 datasets in RAM
        return cls._instance

    def get(self, key: str) -> Optional[pd.DataFrame]:
        with self._lock:
            if key in self.cache:
                self.access_time[key] = datetime.now()
                return self.cache[key]
            return None

    def set(self, key: str, df: pd.DataFrame):
        with self._lock:
            # Eviction if full
            if len(self.cache) >= self.max_size:
                # Remove Least Recently Used
                lru_key = min(self.access_time, key=self.access_time.get)
                del self.cache[lru_key]
                del self.access_time[lru_key]
            
            self.cache[key] = df
            self.access_time[key] = datetime.now()

    def invalidate(self, key: str):
        with self._lock:
            if key in self.cache:
                del self.cache[key]
                if key in self.access_time:
                    del self.access_time[key]

    def clear(self):
        with self._lock:
            self.cache.clear()
            self.access_time.clear()

df_cache = DataFrameCache()
