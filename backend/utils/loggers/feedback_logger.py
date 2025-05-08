import logging

feedbackLogger = logging.getLogger("feedback-processing")
feedbackLogger.setLevel(logging.INFO)

if not feedbackLogger.hasHandlers():
    file_handler = logging.FileHandler("feedback_processing.log")
    stream_handler = logging.StreamHandler()

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)

    feedbackLogger.addHandler(file_handler)
    feedbackLogger.addHandler(stream_handler)
    feedbackLogger.propagate = False
