CREATE DATABASE pxldb;

\c pxldb;

create user secadv with password 'randomPaswoord';
GRANT ALL PRIVILEGES ON DATABASE pxldb TO secadv;

BEGIN;

CREATE TABLE users (id serial PRIMARY KEY, user_name text NOT NULL UNIQUE, password text NOT NULL);
GRANT ALL PRIVILEGES ON TABLE users TO secadv;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO secadv;

COMMIT;
