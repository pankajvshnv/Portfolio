import os
import sys

# Define the application directory
sys.path.insert(0, os.path.dirname(__file__))

# Import the FastAPI app and adapt to WSGI for Phusion Passenger (cPanel/Hostinger)
from app import app
from a2wsgi import ASGIMiddleware

application = ASGIMiddleware(app)
