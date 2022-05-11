package com.dy.exchange.api.model;

import com.google.gson.annotations.SerializedName;

import java.util.Map;

public class GraphDataPoints {

    @SerializedName("buy")
    public Map<String, Float> buyDataPoints;

    @SerializedName("sell")
    public Map<String, Float> sellDataPoints;

}
