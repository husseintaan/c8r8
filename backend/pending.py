from app import db, ma

class Pending(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usd_amount = db.Column(db.Float, nullable=0)
    lbp_amount = db.Column(db.Float, nullable=0)
    usd_to_lbp = db.Column(db.Boolean, nullable=0)
    user_to_id = db.Column(db.Integer, nullable=0)

    def __init__(self, uam, lam, utl, uti):
        super(Pending, self).__init__(usd_amount=uam, lbp_amount=lam,
                                          usd_to_lbp=utl, user_to_id=uti)


class PendingSchema(ma.Schema):
    class Meta:
        fields = ("id", "usd_amount", "lbp_amount", "usd_to_lbp", "user_to_id")
        model = Pending
