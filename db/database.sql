create database pxldb;

\c pxldb;

create table users (
    id serial primary key,
    user_name text not null unique,
    password text not null
);