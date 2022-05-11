package com.dy.exchange.api.model;

import com.google.gson.annotations.SerializedName;


public class InsightsData {
    //@SerializedName("lbp_to_usd_StdDev")
    //public String lbpToUsdAverage;

    @SerializedName("lbp_to_usd_StdDev")
    public String stdvlbp;
    @SerializedName("lbp_to_usd_Median")
    public String medlbp;
    @SerializedName("usd_to_lbp_Median")
    public String medusd;
    @SerializedName("usd_to_lbp_Max")
    public String maxusd;
    @SerializedName("usd_to_lbp_Min")
    public String minusd;
    @SerializedName("lbp_to_usd_Max")
    public String maxlbp;
    @SerializedName("lbp_to_usd_Min")
    public String minlbp;



}

//"usd_to_lbp_StdDev": statistics.stdev(dollars),
//        "lbp_to_usd_StdDev": statistics.stdev(liras),
//        "lbp_to_usd_Median": statistics.median(liras),
//        "usd_to_lbp_Median": statistics.median(dollars),
//        "usd_to_lbp_Max": max(dollars),
//        "usd_to_lbp_Min": min(dollars),
//        "lbp_to_usd_Max": max(liras),
//        "lbp_to_usd_Min": min(liras)