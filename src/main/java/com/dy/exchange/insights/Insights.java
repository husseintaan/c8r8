package com.dy.exchange.insights;

import com.dy.exchange.api.ExchangeService;
import com.dy.exchange.api.model.InsightsData;
import javafx.application.Platform;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.net.URL;
import java.util.Map;
import java.util.ResourceBundle;

public class Insights implements Initializable {
    public Label minusd;
    public Label stddevlbp;
    public Label maxlbpl;
    public Label maxusd;
    public Label medianlbp;
    public Label medianusd;


    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        fetchInsights();
    }

    private void fetchInsights() {
        ExchangeService.exchangeApi().getInsightsData().enqueue(new Callback<InsightsData>() {
            @Override
            public void onResponse(Call<InsightsData> call, Response<InsightsData> response) {
                InsightsData insightsData = response.body();
                Platform.runLater(() -> {
                    stddevlbp.setText(insightsData.stdvlbp.toString());
                    medianlbp.setText(insightsData.medlbp.toString());
                    medianusd.setText(insightsData.medusd.toString());
                    maxusd.setText(insightsData.maxusd.toString());
                    maxlbpl.setText(insightsData.maxlbp.toString());
                    minusd.setText(insightsData.minusd.toString());
                    //constructInsightsView(insightsData);
                });

            }
            @Override
            public void onFailure(Call<InsightsData> call, Throwable throwable) {
            }
        });
    }

    private void constructInsightsView(InsightsData insightsData) {
        //avg.setText(insightsData.lbpToUsdAverage.toString());
        //min.setText(insightsData.lbpToUsdAverage.toString());

    }
}
