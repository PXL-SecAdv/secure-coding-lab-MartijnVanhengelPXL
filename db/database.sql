create database '${POSTGRES_DB}';
\c '${POSTGRES_DB}'

create user ${POSTGRES_USER} with password '${POSTGRES_PASSWORD}';
grant all privileges on database '${POSTGRES_DB}' to ${POSTGRES_USER};

BEGIN;

create table users (id serial primary key, user_name text not null unique, password text not null);
grant all privileges on table users to ${POSTGRES_USER};
GRANT USAGE, SELECT, UPDATE ON SEQUENCE users_id_seq TO ${POSTGRES_USER};

insert into users (user_name, password) values ('${USER_NAME_ADMIN}', '${USER_PWD_ADMIN}');
insert into users (user_name, password) values ('${USER_NAME_GRG}', '${USER_PWD_GRG}');

COMMIT;
