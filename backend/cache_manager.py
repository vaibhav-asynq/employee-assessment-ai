"""
Cache Manager for the Employee Assessment AI application.

This module provides functions to manage caching of API responses to reduce
the number of expensive LLM calls and improve response times.
"""

import os
import json
import time
from typing import Any, Dict, Optional

# Cache directory structure
CACHE_DIR = "../data/cache"
FILENAME_MAP_PATH = os.path.join(CACHE_DIR, "filename_map.json")

# Cache subdirectories for different types of data
CACHE_SUBDIRS = {
    "reports": os.path.join(CACHE_DIR, "reports"),
    "raw_data": os.path.join(CACHE_DIR, "raw_data"),
    "feedback": os.path.join(CACHE_DIR, "feedback"),
    "advice": os.path.join(CACHE_DIR, "advice"),
    "strength_evidences": os.path.join(CACHE_DIR, "strength_evidences"),
    "development_areas": os.path.join(CACHE_DIR, "development_areas"),
}

# Create cache directories if they don't exist
os.makedirs(CACHE_DIR, exist_ok=True)
for subdir in CACHE_SUBDIRS.values():
    os.makedirs(subdir, exist_ok=True)


def get_cached_file_id(filename: str, use_cache: bool = True) -> Optional[str]:
    """
    Get the file ID for a given filename from the cache.
    
    Args:
        filename: The original filename
        use_cache: Whether to use the cache
        
    Returns:
        The file ID if found in cache, None otherwise
    """
    if not use_cache:
        return None
        
    if not os.path.exists(FILENAME_MAP_PATH):
        return None
        
    try:
        with open(FILENAME_MAP_PATH, 'r') as f:
            filename_map = json.load(f)
            
        return filename_map.get(filename)
    except Exception as e:
        print(f"Error reading filename map: {e}")
        return None


def add_to_filename_map(filename: str, file_id: str) -> None:
    """
    Add a filename to file ID mapping to the cache.
    
    Args:
        filename: The original filename
        file_id: The generated file ID
    """
    filename_map = {}
    
    # Load existing map if it exists
    if os.path.exists(FILENAME_MAP_PATH):
        try:
            with open(FILENAME_MAP_PATH, 'r') as f:
                filename_map = json.load(f)
        except Exception as e:
            print(f"Error reading filename map: {e}")
    
    # Add new mapping
    filename_map[file_id] = file_id
    
    # Save updated map
    try:
        with open(FILENAME_MAP_PATH, 'w') as f:
            json.dump(filename_map, f, indent=2)
    except Exception as e:
        print(f"Error writing filename map: {e}")


def get_cache_path(cache_type: str, file_id: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Get the path to a cached file.
    
    Args:
        cache_type: The type of cached data (reports, raw_data, etc.)
        file_id: The file ID
        params: Optional parameters that affect the cache key
        
    Returns:
        The path to the cached file
    """
    if cache_type not in CACHE_SUBDIRS:
        raise ValueError(f"Invalid cache type: {cache_type}")
        
    cache_dir = CACHE_SUBDIRS[cache_type]
    
    if params:
        # Create a deterministic string from the parameters
        param_str = "_".join(f"{k}_{v}" for k, v in sorted(params.items()))
        return os.path.join(cache_dir, f"{file_id}_{param_str}.json")
    else:
        return os.path.join(cache_dir, f"{file_id}.json")


def get_cached_data(cache_type: str, file_id: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Get cached data for a file ID.
    
    Args:
        cache_type: The type of cached data (reports, raw_data, etc.)
        file_id: The file ID
        params: Optional parameters that affect the cache key
        
    Returns:
        The cached data if found, None otherwise
    """
    cache_path = get_cache_path(cache_type, file_id, params)
    
    if not os.path.exists(cache_path):
        return None
        
    try:
        with open(cache_path, 'r') as f:
            data = json.load(f)
            
        print(f"Cache hit for {cache_type} with file ID {file_id}")
        return data
    except Exception as e:
        print(f"Error reading cached data: {e}")
        return None


def save_cached_data(cache_type: str, file_id: str, data: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> None:
    """
    Save data to the cache.
    
    Args:
        cache_type: The type of cached data (reports, raw_data, etc.)
        file_id: The file ID
        data: The data to cache
        params: Optional parameters that affect the cache key
    """
    cache_path = get_cache_path(cache_type, file_id, params)
    
    try:
        with open(cache_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Cached {cache_type} data for file ID {file_id}")
    except Exception as e:
        print(f"Error saving cached data: {e}")


def clear_cache(cache_type: Optional[str] = None, file_id: Optional[str] = None) -> None:
    """
    Clear the cache.
    
    Args:
        cache_type: The type of cached data to clear (reports, raw_data, etc.)
                   If None, clear all cache types
        file_id: The file ID to clear
                If None, clear all files for the specified cache type(s)
    """
    if cache_type is None:
        # Clear all cache types
        for subdir in CACHE_SUBDIRS.values():
            if file_id is None:
                # Clear all files in the directory
                for filename in os.listdir(subdir):
                    if filename.endswith('.json'):
                        os.remove(os.path.join(subdir, filename))
            else:
                # Clear only files for the specified file ID
                for filename in os.listdir(subdir):
                    if filename.startswith(f"{file_id}") and filename.endswith('.json'):
                        os.remove(os.path.join(subdir, filename))
    else:
        # Clear only the specified cache type
        if cache_type not in CACHE_SUBDIRS:
            raise ValueError(f"Invalid cache type: {cache_type}")
            
        subdir = CACHE_SUBDIRS[cache_type]
        
        if file_id is None:
            # Clear all files in the directory
            for filename in os.listdir(subdir):
                if filename.endswith('.json'):
                    os.remove(os.path.join(subdir, filename))
        else:
            # Clear only files for the specified file ID
            for filename in os.listdir(subdir):
                if filename.startswith(f"{file_id}") and filename.endswith('.json'):
                    os.remove(os.path.join(subdir, filename))
