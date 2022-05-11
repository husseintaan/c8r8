package com.dy.exchange.api.model;

import com.google.gson.annotations.SerializedName;

public class Balance {
    @SerializedName("usd_balance")
    public Integer usdb;
    @SerializedName("lbp_balance")
    public Integer lbpb;
}
