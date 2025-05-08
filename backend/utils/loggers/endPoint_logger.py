import logging

logger = logging.getLogger("api-endPoints")
logger.setLevel(logging.INFO)

if not logger.hasHandlers():
    file_handler = logging.FileHandler("api-endPoints.log")
    stream_handler = logging.StreamHandler()

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    logger.propagate = False
