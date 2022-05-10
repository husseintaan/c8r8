from app import db, ma

class Contact(db.Model):
    postid = db.Column(db.Integer, primary_key=True)
    posting_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    usercontact = db.Column(db.String(20), nullable=False)
    selling_amount = db.Column(db.Float, nullable=False)
    buying_amount = db.Column(db.Float, nullable=False)
    usd_to_lbp = db.Column(db.Boolean, nullable=False)
    
    def __init__(self, posting_user_id, usercontact, selling_amount, buying_amount, usd_to_lbp):
        super(Contact, self).__init__(posting_user_id = posting_user_id,
                                      usercontact = usercontact,
                                      selling_amount = selling_amount,
                                      buying_amount = buying_amount,
                                      usd_to_lbp = usd_to_lbp)


class ContactSchema(ma.Schema):
    class Meta:
        fields = ('postid', 'posting_user_id', 'usercontact', 'selling_amount', 'buying_amount', 'usd_to_lbp')
        model = Contact

    
