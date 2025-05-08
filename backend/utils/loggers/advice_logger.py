import logging

advice_logger = logging.getLogger("advice_processing")
advice_logger.setLevel(logging.INFO)

if not advice_logger.hasHandlers():
    file_handler = logging.FileHandler("advice_processing.log")
    stream_handler = logging.StreamHandler()

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)

    advice_logger.addHandler(file_handler)
    advice_logger.addHandler(stream_handler)
    advice_logger.propagate = False
