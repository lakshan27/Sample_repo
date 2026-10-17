package com.example.stock;

import java.util.*;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProductController {
    private final ProductRepository repo;
    private final RestTemplate rest;

    public ProductController(
            ProductRepository repo, RestTemplate rest) {
        this.repo = repo;
        this.rest = rest;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/products")
    public List<Product> getAll() {
        return repo.findAll();
    }

    @PostMapping("/products")
    public ResponseEntity<?> add(@RequestBody Product p) {
        if (p.getName() == null || p.getName().isBlank()
                || p.getCurrentStock() < 0
                || p.getDailySales() < 0
                || p.getLeadTime() < 1) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid product details"));
        }

        p.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(repo.save(p));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products/{id}/prediction")
    public ResponseEntity<?> predict(@PathVariable Long id) {
        Product p = repo.findById(id).orElse(null);

        if (p == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> input = new HashMap<>();
        input.put("daily_sales", p.getDailySales());
        input.put("lead_time", p.getLeadTime());
        input.put("current_stock", p.getCurrentStock());

        try {
            Map result = rest.postForObject(
                    "http://127.0.0.1:5000/predict",
                    input, Map.class
            );
            return ResponseEntity.ok(result);
        } catch (RestClientException e) {
            return ResponseEntity.status(503).body(
                    Map.of("error", "Start the Flask AI service on port 5000")
            );
        }
    }
}