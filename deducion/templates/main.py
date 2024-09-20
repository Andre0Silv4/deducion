from flask import Flask, render_template, redirect, url_for, request, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from itsdangerous import URLSafeSerializer, BadSignature, SignatureExpired
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import os

app = Flask(__name__, template_folder='templates')
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite"
app.config['SECRET_KEY'] = 'batatinha'
app.config['UPLOAD_FOLDER'] = 'static/uploads/products/' 

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(200))
    token = db.Column(db.String(200))

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(500))
    image_path = db.Column(db.String(200))
    #user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

def generate_auth_token(user_id, expiration=3600):
    s = URLSafeSerializer(app.config['SECRET_KEY'])
    token = s.dumps({'id': user_id, 'exp': (datetime.utcnow() + timedelta(seconds=expiration)).strftime('%Y-%m-%dT%H:%M:%SZ')})
    return token

def verify_auth_token(token):
    s = URLSafeSerializer(app.config['SECRET_KEY'])
    try:
        data = s.loads(token)
    except SignatureExpired:
        return None  # Token expirado
    except BadSignature:
        return None  # Token inválido
    user = User.query.get(data['id'])
    return user

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return jsonify({'message': 'Token está faltando'}), 403
        user = verify_auth_token(token)
        if not user:
            return jsonify({'message': 'Token inválido ou expirado'}), 401
        return f(user, *args, **kwargs)
    return decorated

@app.route('/')
def main_page():
    return render_template('main.html')

@app.route('/users')
def users_list():
    users = User.query.order_by(User.username).all()
    return render_template("user/list.html", users=users)

@app.route("/create", methods=["GET", "POST"])
def user_create():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)
        
        user = User(username=username, email=email, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        
        flash('User registered successfully')
        return redirect(url_for("login"))
    return render_template("create.html")

@app.route("/users/<int:id>")
def user_detail(id):
    user = User.query.get_or_404(id)
    return render_template("user/detail.html", user=user)

@app.route("/user/<int:id>/delete", methods=["POST", "GET"])
def user_delete(id):
    user = User.query.get_or_404(id)

    if request.method == "POST":    
        db.session.delete(user)
        db.session.commit()
        return redirect(url_for("users_list"))
    
    return render_template("user/delete.html", user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            
            token = generate_auth_token(user.id)
            user.token = token
            db.session.commit()
            
            flash('Login successful')
            return redirect(url_for('main_page'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/deducion')
@token_required
def protegido(current_user):
    return jsonify({'message': f'Bem-vindo, {current_user.username}!'})

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out')
    return redirect(url_for('login'))

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part'
        file = request.files['file']
        if file.filename == '':
            return 'No selected file'
        if file:
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            new_product = Product(
                name=request.form['name'],
                price=request.form['price'],
                description=request.form['description'],
                image_path=image_path
            )
            db.session.add(new_product)
            db.session.commit()
            return redirect(url_for('upload_file'))
    return render_template('upload.html')

@app.route('/products')
def list_products():
    products = Product.query.all()
    return render_template('products.html', products=products)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
