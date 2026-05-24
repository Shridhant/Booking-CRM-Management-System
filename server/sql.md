-- public.audit_logs definition

-- Drop table

-- DROP TABLE public.audit_logs;

CREATE TABLE public.audit_logs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NULL,
	business_id uuid NULL,
	"action" varchar(255) NOT NULL,
	entity_type varchar(100) NULL,
	entity_id uuid NULL,
	metadata jsonb NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);


-- public.availability definition

-- Drop table

-- DROP TABLE public.availability;

CREATE TABLE public.availability (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	provider_type varchar(50) NOT NULL,
	provider_id uuid NOT NULL,
	branch_id uuid NULL,
	day_of_week int4 NOT NULL,
	start_time time NOT NULL,
	end_time time NOT NULL,
	is_off bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
	CONSTRAINT availability_pkey PRIMARY KEY (id),
	CONSTRAINT availability_provider_type_check CHECK (((provider_type)::text = ANY ((ARRAY['employee'::character varying, 'business'::character varying])::text[])))
);


-- public.booking_assignment_history definition

-- Drop table

-- DROP TABLE public.booking_assignment_history;

CREATE TABLE public.booking_assignment_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	booking_id uuid NOT NULL,
	old_employee_id uuid NULL,
	new_employee_id uuid NULL,
	changed_by_user_id uuid NULL,
	changed_at timestamp DEFAULT now() NULL,
	CONSTRAINT booking_assignment_history_pkey PRIMARY KEY (id)
);


-- public.booking_services definition

-- Drop table

-- DROP TABLE public.booking_services;

CREATE TABLE public.booking_services (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	booking_id uuid NOT NULL,
	service_id uuid NOT NULL,
	employee_id uuid NULL,
	price numeric(10, 2) NOT NULL,
	duration_minutes int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT booking_services_pkey PRIMARY KEY (id)
);


-- public.bookings definition

-- Drop table

-- DROP TABLE public.bookings;

CREATE TABLE public.bookings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	customer_user_id uuid NULL,
	business_id uuid NOT NULL,
	branch_id uuid NULL,
	employee_id uuid NULL,
	promo_code_id uuid NULL,
	booking_date date NOT NULL,
	start_time time NOT NULL,
	end_time time NOT NULL,
	booking_status varchar(50) DEFAULT 'pending'::character varying NULL,
	assignment_status varchar(50) DEFAULT 'pending_assignment'::character varying NULL,
	payment_status varchar(50) DEFAULT 'pending'::character varying NULL,
	payment_type varchar(50) DEFAULT 'pay_at_salon'::character varying NULL,
	total_amount numeric(10, 2) DEFAULT 0 NULL,
	discount_amount numeric(10, 2) DEFAULT 0 NULL,
	notes text NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	customer_id uuid NULL,
	CONSTRAINT bookings_assignment_status_check CHECK (((assignment_status)::text = ANY ((ARRAY['pending_assignment'::character varying, 'assigned'::character varying, 'reassigned'::character varying])::text[]))),
	CONSTRAINT bookings_booking_status_check CHECK (((booking_status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying])::text[]))),
	CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))),
	CONSTRAINT bookings_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['pay_online'::character varying, 'pay_at_salon'::character varying])::text[]))),
	CONSTRAINT bookings_pkey PRIMARY KEY (id)
);


-- public.business_branches definition

-- Drop table

-- DROP TABLE public.business_branches;

CREATE TABLE public.business_branches (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	address text NULL,
	city varchar(255) NULL,
	latitude numeric(10, 8) NULL,
	longitude numeric(11, 8) NULL,
	opening_time time NULL,
	closing_time time NULL,
	phone varchar(30) NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT business_branches_pkey PRIMARY KEY (id)
);


-- public.business_gallery definition

-- Drop table

-- DROP TABLE public.business_gallery;

CREATE TABLE public.business_gallery (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	media_id uuid NOT NULL,
	sort_order int4 DEFAULT 0 NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT business_gallery_pkey PRIMARY KEY (id)
);


-- public.business_settings definition

-- Drop table

-- DROP TABLE public.business_settings;

CREATE TABLE public.business_settings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	allow_online_payment bool DEFAULT true NULL,
	allow_pay_at_salon bool DEFAULT true NULL,
	booking_buffer_minutes int4 DEFAULT 0 NULL,
	cancellation_hours_limit int4 DEFAULT 24 NULL,
	timezone varchar(100) DEFAULT 'Asia/Kolkata'::character varying NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT business_settings_business_id_key UNIQUE (business_id),
	CONSTRAINT business_settings_pkey PRIMARY KEY (id)
);


-- public.businesses definition

-- Drop table

-- DROP TABLE public.businesses;

CREATE TABLE public.businesses (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	owner_user_id uuid NOT NULL,
	business_type varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	slug varchar(255) NOT NULL,
	description text NULL,
	logo_media_id uuid NULL,
	cover_media_id uuid NULL,
	phone varchar(30) NULL,
	email varchar(255) NULL,
	address text NULL,
	city varchar(255) NULL,
	latitude numeric(10, 8) NULL,
	longitude numeric(11, 8) NULL,
	is_verified bool DEFAULT false NULL,
	booking_type varchar(50) DEFAULT 'free_booking'::character varying NULL,
	allow_employee_selection bool DEFAULT true NULL,
	auto_assign_strategy varchar(50) DEFAULT 'manual'::character varying NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT businesses_auto_assign_strategy_check CHECK (((auto_assign_strategy)::text = ANY ((ARRAY['manual'::character varying, 'least_busy'::character varying, 'round_robin'::character varying, 'random'::character varying])::text[]))),
	CONSTRAINT businesses_booking_type_check CHECK (((booking_type)::text = ANY ((ARRAY['free_booking'::character varying, 'pay_online_required'::character varying, 'partial_advance'::character varying])::text[]))),
	CONSTRAINT businesses_business_type_check CHECK (((business_type)::text = ANY ((ARRAY['salon'::character varying, 'spa'::character varying, 'nail_studio'::character varying, 'barber'::character varying, 'makeup_studio'::character varying, 'professional'::character varying])::text[]))),
	CONSTRAINT businesses_pkey PRIMARY KEY (id),
	CONSTRAINT businesses_slug_key UNIQUE (slug)
);


-- public.cancellations definition

-- Drop table

-- DROP TABLE public.cancellations;

CREATE TABLE public.cancellations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	booking_id uuid NOT NULL,
	cancelled_by_user_id uuid NULL,
	reason text NULL,
	refund_amount numeric(10, 2) DEFAULT 0 NULL,
	refund_status varchar(50) DEFAULT 'not_applicable'::character varying NULL,
	cancelled_at timestamp DEFAULT now() NULL,
	CONSTRAINT cancellations_pkey PRIMARY KEY (id),
	CONSTRAINT cancellations_refund_status_check CHECK (((refund_status)::text = ANY ((ARRAY['not_applicable'::character varying, 'pending'::character varying, 'processed'::character varying, 'declined'::character varying])::text[])))
);


-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	phone varchar(30) NULL,
	email varchar(255) NULL,
	notes text NULL,
	user_id uuid NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT customers_pkey PRIMARY KEY (id)
);


-- public.employee_branches definition

-- Drop table

-- DROP TABLE public.employee_branches;

CREATE TABLE public.employee_branches (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	branch_id uuid NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT employee_branches_employee_id_branch_id_key UNIQUE (employee_id, branch_id),
	CONSTRAINT employee_branches_pkey PRIMARY KEY (id)
);


-- public.employee_time_off definition

-- Drop table

-- DROP TABLE public.employee_time_off;

CREATE TABLE public.employee_time_off (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	start_datetime timestamp NOT NULL,
	end_datetime timestamp NOT NULL,
	reason text NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT employee_time_off_pkey PRIMARY KEY (id)
);


-- public.employees definition

-- Drop table

-- DROP TABLE public.employees;

CREATE TABLE public.employees (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	branch_id uuid NULL,
	user_id uuid NULL,
	"name" varchar(255) NOT NULL,
	bio text NULL,
	experience_years int4 DEFAULT 0 NULL,
	profile_media_id uuid NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT employees_pkey PRIMARY KEY (id)
);


-- public.favorites definition

-- Drop table

-- DROP TABLE public.favorites;

CREATE TABLE public.favorites (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	customer_user_id uuid NOT NULL,
	business_id uuid NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT favorites_customer_user_id_business_id_key UNIQUE (customer_user_id, business_id),
	CONSTRAINT favorites_pkey PRIMARY KEY (id)
);


-- public.media definition

-- Drop table

-- DROP TABLE public.media;

CREATE TABLE public.media (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	uploaded_by_user_id uuid NULL,
	url text NOT NULL,
	mime_type varchar(100) NULL,
	"type" varchar(50) NULL,
	"size" int8 NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT media_pkey PRIMARY KEY (id)
);


-- public.notifications definition

-- Drop table

-- DROP TABLE public.notifications;

CREATE TABLE public.notifications (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	title varchar(255) NULL,
	message text NULL,
	"type" varchar(50) NULL,
	related_entity_type varchar(100) NULL,
	related_entity_id uuid NULL,
	status varchar(50) DEFAULT 'unread'::character varying NULL,
	sent_at timestamp NULL,
	read_at timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT notifications_pkey PRIMARY KEY (id),
	CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['unread'::character varying, 'read'::character varying])::text[])))
);


-- public.payments definition

-- Drop table

-- DROP TABLE public.payments;

CREATE TABLE public.payments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	booking_id uuid NOT NULL,
	amount numeric(10, 2) NOT NULL,
	payment_gateway varchar(100) NULL,
	transaction_id varchar(255) NULL,
	status varchar(50) DEFAULT 'pending'::character varying NULL,
	paid_at timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT payments_pkey PRIMARY KEY (id),
	CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


-- public.promo_codes definition

-- Drop table

-- DROP TABLE public.promo_codes;

CREATE TABLE public.promo_codes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NULL,
	code varchar(100) NOT NULL,
	description text NULL,
	discount_type varchar(20) NOT NULL,
	discount_value numeric(10, 2) NOT NULL,
	min_order_amount numeric(10, 2) DEFAULT 0 NULL,
	max_discount_amount numeric(10, 2) NULL,
	usage_limit int4 NULL,
	usage_count int4 DEFAULT 0 NULL,
	valid_from timestamp NULL,
	valid_until timestamp NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT promo_codes_code_key UNIQUE (code),
	CONSTRAINT promo_codes_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'flat'::character varying])::text[]))),
	CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);


-- public.reviews definition

-- Drop table

-- DROP TABLE public.reviews;

CREATE TABLE public.reviews (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	booking_id uuid NOT NULL,
	customer_user_id uuid NOT NULL,
	business_id uuid NOT NULL,
	rating int4 NOT NULL,
	"comment" text NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT reviews_pkey PRIMARY KEY (id),
	CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


-- public.service_categories definition

-- Drop table

-- DROP TABLE public.service_categories;

CREATE TABLE public.service_categories (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	sort_order int4 DEFAULT 0 NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT service_categories_pkey PRIMARY KEY (id)
);


-- public.service_employees definition

-- Drop table

-- DROP TABLE public.service_employees;

CREATE TABLE public.service_employees (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	service_id uuid NOT NULL,
	employee_id uuid NOT NULL,
	custom_price numeric(10, 2) NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT service_employees_pkey PRIMARY KEY (id),
	CONSTRAINT service_employees_service_id_employee_id_key UNIQUE (service_id, employee_id)
);


-- public.service_media definition

-- Drop table

-- DROP TABLE public.service_media;

CREATE TABLE public.service_media (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	service_id uuid NOT NULL,
	media_id uuid NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT service_media_pkey PRIMARY KEY (id)
);


-- public.services definition

-- Drop table

-- DROP TABLE public.services;

CREATE TABLE public.services (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	category_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	duration_minutes int4 NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	min_price numeric(10, 2) DEFAULT 0 NOT NULL,
	max_price numeric(10, 2) NULL,
	CONSTRAINT services_pkey PRIMARY KEY (id)
);


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	phone varchar(30) NULL,
	password_hash text NOT NULL,
	"role" varchar(50) NOT NULL,
	profile_media_id uuid NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_phone_key UNIQUE (phone),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'business_admin'::character varying, 'professional'::character varying, 'employee'::character varying, 'customer'::character varying])::text[])))
);


-- public.waitlist definition

-- Drop table

-- DROP TABLE public.waitlist;

CREATE TABLE public.waitlist (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	business_id uuid NOT NULL,
	branch_id uuid NULL,
	customer_user_id uuid NOT NULL,
	service_id uuid NULL,
	employee_id uuid NULL,
	preferred_date date NULL,
	preferred_start_time time NULL,
	preferred_end_time time NULL,
	status varchar(50) DEFAULT 'waiting'::character varying NULL,
	notified_at timestamp NULL,
	expires_at timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT waitlist_pkey PRIMARY KEY (id),
	CONSTRAINT waitlist_status_check CHECK (((status)::text = ANY ((ARRAY['waiting'::character varying, 'notified'::character varying, 'booked'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


-- public.audit_logs foreign keys

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.availability foreign keys

ALTER TABLE public.availability ADD CONSTRAINT availability_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.business_branches(id) ON DELETE CASCADE;


-- public.booking_assignment_history foreign keys

ALTER TABLE public.booking_assignment_history ADD CONSTRAINT booking_assignment_history_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.booking_assignment_history ADD CONSTRAINT booking_assignment_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.booking_assignment_history ADD CONSTRAINT booking_assignment_history_new_employee_id_fkey FOREIGN KEY (new_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.booking_assignment_history ADD CONSTRAINT booking_assignment_history_old_employee_id_fkey FOREIGN KEY (old_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


-- public.booking_services foreign keys

ALTER TABLE public.booking_services ADD CONSTRAINT booking_services_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.booking_services ADD CONSTRAINT booking_services_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.booking_services ADD CONSTRAINT booking_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


-- public.bookings foreign keys

ALTER TABLE public.bookings ADD CONSTRAINT bookings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.business_branches(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE SET NULL;


-- public.business_branches foreign keys

ALTER TABLE public.business_branches ADD CONSTRAINT business_branches_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- public.business_gallery foreign keys

ALTER TABLE public.business_gallery ADD CONSTRAINT business_gallery_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.business_gallery ADD CONSTRAINT business_gallery_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


-- public.business_settings foreign keys

ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- public.businesses foreign keys

ALTER TABLE public.businesses ADD CONSTRAINT businesses_cover_media_id_fkey FOREIGN KEY (cover_media_id) REFERENCES public.media(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_logo_media_id_fkey FOREIGN KEY (logo_media_id) REFERENCES public.media(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- public.cancellations foreign keys

ALTER TABLE public.cancellations ADD CONSTRAINT cancellations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.cancellations ADD CONSTRAINT cancellations_cancelled_by_user_id_fkey FOREIGN KEY (cancelled_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.customers foreign keys

ALTER TABLE public.customers ADD CONSTRAINT customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.employee_branches foreign keys

ALTER TABLE public.employee_branches ADD CONSTRAINT employee_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.business_branches(id) ON DELETE CASCADE;
ALTER TABLE public.employee_branches ADD CONSTRAINT employee_branches_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


-- public.employee_time_off foreign keys

ALTER TABLE public.employee_time_off ADD CONSTRAINT employee_time_off_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


-- public.employees foreign keys

ALTER TABLE public.employees ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.business_branches(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD CONSTRAINT employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD CONSTRAINT employees_profile_media_id_fkey FOREIGN KEY (profile_media_id) REFERENCES public.media(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.favorites foreign keys

ALTER TABLE public.favorites ADD CONSTRAINT favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- public.media foreign keys

ALTER TABLE public.media ADD CONSTRAINT media_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.notifications foreign keys

ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- public.payments foreign keys

ALTER TABLE public.payments ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


-- public.promo_codes foreign keys

ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- public.reviews foreign keys

ALTER TABLE public.reviews ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- public.service_categories foreign keys

ALTER TABLE public.service_categories ADD CONSTRAINT service_categories_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- public.service_employees foreign keys

ALTER TABLE public.service_employees ADD CONSTRAINT service_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.service_employees ADD CONSTRAINT service_employees_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


-- public.service_media foreign keys

ALTER TABLE public.service_media ADD CONSTRAINT service_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;
ALTER TABLE public.service_media ADD CONSTRAINT service_media_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


-- public.services foreign keys

ALTER TABLE public.services ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE SET NULL;


-- public.users foreign keys

ALTER TABLE public.users ADD CONSTRAINT fk_users_profile_media FOREIGN KEY (profile_media_id) REFERENCES public.media(id) ON DELETE SET NULL;


-- public.waitlist foreign keys

ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.business_branches(id) ON DELETE SET NULL;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;