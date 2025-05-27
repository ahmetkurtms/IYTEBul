package com.example.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "logrecords")
public class LogRecords {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "records_id")
    private Long record_id;

    @Enumerated(EnumType.STRING)
    private LogAction action;
    private LocalDateTime log_date;



    @ManyToOne
    @JoinColumn(name = "users_ID", referencedColumnName = "users_id", foreignKey = @ForeignKey(name = "fk_log_user"))
    private User user;

}
