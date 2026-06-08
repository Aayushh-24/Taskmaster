from flask_socketio import join_room, leave_room, emit
from flask_login import current_user
from functools import wraps
from app import socketio


def authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return False
        return f(*args, **kwargs)
    return wrapped


@socketio.on("connect")
@authenticated_only
def handle_connect():
    room = f"user_{current_user.id}"
    join_room(room)
    emit("connected", {
        "message": f"Connected to TaskMaster. Welcome, {current_user.username}!",
        "user_id": current_user.id,
        "room": room,
    })


@socketio.on("disconnect")
@authenticated_only
def handle_disconnect():
    room = f"user_{current_user.id}"
    leave_room(room)


@socketio.on("ping")
@authenticated_only
def handle_ping(data):
    emit("pong", {"message": "pong", "data": data})


@socketio.on("request_refresh")
@authenticated_only
def handle_refresh():
    emit("refresh_tasks", {"message": "Refreshing task list..."})
