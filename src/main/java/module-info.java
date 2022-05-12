module com.dy.exchange {
    requires javafx.controls;
    requires javafx.fxml;
    requires retrofit2;
    requires java.sql;
    requires gson;
    requires retrofit2.converter.gson;
    requires java.prefs;


    opens com.dy.exchange to javafx.fxml;
    opens com.dy.exchange.api.model to javafx.base, gson;
    exports com.dy.exchange;
    opens com.dy.exchange.api to gson;
    exports com.dy.exchange.rates;
    opens com.dy.exchange.rates to javafx.fxml;
    opens com.dy.exchange.login to javafx.fxml;
    opens com.dy.exchange.register to javafx.fxml;
    opens com.dy.exchange.transactions to javafx.fxml;
    opens com.dy.exchange.graph to javafx.fxml;
    opens com.dy.exchange.insights to javafx.fxml;
    opens com.dy.exchange.posts to javafx.fxml;
    opens com.dy.exchange.balance to javafx.fxml;
}