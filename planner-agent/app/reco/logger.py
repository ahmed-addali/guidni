import logging
import os
from logging.handlers import RotatingFileHandler

def setup_reco_logger():
    """Sets up a dedicated logger for the recommendation system.
    
    Logs are saved to planner-agent/logs/reco_debug.log with rotation.
    """
    # Ensure logs directory exists inside the reco module
    reco_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(reco_dir, "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file = os.path.join(log_dir, "reco_debug.log")
    
    # Create logger
    logger = logging.getLogger("app.reco")
    logger.setLevel(logging.DEBUG)
    
    # Prevent duplicate handlers if re-initialized
    if not logger.handlers:
        # File handler (10MB per file, keep 5 backups)
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5
        )
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        
        # Also add a stream handler for the console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger

# Singleton instance
reco_logger = setup_reco_logger()
