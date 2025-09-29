--
-- PostgreSQL database dump
--

\restrict cD3cIcXtJg6vbWHT7bwgZKjXZfdhH4zaSyrMToJCuP8kEWeSVrZXvzRXuVTBksz

-- Dumped from database version 17.6 (Debian 17.6-1.pgdg12+1)
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    id integer NOT NULL,
    user_id integer,
    notification_type character varying(100) NOT NULL,
    recipient_email character varying(255),
    email_status character varying(50) DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notification_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_logs_id_seq OWNED BY public.notification_logs.id;


--
-- Name: queue_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queue_status (
    id integer NOT NULL,
    current_user_pattern character varying(255),
    raw_content text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: queue_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.queue_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: queue_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.queue_status_id_seq OWNED BY public.queue_status.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    username_pattern character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telegram_username character varying(255),
    telegram_chat_id bigint,
    is_active boolean DEFAULT true,
    notified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    alternative_pattern character varying(50),
    last_notified timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: notification_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs ALTER COLUMN id SET DEFAULT nextval('public.notification_logs_id_seq'::regclass);


--
-- Name: queue_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_status ALTER COLUMN id SET DEFAULT nextval('public.queue_status_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: queue_status queue_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queue_status
    ADD CONSTRAINT queue_status_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_notification_logs_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs USING btree (sent_at DESC);


--
-- Name: idx_notification_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_logs_user_id ON public.notification_logs USING btree (user_id);


--
-- Name: idx_queue_status_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_queue_status_timestamp ON public.queue_status USING btree ("timestamp" DESC);


--
-- Name: idx_users_alternative_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_alternative_pattern ON public.users USING btree (alternative_pattern);


--
-- Name: idx_users_last_notified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_notified ON public.users USING btree (last_notified);


--
-- Name: idx_users_telegram_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_telegram_username ON public.users USING btree (telegram_username);


--
-- Name: idx_users_username_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username_pattern ON public.users USING btree (username_pattern);


--
-- Name: notification_logs notification_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict cD3cIcXtJg6vbWHT7bwgZKjXZfdhH4zaSyrMToJCuP8kEWeSVrZXvzRXuVTBksz

