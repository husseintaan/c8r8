from app import db, ma
import datetime

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usd_amount = db.Column(db.Float, nullable=0)
    lbp_amount = db.Column(db.Float, nullable=0)
    usd_to_lbp = db.Column(db.Boolean, nullable=0)
    added_date = db.Column(db.DateTime)
    user_from_id = db.Column(db.Integer, nullable=1)
    user_to_id = db.Column(db.Integer)
    #user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    def __init__(self, uam, lam, utl, ufi, uti):
        super(Transaction, self).__init__(usd_amount=uam, lbp_amount=lam,
                                          usd_to_lbp=utl,
                                          added_date=datetime.datetime.now(),
                                          user_from_id=ufi, user_to_id=uti)


class TransactionSchema(ma.Schema):
    class Meta:
        fields = ("id", "usd_amount", "lbp_amount", "usd_to_lbp", "added_date", "user_from_id", "user_to_id")
        model = Transaction
