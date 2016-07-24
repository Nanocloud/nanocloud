--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.3
-- Dumped by pg_dump version 9.5.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: accesstoken; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE accesstoken (
    "userId" text,
    token text,
    scope text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE accesstoken OWNER TO nanocloud;

--
-- Name: accesstoken_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE accesstoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE accesstoken_id_seq OWNER TO nanocloud;

--
-- Name: accesstoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE accesstoken_id_seq OWNED BY accesstoken.id;


--
-- Name: apps; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE apps (
    alias text,
    "displayName" text,
    "filePath" text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE apps OWNER TO nanocloud;

--
-- Name: apps_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE apps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE apps_id_seq OWNER TO nanocloud;

--
-- Name: apps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE apps_id_seq OWNED BY apps.id;


--
-- Name: client; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE client (
    name text,
    "clientId" text,
    "clientSecret" text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE client OWNER TO nanocloud;

--
-- Name: client_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE client_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE client_id_seq OWNER TO nanocloud;

--
-- Name: client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE client_id_seq OWNED BY client.id;


--
-- Name: config; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE config (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE config OWNER TO nanocloud;

--
-- Name: config_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE config_id_seq OWNER TO nanocloud;

--
-- Name: config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE config_id_seq OWNED BY config.id;


--
-- Name: file; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE file (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE file OWNER TO nanocloud;

--
-- Name: file_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE file_id_seq OWNER TO nanocloud;

--
-- Name: file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE file_id_seq OWNED BY file.id;


--
-- Name: group; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE "group" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE "group" OWNER TO nanocloud;

--
-- Name: group_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE group_id_seq OWNER TO nanocloud;

--
-- Name: group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE group_id_seq OWNED BY "group".id;


--
-- Name: history; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE history (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE history OWNER TO nanocloud;

--
-- Name: history_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE history_id_seq OWNER TO nanocloud;

--
-- Name: history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE history_id_seq OWNED BY history.id;


--
-- Name: machine; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE machine (
    name text,
    type text,
    ip text,
    status text,
    "adminPassword" text,
    platform text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE machine OWNER TO nanocloud;

--
-- Name: machine-driver; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE "machine-driver" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE "machine-driver" OWNER TO nanocloud;

--
-- Name: machine-driver_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE "machine-driver_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "machine-driver_id_seq" OWNER TO nanocloud;

--
-- Name: machine-driver_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE "machine-driver_id_seq" OWNED BY "machine-driver".id;


--
-- Name: machine_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE machine_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE machine_id_seq OWNER TO nanocloud;

--
-- Name: machine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE machine_id_seq OWNED BY machine.id;


--
-- Name: property; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE property (
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE property OWNER TO nanocloud;

--
-- Name: property_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE property_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE property_id_seq OWNER TO nanocloud;

--
-- Name: property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE property_id_seq OWNED BY property.id;


--
-- Name: refreshtoken; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE refreshtoken (
    "userId" text,
    token text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE refreshtoken OWNER TO nanocloud;

--
-- Name: refreshtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: nanocloud
--

CREATE SEQUENCE refreshtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE refreshtoken_id_seq OWNER TO nanocloud;

--
-- Name: refreshtoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanocloud
--

ALTER SEQUENCE refreshtoken_id_seq OWNED BY refreshtoken.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: nanocloud
--

CREATE TABLE "user" (
    id text NOT NULL,
    "firstName" text,
    "lastName" text,
    "hashedPassword" text,
    email text,
    activated boolean,
    "isAdmin" boolean,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE "user" OWNER TO nanocloud;

--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY accesstoken ALTER COLUMN id SET DEFAULT nextval('accesstoken_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY apps ALTER COLUMN id SET DEFAULT nextval('apps_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY client ALTER COLUMN id SET DEFAULT nextval('client_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY config ALTER COLUMN id SET DEFAULT nextval('config_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY file ALTER COLUMN id SET DEFAULT nextval('file_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY "group" ALTER COLUMN id SET DEFAULT nextval('group_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY history ALTER COLUMN id SET DEFAULT nextval('history_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY machine ALTER COLUMN id SET DEFAULT nextval('machine_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY "machine-driver" ALTER COLUMN id SET DEFAULT nextval('"machine-driver_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY property ALTER COLUMN id SET DEFAULT nextval('property_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY refreshtoken ALTER COLUMN id SET DEFAULT nextval('refreshtoken_id_seq'::regclass);


--
-- Data for Name: accesstoken; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY accesstoken ("userId", token, scope, id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: accesstoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('accesstoken_id_seq', 1, false);


--
-- Data for Name: apps; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY apps (alias, "displayName", "filePath", id, "createdAt", "updatedAt") FROM stdin;
Desktop	Desktop	C:Windowsexplorer.exe	1	2016-07-24 16:55:02+00	2016-07-24 16:55:02+00
\.


--
-- Name: apps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('apps_id_seq', 1, true);


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY client (name, "clientId", "clientSecret", id, "createdAt", "updatedAt") FROM stdin;
frontend	9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae		1	2016-07-24 16:55:02+00	2016-07-24 16:55:02+00
\.


--
-- Name: client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('client_id_seq', 1, true);


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY config (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('config_id_seq', 1, false);


--
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY file (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('file_id_seq', 1, false);


--
-- Data for Name: group; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY "group" (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('group_id_seq', 1, false);


--
-- Data for Name: history; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY history (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('history_id_seq', 1, false);


--
-- Data for Name: machine; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY machine (name, type, ip, plazaport, platform, id, "createdAt", "updatedAt") FROM stdin;
Manual static	\N	52.59.70.207	\N	manual	1	2016-07-24 16:55:02+00	2016-07-24 16:55:02+00
\.


--
-- Data for Name: machine-driver; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY "machine-driver" (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: machine-driver_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('"machine-driver_id_seq"', 1, false);


--
-- Name: machine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('machine_id_seq', 1, true);


--
-- Data for Name: property; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY property (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: property_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('property_id_seq', 1, false);


--
-- Data for Name: refreshtoken; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY refreshtoken ("userId", token, id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: refreshtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanocloud
--

SELECT pg_catalog.setval('refreshtoken_id_seq', 1, false);


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: nanocloud
--

COPY "user" (id, "firstName", "lastName", "hashedPassword", email, activated, "isAdmin", "createdAt", "updatedAt") FROM stdin;
aff17b8b-bf91-40bf-ace6-6dfc985680bb	Admin	Nanocloud	$2a$10$23CAm2ZFtyhHkXok8mbzuuFSEmEyzrdB5A0.bTehL1sSVaESs3avm	admin@nanocloud.com	t	t	2016-07-24 21:07:09+00	2016-07-24 21:07:09+00
\.


--
-- Name: accesstoken_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY accesstoken
    ADD CONSTRAINT accesstoken_pkey PRIMARY KEY (id);


--
-- Name: apps_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY apps
    ADD CONSTRAINT apps_pkey PRIMARY KEY (id);


--
-- Name: client_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY client
    ADD CONSTRAINT client_pkey PRIMARY KEY (id);


--
-- Name: config_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY config
    ADD CONSTRAINT config_pkey PRIMARY KEY (id);


--
-- Name: file_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);


--
-- Name: group_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY "group"
    ADD CONSTRAINT group_pkey PRIMARY KEY (id);


--
-- Name: history_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY history
    ADD CONSTRAINT history_pkey PRIMARY KEY (id);


--
-- Name: machine-driver_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY "machine-driver"
    ADD CONSTRAINT "machine-driver_pkey" PRIMARY KEY (id);


--
-- Name: machine_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY machine
    ADD CONSTRAINT machine_pkey PRIMARY KEY (id);


--
-- Name: property_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);


--
-- Name: refreshtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY refreshtoken
    ADD CONSTRAINT refreshtoken_pkey PRIMARY KEY (id);


--
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Owner: nanocloud
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_id; Type: INDEX; Schema: public; Owner: nanocloud
--

CREATE INDEX user_id ON "user" USING btree (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

