DROP DATABASE IF EXISTS node_chat_lvl_2;
DROP USER IF EXISTS node_chat;
CREATE USER node_chat WITH PASSWORD 'pgpass';
CREATE DATABASE node_chat_lvl_2 OWNER node_chat;
