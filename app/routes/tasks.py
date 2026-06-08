from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db, socketio
from app.models import Task
from datetime import datetime

tasks_bp = Blueprint("tasks", __name__)


def emit_task_update(event, data):
    """Emit a WebSocket event to the user's room."""
    room = f"user_{current_user.id}"
    socketio.emit(event, data, room=room)


@tasks_bp.route("/", methods=["GET"])
@login_required
def get_tasks():
    """Get all tasks for the current user with optional filters."""
    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")
    search = request.args.get("search", "").strip()

    query = Task.query.filter_by(user_id=current_user.id)

    if status_filter and status_filter in Task.STATUS_CHOICES:
        query = query.filter_by(status=status_filter)

    if priority_filter and priority_filter in Task.PRIORITY_CHOICES:
        query = query.filter_by(priority=priority_filter)

    if search:
        query = query.filter(
            (Task.title.ilike(f"%{search}%")) | (Task.description.ilike(f"%{search}%"))
        )

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({
        "success": True,
        "tasks": [t.to_dict() for t in tasks],
        "count": len(tasks),
    })


@tasks_bp.route("/", methods=["POST"])
@login_required
def create_task():
    """Create a new task."""
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "No data provided."}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium")
    status = data.get("status", "pending")

    if not title:
        return jsonify({"success": False, "message": "Title is required."}), 400

    if priority not in Task.PRIORITY_CHOICES:
        return jsonify({"success": False, "message": f"Priority must be one of {Task.PRIORITY_CHOICES}"}), 400

    if status not in Task.STATUS_CHOICES:
        return jsonify({"success": False, "message": f"Status must be one of {Task.STATUS_CHOICES}"}), 400

    task = Task(
        title=title,
        description=description,
        priority=priority,
        status=status,
        user_id=current_user.id,
    )
    db.session.add(task)
    db.session.commit()

    task_data = task.to_dict()
    emit_task_update("task_created", {"task": task_data})

    return jsonify({"success": True, "message": "Task created.", "task": task_data}), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    """Get a single task by ID."""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    return jsonify({"success": True, "task": task.to_dict()})


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    """Update an existing task."""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "No data provided."}), 400

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"success": False, "message": "Title cannot be empty."}), 400
        task.title = title

    if "description" in data:
        task.description = data["description"].strip()

    if "priority" in data:
        if data["priority"] not in Task.PRIORITY_CHOICES:
            return jsonify({"success": False, "message": f"Invalid priority."}), 400
        task.priority = data["priority"]

    if "status" in data:
        if data["status"] not in Task.STATUS_CHOICES:
            return jsonify({"success": False, "message": f"Invalid status."}), 400
        task.status = data["status"]

    task.updated_at = datetime.utcnow()
    db.session.commit()

    task_data = task.to_dict()
    emit_task_update("task_updated", {"task": task_data})

    return jsonify({"success": True, "message": "Task updated.", "task": task_data})


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    """Delete a task."""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    task_data = task.to_dict()

    db.session.delete(task)
    db.session.commit()

    emit_task_update("task_deleted", {"task_id": task_id})

    return jsonify({"success": True, "message": "Task deleted.", "task": task_data})
