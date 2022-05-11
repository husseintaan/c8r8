package com.dy.exchange.transactions;

import com.dy.exchange.Authentication;
import com.dy.exchange.api.ExchangeService;
import javafx.fxml.Initializable;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

public class Transaction implements Initializable {
    public TableColumn lbpAmount;
    public TableColumn usdAmount;
    public TableColumn transactionDate;
    public TableView tableView;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        lbpAmount.setCellValueFactory(new PropertyValueFactory<com.dy.exchange.api.model.Transaction, Long>("lbpAmount"));
        usdAmount.setCellValueFactory(new PropertyValueFactory<com.dy.exchange.api.model.Transaction, Long>("usdAmount"));
        transactionDate.setCellValueFactory(new PropertyValueFactory<com.dy.exchange.api.model.Transaction, String>("addedDate"));

        ExchangeService.exchangeApi().getTransactions("Bearer " + Authentication.getInstance().getToken())
                .enqueue(new Callback<List<com.dy.exchange.api.model.Transaction>>() {
                    @Override
                    public void onResponse(Call<List<com.dy.exchange.api.model.Transaction>> call, Response<List<com.dy.exchange.api.model.Transaction>> response) {
                        tableView.getItems().setAll(response.body());
                    }
                    @Override
                    public void onFailure(Call<List<com.dy.exchange.api.model.Transaction>> call, Throwable throwable) {
                    }
                });
    }

}
