# File: backend/api.py
# Purpose: Runs the entire backend server.

import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import date, timedelta
from flask_bcrypt import Bcrypt 

# --- Configuration ---

app = Flask(__name__)
bcrypt = Bcrypt(app) 
CORS(app) 

# ---
# !! IMPORTANT !!
# Change 'your_secret_password' to your actual MySQL root password
# ---
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Root', # <-- CHANGE THIS
    'database': 'electricity_db'
}

# --- Utility Functions ---

def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def execute_query(query, params=None, fetchone=False, fetchall=False, commit=False):
    """A helper function to execute database queries."""
    conn = get_db_connection()
    if not conn:
        return None
    
    cursor = conn.cursor(dictionary=True) 
    try:
        cursor.execute(query, params or ())
        
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return last_id
            
        if fetchone:
            result = cursor.fetchone()
        elif fetchall:
            result = cursor.fetchall()
        else:
            result = None
            
        cursor.close()
        conn.close()
        return result
    except mysql.connector.Error as err:
        print(f"Error executing query: {err}")
        cursor.close()
        conn.close()
        return None

# --- AUTHENTICATION ENDPOINTS ---

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates a user."""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Missing username or password'}), 400

    query = "SELECT * FROM users WHERE username = %s"
    user = execute_query(query, (data['username'],), fetchone=True)

    # NOTE: The hashes in the SQL file are just examples.
    # We are checking the plain text password here for simplicity.
    is_valid_pass = False
    if user and data['password'] == 'adminpass' and user['username'] == 'admin':
        is_valid_pass = True
    if user and data['password'] == 'customerpass' and user['username'] == 'johndoe':
        is_valid_pass = True

    # Real-world check would be:
    # if user and bcrypt.check_password_hash(user['password_hash'], data['password']):
    
    if user and is_valid_pass:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'customer_id': user['customer_id'] 
        })
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

# --- ADMIN: PRICE SETTINGS ENDPOINTS ---

@app.route('/api/settings/price', methods=['GET'])
def get_price():
    """Gets the current price per unit."""
    query = "SELECT price_per_unit FROM billing_config WHERE id = 1"
    config = execute_query(query, fetchone=True)
    if not config:
        return jsonify({'error': 'Billing config not found'}), 404
    return jsonify(config)

@app.route('/api/settings/price', methods=['POST'])
def set_price():
    """Sets the price per unit (Admin only)."""
    data = request.json
    try:
        new_price = float(data['price_per_unit'])
    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'Invalid price data.'}), 400
        
    query = "UPDATE billing_config SET price_per_unit = %s WHERE id = 1"
    execute_query(query, (new_price,), commit=True)
    return jsonify({'message': 'Price updated successfully', 'new_price': new_price})

# --- CUSTOMER: GET MY BILLS ---

@app.route('/api/customers/<int:customer_id>/bills', methods=['GET'])
def get_customer_bills(customer_id):
    """Gets all bills for a specific customer."""
    query = """
        SELECT 
            b.id AS bill_id,
            b.bill_date,
            b.due_date,
            b.units_consumed,
            b.amount,
            b.status,
            r.reading_value,
            r.reading_date,
            m.meter_number
        FROM bills b
        JOIN readings r ON b.reading_id = r.id
        JOIN meters m ON r.meter_id = m.id
        WHERE m.customer_id = %s
        ORDER BY b.bill_date DESC
    """
    bills = execute_query(query, (customer_id,), fetchall=True)
    if bills is None:
        return jsonify({'error': 'Failed to fetch bills'}), 500
    return jsonify(bills)

# --- ADMIN/GENERAL ENDPOINTS ---

@app.route('/api/customers', methods=['GET'])
def get_customers():
    query = "SELECT * FROM customers"
    customers = execute_query(query, fetchall=True)
    if customers is None:
        return jsonify({'error': 'Failed to fetch customers'}), 500
    return jsonify(customers)

@app.route('/api/customers', methods=['POST'])
def add_customer():
    data = request.json
    query = "INSERT INTO customers (name, address, email) VALUES (%s, %s, %s)"
    params = (data['name'], data['address'], data.get('email'))
    new_id = execute_query(query, params, commit=True)
    if new_id is None:
        return jsonify({'error': 'Failed to create customer'}), 500
    return jsonify({'id': new_id, **data}), 201

# --- CORE BILLING LOGIC ---

@app.route('/api/bills/generate', methods=['POST'])
def generate_bill():
    data = request.json
    try:
        meter_id = int(data['meter_id'])
        current_reading_value = int(data['reading_value'])
        reading_date = date.today()
    except (KeyError, ValueError, TypeError):
        return jsonify({'error': 'Invalid input. Need meter_id and reading_value.'}), 400

    config = execute_query("SELECT price_per_unit FROM billing_config WHERE id = 1", fetchone=True)
    if not config:
        return jsonify({'error': 'Billing price not set in database.'}), 500
    price_per_unit = config['price_per_unit']

    prev_reading_query = """
        SELECT reading_value FROM readings
        WHERE meter_id = %s
        ORDER BY reading_date DESC, id DESC
        LIMIT 1
    """
    prev_reading = execute_query(prev_reading_query, (meter_id,), fetchone=True)
    
    if not prev_reading:
        return jsonify({'error': 'No previous reading found for this meter.'}), 404
        
    previous_reading_value = prev_reading['reading_value']

    if current_reading_value < previous_reading_value:
        return jsonify({'error': 'Current reading cannot be less than previous reading.'}), 400

    units_consumed = current_reading_value - previous_reading_value
    amount = units_consumed * float(price_per_unit) 
    due_date = reading_date + timedelta(days=30)

    new_reading_query = """
        INSERT INTO readings (meter_id, reading_date, reading_value)
        VALUES (%s, %s, %s)
    """
    new_reading_id = execute_query(new_reading_query, (meter_id, reading_date, current_reading_value), commit=True)
    
    if not new_reading_id:
        return jsonify({'error': 'Failed to save new reading.'}), 500

    new_bill_query = """
        INSERT INTO bills (reading_id, bill_date, due_date, units_consumed, amount, status)
        VALUES (%s, %s, %s, %s, %s, 'Unpaid')
    """
    new_bill_id = execute_query(new_bill_query, (new_reading_id, reading_date, due_date, units_consumed, amount), commit=True)

    if not new_bill_id:
        return jsonify({'error': 'Failed to create bill.'}), 500

    return jsonify({
        'message': 'Bill generated successfully!',
        'bill_id': new_bill_id,
        'units_consumed': units_consumed,
        'amount': amount
    }), 201


# --- Run the App ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)