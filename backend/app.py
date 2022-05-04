from flask import Flask, jsonify, abort
from flask import request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_bcrypt import Bcrypt
import jwt
import datetime
from dateutil import tz
SECRET_KEY = "b'|\xe7\xbfU3`\xc4\xec\xa7\xa9zf:}\xb5\xc7\xb9\x139^3@Dv'"

app = Flask(__name__)
ma = Marshmallow(app)
bcrypt = Bcrypt(app)

from .db_config import DB_CONFIG

app.config['SQLALCHEMY_DATABASE_URI'] = DB_CONFIG
CORS(app)
db = SQLAlchemy(app)

from .model.user import User, UserSchema
from .model.transaction import Transaction, TransactionSchema

user_schema = UserSchema()

transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)

def create_token(user_id):
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    payload = { 'exp': loc + datetime.timedelta(days=4),
                'iat': loc, 'sub': user_id }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def extract_auth_token(authenticated_request):
    auth_header = authenticated_request.headers.get('Authorization')
    if auth_header:
        return auth_header.split(" ")[1]
    else:
        return None

def decode_token(token):
    payload = jwt.decode(token, SECRET_KEY, 'HS256')
    return payload['sub']

@app.route('/transaction', methods=['POST'])
def add_transaction():
    usd = request.json['usd_amount']
    lbp = request.json['lbp_amount']
    u2l = request.json['usd_to_lbp']
    auth_token = extract_auth_token(request)
    if(auth_token and auth_token != "null"):
        try:
            decoded_token = decode_token(auth_token)
        except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
            return abort(403)
        t = Transaction(usd, lbp, u2l, decoded_token)
    else:
        t = Transaction(usd, lbp, u2l, None)
    if(usd == 0 and lbp == 0):
        return jsonify(message="USD and LBP amounts cannot be 0!")
    if (usd == 0):
        return jsonify(message="USD amount cannot be 0!")
    if (lbp == 0):
        return jsonify(message="LBP amount cannot be 0!")
    db.session.add(t)
    db.session.commit()
    return jsonify(transaction_schema.dump(t))

@app.route('/transaction', methods=['GET'])
def get_transaction():
    auth_token = extract_auth_token(request)
    if(auth_token):
        try:
            decoded_token = decode_token(auth_token)
        except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
            return abort(403)
        user_transactions = Transaction.query.filter_by(user_id=decoded_token)
        return jsonify(transactions_schema.dump(user_transactions))

@app.route('/exchangeRate', methods=['GET'])
def get_rates():
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    LIST_USD_TO_LBP = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp == 1).all()
    LIST_LBP_TO_USD = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp == 0).all()
    RATES_USD_TO_LBP = []
    RATES_LBP_TO_USD = []
    for transaction in LIST_USD_TO_LBP:
        RATES_USD_TO_LBP.append(transaction.lbp_amount/transaction.usd_amount)
    for transaction in LIST_LBP_TO_USD:
        RATES_LBP_TO_USD.append(transaction.lbp_amount/transaction.usd_amount)
    AVERAGE_USD_TO_LBP = 0
    AVERAGE_LBP_TO_USD = 0
    if(len(RATES_USD_TO_LBP)):
        AVERAGE_USD_TO_LBP = round(sum(RATES_USD_TO_LBP)/len(RATES_USD_TO_LBP), 2)
    if(len(RATES_LBP_TO_USD)):
        AVERAGE_LBP_TO_USD = round(sum(RATES_LBP_TO_USD)/len(RATES_LBP_TO_USD), 2)
    return jsonify(usd_to_lbp=AVERAGE_USD_TO_LBP, lbp_to_usd=AVERAGE_LBP_TO_USD)

@app.route('/user', methods=['POST'])
def add_user():
    uname = request.json['user_name']
    upass = request.json['password']
    u = User(uname, upass)
    if (uname == "" and upass == ""):
        return jsonify(message="Username and Password cannot be empty!")
    if (uname == ""):
        return jsonify(message="Username cannot be empty!")
    if (upass == ""):
        return jsonify(message="Password cannot be empty!")
    preexisting_user = User.query.filter_by(user_name=uname).first()
    if(preexisting_user):
        return abort(400)
    db.session.add(u)
    db.session.commit()
    return jsonify(user_schema.dump(u))

@app.route('/authentication', methods=['POST'])
def authenticate():
    uname = request.json['user_name']
    upass = request.json['password']
    u = User(uname, upass)
    if (uname == ""):
        return abort(400)
    if (upass == ""):
        return abort(400)
    existing_user = User.query.filter_by(user_name=uname).first()
    if(not existing_user):
        return abort(403)
    if(not bcrypt.check_password_hash(existing_user.hashed_password, upass)):
        return abort(403)
    tok = create_token(existing_user.id)
    return jsonify(token=tok)



