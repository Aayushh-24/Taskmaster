from app import create_app, socketio
from app.sockets import *  # Register WebSocket event handlers

app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)
