package com.dy.exchange.balance;

import com.dy.exchange.Authentication;
import com.dy.exchange.api.ExchangeService;
import com.dy.exchange.api.model.Contact;
import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.scene.control.RadioButton;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleGroup;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

//import static javax.swing.text.rtf.RTFAttributes.BooleanAttribute.True;

public class Posts implements Initializable {
    public Label lists;
    public TextField sellingAmount;
    public TextField buyingAmount;
    public ToggleGroup Type;
    public TextField usercontact;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        fetchListings();
    }

    private void fetchListings() {
        ExchangeService.exchangeApi().getListings().enqueue(new Callback<List<Contact>>() {
            @Override
            public void onResponse(Call<List<Contact>> call, Response<List<Contact>> response) {
                List<Contact> listings = response.body();
                Platform.runLater(() -> {
                    forumposts(listings);
                });
            }
            @Override
            public void onFailure(Call<List<Contact>> call, Throwable throwable) {
            }
        });
    }

    private void forumposts(List<Contact> listings) {
        lists.setText("");
        for(Contact listing : listings) {

                lists.setText(lists.getText() +
                        "\n\tTo buy: " + listing.sellingAmount + (listing.usdToLbp ? " USD" : " LBP") +
                        "\n\tFor: " + listing.buyingAmount + (listing.usdToLbp ? " LBP" : " USD") +
                        "\n\tCurrency Type: " + (listing.usdToLbp ? "USD To LBP" : "LBP To USD") +
                        "\n\t Contact Information: " + listing.usercontact + "\n\t---------------------------------------"+ "\n");

        }
    }

    public void addPost(ActionEvent actionEvent) {
        Contact listing = new Contact(
                usercontact.getText(),
                Integer.parseInt(sellingAmount.getText()),
                Integer.parseInt(buyingAmount.getText()),
                ((RadioButton) Type.getSelectedToggle()).getText().equals("USD TO LBP")
        );
        String userToken = Authentication.getInstance().getToken();
        String authHeader = userToken != null ? "Bearer " + userToken : null;
        ExchangeService.exchangeApi().addPost(listing, authHeader).enqueue(new Callback<Object>() {
            @Override
            public void onResponse(Call<Object> call, Response<Object> response) {
                fetchListings();
                Platform.runLater(() -> {
                    usercontact.setText("");
                    sellingAmount.setText("");
                    buyingAmount.setText("");
                });
            }
            @Override
            public void onFailure(Call<Object> call, Throwable throwable)
            {
            }
        });
    }
}