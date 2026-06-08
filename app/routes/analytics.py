from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import Task
import pandas as pd
import numpy as np

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/summary", methods=["GET"])
@login_required
def summary():
    """Return analytics summary using Pandas & NumPy."""
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    if not tasks:
        return jsonify({
            "success": True,
            "analytics": {
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "in_progress_tasks": 0,
                "cancelled_tasks": 0,
                "completion_percentage": 0.0,
                "priority_breakdown": {},
                "status_breakdown": {},
                "avg_tasks_per_priority": 0.0,
                "productivity_score": 0.0,
            }
        })

    # Build DataFrame
    data = [t.to_dict() for t in tasks]
    df = pd.DataFrame(data)

    # Core counts
    total = len(df)
    status_counts = df["status"].value_counts().to_dict()

    completed = int(status_counts.get("completed", 0))
    pending = int(status_counts.get("pending", 0))
    in_progress = int(status_counts.get("in_progress", 0))
    cancelled = int(status_counts.get("cancelled", 0))

    # Completion percentage (NumPy)
    completion_pct = float(np.round((completed / total) * 100, 2)) if total > 0 else 0.0

    # Priority breakdown
    priority_counts = df["priority"].value_counts().to_dict()
    priority_counts = {k: int(v) for k, v in priority_counts.items()}

    # Average tasks per priority using NumPy
    priority_values = np.array(list(priority_counts.values()))
    avg_per_priority = float(np.mean(priority_values)) if len(priority_values) > 0 else 0.0

    # Productivity score: weighted formula
    weights = {"completed": 1.0, "in_progress": 0.5, "pending": 0.1, "cancelled": 0.0}
    score_raw = sum(weights.get(s, 0) * c for s, c in status_counts.items())
    productivity_score = float(np.round((score_raw / total) * 100, 2)) if total > 0 else 0.0

    # Status breakdown with percentages
    status_breakdown = {}
    for status, count in status_counts.items():
        status_breakdown[status] = {
            "count": int(count),
            "percentage": float(np.round((count / total) * 100, 1)),
        }

    return jsonify({
        "success": True,
        "analytics": {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "cancelled_tasks": cancelled,
            "completion_percentage": completion_pct,
            "priority_breakdown": priority_counts,
            "status_breakdown": status_breakdown,
            "avg_tasks_per_priority": float(np.round(avg_per_priority, 2)),
            "productivity_score": productivity_score,
        }
    })


@analytics_bp.route("/trends", methods=["GET"])
@login_required
def trends():
    """Return task creation trends by date."""
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    if not tasks:
        return jsonify({"success": True, "trends": []})

    data = [{"created_at": t.created_at, "status": t.status} for t in tasks]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["created_at"]).dt.date

    daily = df.groupby("date").size().reset_index(name="count")
    daily["date"] = daily["date"].astype(str)

    trends_data = daily.to_dict(orient="records")

    return jsonify({"success": True, "trends": trends_data})
