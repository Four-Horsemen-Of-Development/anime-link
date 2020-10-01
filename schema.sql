DROP TABLE IF EXISTS useranime;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS animes;
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(50) NOT NULL,
  country VARCHAR(255) NOT NULL
);
DROP TABLE animes;
CREATE TABLE IF NOT EXISTS animes (
  mal_id INT PRIMARY KEY NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  broadcast VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS useranime (
  is_favorite BOOLEAN DEFAULT false,
  is_watching BOOLEAN DEFAULT false,
  is_watched BOOLEAN DEFAULT false,
  following BOOLEAN DEFAULT false,
  mal_id INT REFERENCES animes (mal_id),
  user_id INT REFERENCES users (user_id),
  PRIMARY KEY(mal_id,user_id)
);

INSERT INTO users (username,password,country) VALUES ('abdallah','notahmad','France');