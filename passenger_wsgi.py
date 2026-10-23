import os
import sys

# Define the application directory
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app
from app import app as application
