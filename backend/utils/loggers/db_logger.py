import logging

logger = logging.getLogger("db")
logger.setLevel(logging.INFO)

if not logger.hasHandlers():  # Prevent adding multiple handlers
    file_handler = logging.FileHandler("db.log")
    stream_handler = logging.StreamHandler()

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    logger.propagate = False
