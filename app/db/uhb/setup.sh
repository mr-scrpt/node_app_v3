psql -f install.sql -U node_chat
PGPASSWORD=pgpass psql -d node_chat_lvl_2 -f structure.sql -U node_chat
PGPASSWORD=pgpass psql -d node_chat_lvl_2 -f data.sql -U node_chat
