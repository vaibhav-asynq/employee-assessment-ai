"""
Configuration settings for API calls and parallel processing.
These settings control the rate limiting and concurrency for API calls.
"""

# Maximum number of concurrent API calls to make
# This controls how many API calls can be in flight at the same time
MAX_CONCURRENT_API_CALLS = 3

# Maximum number of API calls per minute
# This controls the rate limiting to avoid hitting API rate limits
MAX_API_CALLS_PER_MINUTE = 50

# Number of PDF chunks to process in parallel
# This controls the batch size for parallel processing of PDF chunks
PDF_CHUNK_BATCH_SIZE = 4
