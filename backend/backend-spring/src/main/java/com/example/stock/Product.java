package com.example.stock;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int currentStock;
    private double dailySales;
    private int leadTime;

    public Product() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getCurrentStock() { return currentStock; }
    public double getDailySales() { return dailySales; }
    public int getLeadTime() { return leadTime; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCurrentStock(int value) {
        this.currentStock = value;
    }
    public void setDailySales(double value) {
        this.dailySales = value;
    }
    public void setLeadTime(int value) {
        this.leadTime = value;
    }
}
