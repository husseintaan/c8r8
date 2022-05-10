from app import db, ma, bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(30), unique=True)
    hashed_password = db.Column(db.String(128))
    usd_balance = db.Column(db.Integer, nullable=1)
    lbp_balance = db.Column(db.Integer, nullable=1)
    usd_hold = db.Column(db.Integer, nullable=1)
    lbp_hold = db.Column(db.Integer, nullable=1)
    def __init__(self, user_name, password, ubalance, lbalance, uhold, lhold):
        super(User, self).__init__(user_name=user_name, usd_balance=ubalance, lbp_balance=lbalance,
                                                        usd_hold=uhold, lbp_hold=lhold)
        self.hashed_password = bcrypt.generate_password_hash(password)

class UserSchema(ma.Schema):
    class Meta:
        fields = ("id", "user_name", "usd_balance", "lbp_balance", "usd_hold", "lbp_hold")
        model = User