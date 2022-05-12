package com.dy.exchange.api.model;

import com.google.gson.annotations.SerializedName;

public class Contact {

    @SerializedName("postid")
    public Integer postid;

    @SerializedName("post_user_id")
    public Integer postingUserId;

    @SerializedName("usercontact")
    public String usercontact;

    @SerializedName("selling_amount")
    public Integer sellingAmount;

    @SerializedName("buying_amount")
    public Integer buyingAmount;

    @SerializedName("usd_to_lbp")
    public Boolean usdToLbp;



    public Contact(String usercontact, Integer sellingAmount, Integer buyingAmount, Boolean usdToLbp) {
        this.usercontact = usercontact;
        this.sellingAmount = sellingAmount;
        this.buyingAmount = buyingAmount;
        this.usdToLbp = usdToLbp;
    }

}
