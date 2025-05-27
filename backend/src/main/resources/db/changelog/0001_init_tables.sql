


CREATE TYPE log_action AS ENUM (
    'LOG_IN', 'LOG_OUT',
    'CREATE', 'UPDATE', 'DELETE',
    'PASSWORD_CHANGE', 'FAILED_LOGIN',
    'USER_REGISTERED', 'BAN_USER', 'UNBAN_USER',
    'RESET_PASSWORD', 'EMAIL_UPDATE'
);

CREATE TYPE category_enum AS ENUM (
    ('Accessories', 'Clothing', 'Cards', 'Electronics', 'Other');
);


CREATE TABLE users(
       users_id BIGSERIAL primary key,
       name varchar(255) NOT NULL,
       middle_name varchar(255),
       surname varchar(255) NOT NULL,
       nickname varchar(30) UNIQUE NOT NULL,
       uni_mail varchar(255) UNIQUE NOT NULL
                CHECK (uni_mail LIKE '%@std.iyte.edu.tr' OR uni_mail LIKE '%@std.iyte.edu.tr'),
       password varchar(40) NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       banned_status BOOLEAN NOT NULL DEFAULT FALSE,
       role varchar(255) NOT NULL
);

CREATE TABLE Country (
       country_id SERIAL PRIMARY KEY,
       name VARCHAR(100) UNIQUE NOT NULL,
       phone_code VARCHAR(10) NOT NULL
);

CREATE TABLE logrecords (
    records_id BIGSERIAL primary key,
    action log_action NOT NULL,
    log_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    users_ID BIGINT NOT NULL,
    FOREIGN KEY (users_ID) REFERENCES users(users_id) ON DELETE CASCADE
);
CREATE TABLE location(
    location_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE item(
    item_id BIGSERIAL primary key,
    description TEXT,
    category category_enum NOT NULL,
    location_ID BIGINT REFERENCES Location(location_id) ON DELETE SET NULL,
    date_shared TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image TEXT,
    type VARCHAR(10) CHECK (type IN ('Lost', 'Found')),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    users_ID BIGINT NOT NULL,
    FOREIGN KEY (users_ID) REFERENCES users(users_id) ON DELETE CASCADE
);

INSERT INTO Location (name) VALUES
                                ('Bilgisayar Mühendisliği'),
                                ('Elektrik Elektronik Mühendisliği'),
                                ('Makine Mühendisliği'),
                                ('Kimya Mühendisliği'),
                                ('Mimarlık'),
                                ('Şehir ve Bölge Planlama'),
                                ('Fizik'),
                                ('Kimya'),
                                ('Matematik'),
                                ('Çevre Mühendisliği'),
                                ('Genel Kültür Binası'),
                                ('Gıda Mühendisliği'),
                                ('Moleküler Biyoloji ve Genetik'),
                                ('Endüstri Mühendisliği'),
                                ('İnşaat Mühendisliği'),
                                ('Bilim Parkı'),
                                ('Şenlik Alanı'),
                                ('Gösteri Merkezi'),
                                ('Hazırlık Binası'),
                                ('Üniyurt'),
                                ('Teknopark'),
                                ('Merkezi Yemekhane'),
                                ('Erkek KYK'),
                                ('Kız KYK'),
                                ('Villa Erkek'),
                                ('Villa Kız'),
                                ('Erkek AFAD Yemekhane'),
                                ('Kız KYK Yemekhane'),
                                ('Kütüphane'),
                                ('Erdal Saygın Amfisi'),
                                ('Gülbahçe'),
                                ('Toplu Taşıma'),
                                ('Spor Salonu'),
                                ('Rektörlük'),
                                ('Asmalı'),
                                ('Kafe/Restoran'),
                                ('Halısaha'),
                                ('Durak'),
                                ('Other');

CREATE TABLE messages(
    message_id BIGSERIAL PRIMARY KEY,
    sender_ID BIGINT,
    receiver_ID BIGINT,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_ID) REFERENCES users(users_id) ON DELETE SET NULL ,
    FOREIGN KEY (receiver_ID) REFERENCES users(users_id) ON DELETE SET NULL
);
