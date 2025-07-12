-- VMB Database Schema Backup (Tables)
-- Generated on: Sat 26 Apr 2025 01:53:17 AM UTC
-- Note: This is a schema-only backup due to pg_dump version constraints in Replit

-- Database Tables
                List of relations
 Schema |       Name       | Type  |    Owner     
--------+------------------+-------+--------------
 public | activity_logs    | table | neondb_owner
 public | clients          | table | neondb_owner
 public | invitations      | table | neondb_owner
 public | salons           | table | neondb_owner
 public | style_selections | table | neondb_owner
 public | users            | table | neondb_owner
(6 rows)


-- Table Schemas

-- Schema for table: activity_logs
                                         Table "public.activity_logs"
   Column    |            Type             | Collation | Nullable |                  Default                  
-------------+-----------------------------+-----------+----------+-------------------------------------------
 id          | integer                     |           | not null | nextval('activity_logs_id_seq'::regclass)
 type        | text                        |           | not null | 
 description | text                        |           | not null | 
 user_id     | integer                     |           |          | 
 salon_id    | integer                     |           |          | 
 client_id   | integer                     |           |          | 
 timestamp   | timestamp without time zone |           | not null | 
Indexes:
    "activity_logs_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "activity_logs_client_id_clients_id_fk" FOREIGN KEY (client_id) REFERENCES clients(id)
    "activity_logs_salon_id_salons_id_fk" FOREIGN KEY (salon_id) REFERENCES salons(id)
    "activity_logs_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id)


-- Schema for table: clients
                                            Table "public.clients"
      Column       |            Type             | Collation | Nullable |               Default               
-------------------+-----------------------------+-----------+----------+-------------------------------------
 id                | integer                     |           | not null | nextval('clients_id_seq'::regclass)
 name              | text                        |           | not null | 
 phone             | text                        |           | not null | 
 email             | text                        |           | not null | 
 is_current_client | boolean                     |           | not null | false
 notes             | text                        |           |          | 
 favorite_services | jsonb                       |           |          | 
 type              | text                        |           | not null | 'client'::text
 created_at        | timestamp without time zone |           |          | now()
 salon_id          | integer                     |           |          | 
 salon_name        | text                        |           |          | 
 address           | text                        |           |          | 
 city              | text                        |           |          | 
 state             | text                        |           |          | 
 zip_code          | text                        |           |          | 
 social_media      | jsonb                       |           |          | 
 photo_url         | text                        |           |          | 
 sponsor           | text                        |           |          | 'Ven Me, Baby! LTD'::text
 sponsor_salon_id  | integer                     |           |          | 
 accepted_terms    | boolean                     |           |          | false
 sponsor_name      | text                        |           |          | 
Indexes:
    "clients_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "fk_sponsor_salon" FOREIGN KEY (sponsor_salon_id) REFERENCES salons(id)
Referenced by:
    TABLE "activity_logs" CONSTRAINT "activity_logs_client_id_clients_id_fk" FOREIGN KEY (client_id) REFERENCES clients(id)
    TABLE "invitations" CONSTRAINT "invitations_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES clients(id)
    TABLE "style_selections" CONSTRAINT "style_selections_client_id_clients_id_fk" FOREIGN KEY (client_id) REFERENCES clients(id)


-- Schema for table: invitations
                                            Table "public.invitations"
       Column       |            Type             | Collation | Nullable |                 Default                 
--------------------+-----------------------------+-----------+----------+-----------------------------------------
 id                 | integer                     |           | not null | nextval('invitations_id_seq'::regclass)
 name               | text                        |           | not null | 
 phone              | text                        |           | not null | 
 email              | text                        |           |          | 
 notes              | text                        |           |          | 
 favorite_services  | jsonb                       |           |          | 
 salon_id           | integer                     |           |          | 
 status             | text                        |           | not null | 'pending'::text
 created_at         | timestamp without time zone |           |          | now()
 sponsor            | text                        |           |          | 
 first_service_date | text                        |           |          | 
 invite_hash        | text                        |           |          | 
 sender_id          | integer                     |           |          | 
 message            | text                        |           |          | 
 type               | text                        |           |          | 
Indexes:
    "invitations_pkey" PRIMARY KEY, btree (id)
    "invitations_invite_hash_key" UNIQUE CONSTRAINT, btree (invite_hash)
Foreign-key constraints:
    "invitations_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES clients(id)


-- Schema for table: salons
                                           Table "public.salons"
     Column      |            Type             | Collation | Nullable |              Default               
-----------------+-----------------------------+-----------+----------+------------------------------------
 id              | integer                     |           | not null | nextval('salons_id_seq'::regclass)
 name            | text                        |           | not null | 
 owner_name      | text                        |           | not null | 
 phone           | text                        |           | not null | 
 email           | text                        |           | not null | 
 social_media    | jsonb                       |           |          | 
 type            | text                        |           | not null | 'salon'::text
 created_at      | timestamp without time zone |           |          | now()
 address         | text                        |           |          | 
 city            | text                        |           |          | 
 state           | text                        |           |          | 
 zip_code        | text                        |           |          | 
 services        | jsonb                       |           |          | 
 promos          | jsonb                       |           |          | 
 owner_photo_url | text                        |           |          | 
 schedule        | jsonb                       |           |          | 
Indexes:
    "salons_pkey" PRIMARY KEY, btree (id)
Referenced by:
    TABLE "activity_logs" CONSTRAINT "activity_logs_salon_id_salons_id_fk" FOREIGN KEY (salon_id) REFERENCES salons(id)
    TABLE "clients" CONSTRAINT "fk_sponsor_salon" FOREIGN KEY (sponsor_salon_id) REFERENCES salons(id)
    TABLE "style_selections" CONSTRAINT "style_selections_salon_id_salons_id_fk" FOREIGN KEY (salon_id) REFERENCES salons(id)


-- Schema for table: style_selections
                                         Table "public.style_selections"
   Column    |            Type             | Collation | Nullable |                   Default                    
-------------+-----------------------------+-----------+----------+----------------------------------------------
 id          | integer                     |           | not null | nextval('style_selections_id_seq'::regclass)
 client_id   | integer                     |           | not null | 
 style_id    | integer                     |           | not null | 
 salon_id    | integer                     |           | not null | 
 selected_at | timestamp without time zone |           | not null | 
 status      | text                        |           | not null | 'selected'::text
Indexes:
    "style_selections_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "style_selections_client_id_clients_id_fk" FOREIGN KEY (client_id) REFERENCES clients(id)
    "style_selections_salon_id_salons_id_fk" FOREIGN KEY (salon_id) REFERENCES salons(id)


-- Schema for table: users
                                        Table "public.users"
   Column   |            Type             | Collation | Nullable |              Default              
------------+-----------------------------+-----------+----------+-----------------------------------
 id         | integer                     |           | not null | nextval('users_id_seq'::regclass)
 username   | text                        |           | not null | 
 password   | text                        |           | not null | 
 created_at | timestamp without time zone |           |          | now()
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_username_unique" UNIQUE CONSTRAINT, btree (username)
Referenced by:
    TABLE "activity_logs" CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id)

