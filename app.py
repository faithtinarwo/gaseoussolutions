from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import click
from flask.cli import with_appcontext

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gaseous_solutions.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)  # Enable CORS for frontend-backend communication

# --- Database Models ---
class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    orders = db.relationship('GasOrder', backref='customer', lazy=True)

class GasType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    price_per_unit = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    unit_type = db.Column(db.String(20), default='cylinder')  # cylinder, cubic_meter, etc.

class GasOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    gas_type_id = db.Column(db.Integer, db.ForeignKey('gas_type.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_date = db.Column(db.DateTime, nullable=False)
    delivery_time_slot = db.Column(db.String(20))  # morning, afternoon, evening
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, delivered, cancelled
    total_price = db.Column(db.Float, nullable=False)
    special_instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    gas_type = db.relationship('GasType', backref='orders')

# --- API Routes ---

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/gas-types', methods=['GET'])
def get_gas_types():
    """Get all available gas types with pricing"""
    gas_types = GasType.query.filter(GasType.stock_quantity > 0).all()
    return jsonify([{
        'id': gas.id,
        'name': gas.name,
        'description': gas.description,
        'price_per_unit': gas.price_per_unit,
        'stock_quantity': gas.stock_quantity,
        'unit_type': gas.unit_type
    } for gas in gas_types])

@app.route('/api/register', methods=['POST'])
def register_customer():
    """Register a new customer"""
    data = request.json
    
    # Check if customer already exists
    existing_customer = Customer.query.filter_by(email=data['email']).first()
    if existing_customer:
        return jsonify({'error': 'Customer with this email already exists'}), 400
    
    # Create new customer
    new_customer = Customer(
        name=data['name'],
        email=data['email'],
        phone=data['phone'],
        address=data['address'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(new_customer)
    db.session.commit()
    
    return jsonify({'message': 'Customer registered successfully', 'customer_id': new_customer.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Customer login"""
    data = request.json
    customer = Customer.query.filter_by(email=data['email']).first()
    
    if customer and check_password_hash(customer.password_hash, data['password']):
        session['customer_id'] = customer.id
        return jsonify({
            'message': 'Login successful',
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/order', methods=['POST'])
def create_order():
    """Create a new gas order"""
    data = request.json
    
    # Validate customer
    customer = Customer.query.get(data['customer_id'])
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Validate gas type
    gas_type = GasType.query.get(data['gas_type_id'])
    if not gas_type:
        return jsonify({'error': 'Gas type not found'}), 404
    
    # Check stock availability
    if gas_type.stock_quantity < data['quantity']:
        return jsonify({'error': 'Insufficient stock'}), 400
    
    # Calculate total price
    total_price = gas_type.price_per_unit * data['quantity']
    
    # Generate order number
    order_number = f"GS{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    # Create order
    new_order = GasOrder(
        order_number=order_number,
        customer_id=data['customer_id'],
        gas_type_id=data['gas_type_id'],
        quantity=data['quantity'],
        delivery_address=data.get('delivery_address', customer.address),
        delivery_date=datetime.strptime(data['delivery_date'], '%Y-%m-%d'),
        delivery_time_slot=data.get('delivery_time_slot'),
        total_price=total_price,
        special_instructions=data.get('special_instructions')
    )
    
    # Update stock
    gas_type.stock_quantity -= data['quantity']
    
    db.session.add(new_order)
    db.session.commit()
    
    return jsonify({
        'message': 'Order created successfully',
        'order_number': order_number,
        'total_price': total_price,
        'order_id': new_order.id
    }), 201

@app.route('/api/orders/<int:customer_id>', methods=['GET'])
def get_customer_orders(customer_id):
    """Get all orders for a customer"""
    orders = GasOrder.query.filter_by(customer_id=customer_id).order_by(GasOrder.created_at.desc()).all()
    
    return jsonify([{
        'id': order.id,
        'order_number': order.order_number,
        'gas_type': order.gas_type.name,
        'quantity': order.quantity,
        'delivery_date': order.delivery_date.strftime('%Y-%m-%d'),
        'delivery_time_slot': order.delivery_time_slot,
        'status': order.status,
        'total_price': order.total_price,
        'created_at': order.created_at.strftime('%Y-%m-%d %H:%M')
    } for order in orders])

@app.route('/api/order/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    data = request.json
    order = GasOrder.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    order.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Order status updated successfully'})

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """Get current inventory status"""
    gas_types = GasType.query.all()
    return jsonify([{
        'id': gas.id,
        'name': gas.name,
        'stock_quantity': gas.stock_quantity,
        'price_per_unit': gas.price_per_unit
    } for gas in gas_types])

# --- Admin routes (simplified) ---
@app.route('/api/admin/add-gas-type', methods=['POST'])
def add_gas_type():
    """Add new gas type (admin only)"""
    data = request.json
    
    new_gas_type = GasType(
        name=data['name'],
        description=data.get('description', ''),
        price_per_unit=data['price_per_unit'],
        stock_quantity=data['stock_quantity'],
        unit_type=data.get('unit_type', 'cylinder')
    )
    
    db.session.add(new_gas_type)
    db.session.commit()
    
    return jsonify({'message': 'Gas type added successfully'}), 201

@app.route('/api/admin/update-stock', methods=['PUT'])
def update_stock():
    """Update gas type stock"""
    data = request.json
    gas_type = GasType.query.get(data['gas_type_id'])
    
    if not gas_type:
        return jsonify({'error': 'Gas type not found'}), 404
    
    gas_type.stock_quantity = data['stock_quantity']
    db.session.commit()
    
    return jsonify({'message': 'Stock updated successfully'})

# --- CLI Command for Database Initialization ---
@app.cli.command("init-db")
@with_appcontext
def init_db_command():
    """Clear existing data, create new tables, and add sample data."""
    db.create_all()
    
    # Add sample data only if the GasType table is empty
    if GasType.query.count() == 0:
        sample_gases = [
            GasType(name='Oxygen', description='Medical grade oxygen', price_per_unit=150.00, stock_quantity=50),
            GasType(name='Acetylene', description='Industrial acetylene', price_per_unit=200.00, stock_quantity=30),
            GasType(name='Nitrogen', description='High purity nitrogen', price_per_unit=120.00, stock_quantity=40),
            GasType(name='Propane', description='Commercial propane', price_per_unit=180.00, stock_quantity=25),
            GasType(name='Carbon Dioxide', description='Food grade CO2', price_per_unit=100.00, stock_quantity=35)
        ]
        
        db.session.add_all(sample_gases)
        db.session.commit()
        click.echo("Added sample gas types to the database.")

    click.echo("Initialized the database.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)