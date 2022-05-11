package com.dy.exchange.rates;

import com.dy.exchange.Authentication;
import com.dy.exchange.api.ExchangeService;
import com.dy.exchange.api.model.ExchangeRates;
import com.dy.exchange.api.model.Transaction;
import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.scene.control.Label;
import javafx.scene.control.RadioButton;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleGroup;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class Rates {
    public Label buyUsdRateLabel;
    public Label sellUsdRateLabel;
    public Label sellConversionValueLabel;
    public Label buyConversionValueLabel;
    public TextField lbpTextField;
    public TextField usdTextField;
    public TextField conversionAmountTextField;
    public ToggleGroup transactionType;
    public ToggleGroup conversionType;

    public void initialize() {
        fetchRates();
    }
    private void fetchRates() {
        ExchangeService.exchangeApi().getExchangeRates().enqueue(new Callback<ExchangeRates>() {
             @Override
             public void onResponse(Call<ExchangeRates> call,Response<ExchangeRates> response) {
                 ExchangeRates exchangeRates = response.body();
                 Platform.runLater(() -> {

                     buyUsdRateLabel.setText(exchangeRates.lbpToUsd.toString());

                     sellUsdRateLabel.setText(exchangeRates.usdToLbp.toString());
                 });
             }
             @Override
             public void onFailure(Call<ExchangeRates> call, Throwable throwable) {
             }
        });
    }
    public void addTransaction(ActionEvent actionEvent) {
        Transaction transaction = new Transaction(
                Float.parseFloat(usdTextField.getText()),
                Float.parseFloat(lbpTextField.getText()),
                ((RadioButton) transactionType.getSelectedToggle()).getText().equals("Sell USD")
        );
        String userToken = Authentication.getInstance().getToken();
        String authHeader = userToken != null ? "Bearer " + userToken : null;
        ExchangeService.exchangeApi().addTransaction(transaction, authHeader).enqueue(new Callback<Object>() {
          @Override
          public void onResponse(Call<Object> call, Response<Object>
                  response) {
              fetchRates();
              Platform.runLater(() -> {
                  usdTextField.setText("");
                  lbpTextField.setText("");
              });
          }
          @Override
          public void onFailure(Call<Object> call, Throwable throwable)
          {
          }
        });
    }


    public void calculateConversion(ActionEvent actionEvent) {
        Float buyUsdRate = Float.parseFloat(buyUsdRateLabel.getText());
        Float sellUsdRate = Float.parseFloat(sellUsdRateLabel.getText());
        Float userInput = Float.parseFloat(conversionAmountTextField.getText());

        Boolean isUsdToLbp = ((RadioButton) conversionType.getSelectedToggle()).getText().equals("USD To LBP");

        if(isUsdToLbp) {
            sellConversionValueLabel.setText("Sell: " + String.valueOf((userInput * sellUsdRate)) + " LBP");
            buyConversionValueLabel.setText("Buy: " + String.valueOf((userInput * buyUsdRate))+ " LBP");
        }
        else{
            sellConversionValueLabel.setText("Sell: " + String.valueOf((userInput / sellUsdRate)) + " USD");
            buyConversionValueLabel.setText("Buy: " + String.valueOf((userInput / buyUsdRate)) + " USD");
        }

    }
}