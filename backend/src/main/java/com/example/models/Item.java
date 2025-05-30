package com.example.models;
import java.time.LocalDateTime;
import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "item")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long item_id;
    private String description;

    @Column(length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(name = "date_shared")
    private LocalDateTime dateShared;

    private Boolean deleted;

    @Enumerated(EnumType.STRING)
    private ItemType type;
    
    @Column(columnDefinition = "TEXT")
    private String image;

    @ManyToOne
    @JoinColumn(name = "users_id", referencedColumnName = "users_id", nullable = false, foreignKey = @ForeignKey(name = "fk_item_user"))
    private User user;

    @ManyToOne
    @JoinColumn(name = "location_id", referencedColumnName = "location_id", foreignKey = @ForeignKey(name = "fk_item_location"))
    private Location location;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

}
