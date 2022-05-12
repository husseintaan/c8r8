package com.dy.exchange;

import javafx.event.ActionEvent;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.layout.BorderPane;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

public class Parent implements Initializable, OnPageCompleteListener{
    public BorderPane borderPane;

    public Button transactionButton;
    public Button loginButton;
    public Button registerButton;
    public Button logoutButton;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        updateNavigation();
    }

    @Override
    public void onPageCompleted() {
        swapContent(Section.RATES);
    }

    public void ratesSelected() {
        swapContent(Section.RATES);
    }

    public void transactionsSelected() {
        swapContent(Section.TRANSACTIONS);
    }

    public void loginSelected() {
        swapContent(Section.LOGIN);
    }

    public void registerSelected() {
        swapContent(Section.REGISTER);
    }

    public void logoutSelected() {
        Authentication.getInstance().deleteToken();
        swapContent(Section.RATES);
    }

    public void graphSelected(ActionEvent actionEvent) {
        swapContent(Section.GRAPH);
    }

    public void insightsSelected(ActionEvent actionEvent) {
        swapContent(Section.INSIGHTS);
    }

    public void listingsSelected(ActionEvent actionEvent) {
        swapContent(Section.LISTINGS);
    }

    private void swapContent(Section section) {
        try {
            URL url = getClass().getResource(section.getResource());
            FXMLLoader loader = new FXMLLoader(url);
            borderPane.setCenter(loader.load());
            if (section.doesComplete()) {
                ((PageCompleter) loader.getController()).setOnPageCompleteListener(this);
            }
            updateNavigation();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void updateNavigation() {
        boolean authenticated = Authentication.getInstance().getToken() !=
                null;
        transactionButton.setManaged(authenticated);
        transactionButton.setVisible(authenticated);
        loginButton.setManaged(!authenticated);
        loginButton.setVisible(!authenticated);
        registerButton.setManaged(!authenticated);
        registerButton.setVisible(!authenticated);
        logoutButton.setManaged(authenticated);
        logoutButton.setVisible(authenticated);
    }

    private enum Section {
        RATES,
        TRANSACTIONS,
        LOGIN,
        REGISTER,
        GRAPH,
        INSIGHTS,
        LISTINGS;
        public String getResource() {
            return switch (this) {
                case RATES ->
                        "/rates/rates.fxml";
                case TRANSACTIONS ->
                        "/com/dy/exchange/transactions/transactions.fxml";
                case LOGIN ->
                        "/com/dy/exchange/login/login.fxml";
                case REGISTER ->
                        "/com/dy/exchange/register/register.fxml";
                case GRAPH ->
                        "/com/dy/exchange/graph/graph.fxml";
                case INSIGHTS ->
                        "/com/dy/exchange/insights/insights.fxml";
                case LISTINGS ->
                        "/com/dy/exchange/posts/posts.fxml";
                default -> null;
            };
        }

        public boolean doesComplete() {
            return switch (this) {
                case LOGIN, REGISTER -> true;
                default -> false;
            };
        }
    }
}
