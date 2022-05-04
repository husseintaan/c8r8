from ..app import db, ma
import datetime

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usd_amount = db.Column(db.Float, nullable=0)
    lbp_amount = db.Column(db.Float, nullable=0)
    usd_to_lbp = db.Column(db.Boolean, nullable=0)
    added_date = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=1)

    def __init__(self, uam, lam, utl, uid):
        super(Transaction, self).__init__(usd_amount=uam, lbp_amount=lam,
                                          usd_to_lbp=utl, user_id=uid,
                                          added_date=datetime.datetime.now())


class TransactionSchema(ma.Schema):
    class Meta:
        fields = ("id", "usd_amount", "lbp_amount", "usd_to_lbp", "user_id", "added_date")
        model = Transaction
