from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db, bcrypt
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form

        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validation
        if not username or not email or not password:
            msg = "All fields are required."
            if request.is_json:
                return jsonify({"success": False, "message": msg}), 400
            flash(msg, "danger")
            return render_template("auth/register.html")

        if len(password) < 6:
            msg = "Password must be at least 6 characters."
            if request.is_json:
                return jsonify({"success": False, "message": msg}), 400
            flash(msg, "danger")
            return render_template("auth/register.html")

        if User.query.filter_by(username=username).first():
            msg = "Username already taken."
            if request.is_json:
                return jsonify({"success": False, "message": msg}), 409
            flash(msg, "danger")
            return render_template("auth/register.html")

        if User.query.filter_by(email=email).first():
            msg = "Email already registered."
            if request.is_json:
                return jsonify({"success": False, "message": msg}), 409
            flash(msg, "danger")
            return render_template("auth/register.html")

        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(username=username, email=email, password_hash=hashed_pw)
        db.session.add(user)
        db.session.commit()

        if request.is_json:
            return jsonify({"success": True, "message": "Registration successful.", "user": user.to_dict()}), 201

        flash("Account created! Please log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        remember = data.get("remember", False)

        user = User.query.filter_by(email=email).first()

        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user, remember=bool(remember))
            if request.is_json:
                return jsonify({"success": True, "message": "Login successful.", "user": user.to_dict()})
            return redirect(url_for("main.dashboard"))

        msg = "Invalid email or password."
        if request.is_json:
            return jsonify({"success": False, "message": msg}), 401
        flash(msg, "danger")

    return render_template("auth/login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))


@auth_bp.route("/me")
@login_required
def me():
    return jsonify({"success": True, "user": current_user.to_dict()})
