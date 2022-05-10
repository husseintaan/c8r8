from flask import Flask, jsonify, abort
from flask import request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_bcrypt import Bcrypt
import jwt
import datetime
from dateutil import tz 
import statistics 
from datetime import date

SECRET_KEY = "b'|\xe7\xbfU3`\xc4\xec\xa7\xa9zf:}\xb5\xc7\xb9\x139^3@Dv'"

app = Flask(__name__)
ma = Marshmallow(app)
bcrypt = Bcrypt(app)

#from db_config import DB_CONFIG

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:200020052013@localhost:3306/exchange'
CORS(app)
db = SQLAlchemy(app)

from user import User, UserSchema
from contact import Contact, ContactSchema
from transaction import Transaction, TransactionSchema
from pending import Pending, PendingSchema

user_schema = UserSchema()

transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)

pending_schema = PendingSchema()
pendings_schema = PendingSchema(many=True)
contact_schema=ContactSchema(many=True)
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

@app.route('/transaction', methods=['POST', 'GET'])
def transaction():
    auth_token = extract_auth_token(request)
    decoded_token = None
    if(auth_token and auth_token != "null"):
        try:
            decoded_token = decode_token(auth_token)
        except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
            return abort(403)
    if(request.method =='POST'):
        usd = float(request.json['usd_amount'])
        lbp = float(request.json['lbp_amount'])
        u2l = int(request.json['usd_to_lbp'])
        t = Transaction(usd, lbp, u2l, None, decoded_token)
        if(usd == 0 or lbp == 0):
            return abort(403)
        db.session.add(t)
        db.session.commit()
        return jsonify(transaction_schema.dump(t))
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    user_teller_transactions = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.user_to_id==decoded_token, Transaction.user_from_id==None).all()
    from_user_transactions = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.user_from_id==decoded_token).all()
    to_user_transactions = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.user_to_id==decoded_token).all()
    user_user_transactions = []
    for t in to_user_transactions:
        if(t.user_from_id is not None):
            user_user_transactions.append(t)
    for t in from_user_transactions:
        user_user_transactions.append(t)
    allu = User.query.all()
    mapping={}
    for u in allu:
        mapping[u.id] = u.user_name
    return jsonify(teller=transactions_schema.dump(user_teller_transactions), 
                   user=transactions_schema.dump(user_user_transactions),
                   mapping=mapping) 



@app.route('/exchangeRate', methods=['GET'])
def get_rates():
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    LIST_USD_TO_LBP = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==1, Transaction.user_from_id == None).all()
    LIST_LBP_TO_USD = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==0, Transaction.user_from_id == None).all()
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
    u = User(uname, upass, 1000, 3000000, 0, 0)
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

@app.route('/usdbalance', methods=['GET'])
def get_usd_balance():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    u = User.query.filter_by(id=decoded_token).first()
    return u.usd_balance + u.usd_hold

@app.route('/lbpbalance', methods=['GET'])
def get_lbp_balance():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    u = User.query.filter_by(id=decoded_token).first()
    return u.lbp_balance + u.lbp_hold

@app.route('/balance', methods = ['GET'])
def get_balance():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    u = User.query.filter_by(id=decoded_token).first()
    return jsonify(usd_balance=u.usd_balance + u.usd_hold, lbp_balance=u.lbp_balance + u.lbp_hold)

@app.route('/timeline', methods=['POST', 'GET'])
def interuser():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    if(request.method == 'POST'):
        usd = float(request.json['usd_amount'])
        lbp = float(request.json['lbp_amount'])
        u2l = int(request.json['usd_to_lbp'])
        if(usd == 0 or lbp == 0):
            return abort(403)
        u = User.query.filter_by(id=decoded_token).first()
        if(u2l==1 and u.usd_balance<usd or u2l==0 and u.lbp_balance<lbp):
            return jsonify(message="Impossible")
        if(u2l):
            u.usd_balance -= usd
            u.usd_hold += usd
        else:
            u.lbp_balance -= lbp
            u.lbp_hold += lbp
        p = Pending(usd, lbp, u2l, decoded_token, u.user_name)
        db.session.add(p)
        db.session.commit()
        return jsonify(pending_schema.dump(p))
    user_pendings = Pending.query.all()
    other_user_pendings = []
    for up in user_pendings:
        if up.user_to_id != decoded_token:
            other_user_pendings.append(up)
    return jsonify(pendings_schema.dump(other_user_pendings))

@app.route('/timelineconfirm', methods=['POST'])
def confirm_interuser():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    curr_transaction_id = request.json['id']
    p = Pending.query.filter_by(id=curr_transaction_id).first()
    user_from = User.query.filter_by(id=decoded_token).first()
    user_to = User.query.filter_by(id=p.user_to_id).first()
    if(p.usd_to_lbp == 1 and user_from.lbp_balance < p.lbp_amount or p.usd_to_lbp == 0 and user_from.usd_balance < p.usd_amount):
        return jsonify(message="Impossible")
    if(p.usd_to_lbp == 1):
        user_from.usd_balance += p.usd_amount
        user_from.lbp_balance -= p.lbp_amount
        user_to.usd_hold -= p.usd_amount
        user_to.lbp_balance += p.lbp_amount
    else:
        user_from.lbp_balance += p.lbp_amount
        user_from.usd_balance -= p.usd_amount
        user_to.lbp_hold -= p.lbp_amount
        user_to.usd_balance += p.usd_amount
    t = Transaction(p.usd_amount, p.lbp_amount, p.usd_to_lbp, decoded_token, p.user_to_id)
    db.session.delete(p)
    #db.session.commit()
    db.session.add(t)
    db.session.commit()
    return jsonify(transaction_schema.dump(t))

@app.route('/mytimeline', methods=['GET'])
def my_timeline():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    user_pendings = Pending.query.filter_by(user_to_id=decoded_token).all()
    return jsonify(pendings_schema.dump(user_pendings))

@app.route('/deleterequest', methods=['POST'])
def delete_request():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    curr_transaction_id = request.json['id']
    p = Pending.query.filter_by(id=curr_transaction_id).first()
    u = User.query.filter_by(id=decoded_token).first()
    if(p.usd_to_lbp):
        u.usd_balance += p.usd_amount
        u.usd_hold -= p.usd_amount
    else:
        u.lbp_balance += p.lbp_amount
        u.lbp_hold -= p.lbp_amount
    db.session.delete(p)
    db.session.commit()
    return jsonify(pending_schema.dump(p))

@app.route('/plotall', methods=['GET'])
def plot_all():
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    LIST_USD_TO_LBP = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==1, Transaction.user_from_id == None).all()
    LIST_LBP_TO_USD = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==0, Transaction.user_from_id == None).all()
    RATES_USD_TO_LBP = []
    RATES_LBP_TO_USD = []
    for transaction in LIST_USD_TO_LBP:
        RATES_USD_TO_LBP.append(transaction.lbp_amount/transaction.usd_amount)
    for transaction in LIST_LBP_TO_USD:
        RATES_LBP_TO_USD.append(transaction.lbp_amount/transaction.usd_amount)
    return jsonify(usd_to_lbp_rates=RATES_USD_TO_LBP, lbp_to_usd_rates=RATES_LBP_TO_USD) 
@app.route('/graph', methods=['GET'])
def get_daily_rate():
    
    transactions = Transaction.query.all()

    usd_to_lbp_dict = {}
    lbp_to_usd_dict = {}

    today = datetime.datetime.now()
    for i in range(7):
        usd_to_lbp_dict[today.strftime("%Y-%m-%d")] = 0
        lbp_to_usd_dict[today.strftime("%Y-%m-%d")] = 0
        today = today - datetime.timedelta(days=1)

   
    for key in usd_to_lbp_dict:
        usd_to_lbp_dict[key] = get_usd_to_lbp_rate(key, transactions)
    for key in lbp_to_usd_dict:
        lbp_to_usd_dict[key] = get_lbp_to_usd_rate(key, transactions)

    return jsonify({'sell': usd_to_lbp_dict, 'buy': lbp_to_usd_dict}) 


@app.route('/plotuser', methods=['GET'])
def plot_user():
    auth_token = extract_auth_token(request)
    try:
        decoded_token = decode_token(auth_token)
    except jwt.InvalidTokenError or jwt.ExpiredSignatureError:
        return abort(403)
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    LIST_USD_TO_LBP_UTO = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==1, Transaction.user_to_id==decoded_token).all()
    LIST_LBP_TO_USD_UTO = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==0, Transaction.user_to_id==decoded_token).all()
    LIST_USD_TO_LBP_UFROM = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==1, Transaction.user_from_id==decoded_token).all()
    LIST_LBP_TO_USD_UFROM = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==0, Transaction.user_from_id==decoded_token).all()
    RATES_USD_TO_LBP_UTO = []
    RATES_LBP_TO_USD_UTO = []
    RATES_USD_TO_LBP_UFROM = []
    RATES_LBP_TO_USD_UFROM = []
    for transaction in LIST_USD_TO_LBP_UTO:
        RATES_USD_TO_LBP_UTO.append(transaction.lbp_amount/transaction.usd_amount)
    for transaction in LIST_LBP_TO_USD_UTO:
        RATES_LBP_TO_USD_UTO.append(transaction.lbp_amount/transaction.usd_amount)
    for transaction in LIST_USD_TO_LBP_UFROM:
        RATES_USD_TO_LBP_UFROM.append(transaction.lbp_amount/transaction.usd_amount)
    for transaction in LIST_LBP_TO_USD_UFROM:
        RATES_LBP_TO_USD_UFROM.append(transaction.lbp_amount/transaction.usd_amount)
    return jsonify(usd_to_lbp_rates_uto=RATES_USD_TO_LBP_UTO, lbp_to_usd_rates_uto=RATES_LBP_TO_USD_UTO,
            usd_to_lbp_rates_ufrom=RATES_USD_TO_LBP_UFROM, lbp_to_usd_rates_ufrom=RATES_LBP_TO_USD_UFROM)

@app.route('/fetcheverything', methods=['GET'])
def fetch():
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    utc = datetime.datetime.utcnow()
    utc = utc.replace(tzinfo=from_zone)
    loc = utc.astimezone(to_zone)
    START_DATE = loc - datetime.timedelta(days=3)
    END_DATE = loc
    LIST_USD_TO_LBP = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==1, Transaction.user_from_id == None).all()
    LIST_LBP_TO_USD = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE), Transaction.usd_to_lbp==0, Transaction.user_from_id == None).all()
    USD_TO_LBP = []
    LBP_TO_USD = []
    for transaction in LIST_USD_TO_LBP:
        USD_TO_LBP.append((transaction.usd_amount, transaction.lbp_amount))
    for transaction in LIST_LBP_TO_USD:
        LBP_TO_USD.append((transaction.usd_amount, transaction.lbp_amount))
    return jsonify(usd_to_lbp=USD_TO_LBP, lbp_to_usd=LBP_TO_USD) 

@app.route('/listing', methods=['POST'])
def add_listing():
    auth_token = extract_auth_token(request)
    usercontact = request.json['usercontact']
    selling_amount = request.json['selling_amount']
    buying_amount = request.json['buying_amount']
    usd_to_lbp = request.json['usd_to_lbp']

    try: 
        listing = Contact(posting_user_id=decode_token(auth_token) if auth_token else None,
                          usercontact=usercontact,
                          selling_amount=selling_amount,
                          buying_amount=buying_amount,
                          usd_to_lbp=usd_to_lbp)
        db.session.add(listing)
        db.session.commit()
    
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        abort(403)
    
    return jsonify(listing_schema.dump(listing))

@app.route('/statistics', methods = ['GET'])
def statistic():
    d = date.today()
    year = d.year
    print(year)
    END_DATE = datetime.datetime.now()
    START_DATE = datetime.datetime(2022, 3, 3)
    usd_to_lbp_transactions = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE),Transaction.usd_to_lbp == True).all()
    lbp_to_usd_transactions = Transaction.query.filter(Transaction.added_date.between(START_DATE, END_DATE),Transaction.usd_to_lbp == False).all()
    usd_to_lbp_transactions = transactions_schema.dump(usd_to_lbp_transactions)
    lbp_to_usd_transactions = transactions_schema.dump(lbp_to_usd_transactions)

    dollars = []
    liras = []
    for transaction in usd_to_lbp_transactions:
        dollars.append(transaction["lbp_amount"]/transaction["usd_amount"])

    for transaction in lbp_to_usd_transactions:
        liras.append(transaction["lbp_amount"]/transaction["usd_amount"])

    return jsonify({
        "year": year,
        "usd_to_lbp_StdDev": statistics.stdev(dollars),
        "lbp_to_usd_StdDev": statistics.stdev(liras),
        "usd_to_lbp_Average": statistics.mean(dollars),
        "lbp_to_usd_Average": statistics.mean(liras),
        "lbp_to_usd_Median": statistics.median(liras),
        "usd_to_lbp_Median": statistics.median(dollars),
        "usd_to_lbp_Max": max(dollars),
        "usd_to_lbp_Min": min(dollars),
        "lbp_to_usd_Max": max(liras),
        "lbp_to_usd_Min": min(liras)
    })
@app.route('/listings', methods=['GET'])
def get_listings():
    
    try:
        listings = Contact.query.all()
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        abort(403)

    return jsonify(contact_schema.dump(listings, many=True))
    
def get_usd_to_lbp_rate(date, transactions):

    daily_rate = []
    for i in transactions:
        if i.usd_to_lbp == True and i.added_date.strftime("%Y-%m-%d") == date:
            daily_rate.append(i.lbp_amount / i.usd_amount)
    if len(daily_rate) == 0:
        return 0
    return sum(daily_rate) / len(daily_rate)


def get_lbp_to_usd_rate(date, transactions):
    daily_rate = []
    for i in transactions:
        if i.usd_to_lbp == False and i.added_date.strftime("%Y-%m-%d") == date:
            daily_rate.append(i.lbp_amount / i.usd_amount)
    if len(daily_rate) == 0:
        return 0
    return sum(daily_rate) / len(daily_rate) 

