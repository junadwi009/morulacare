-- Forward-only, additive local-demo schema. Roll application back without dropping
-- user data; a future rollback migration would archive these tables explicitly.
CREATE TABLE demo_doctor_bookings (
    patient_id varchar(100) NOT NULL,
    id varchar(50) NOT NULL,
    doctor_id varchar(100) NOT NULL,
    slot_id varchar(100) NOT NULL,
    doctor_name varchar(150) NOT NULL,
    specialty varchar(100) NOT NULL,
    branch_id varchar(100) NOT NULL,
    branch_name varchar(150) NOT NULL,
    starts_at timestamp(6) with time zone NOT NULL,
    ends_at timestamp(6) with time zone NOT NULL CHECK (ends_at > starts_at),
    time_zone varchar(50) NOT NULL,
    status varchar(30) NOT NULL CHECK (status IN ('confirmed_demo', 'cancelled_demo')),
    reason varchar(500) NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
    created_at timestamp(6) with time zone NOT NULL,
    PRIMARY KEY (patient_id, id)
);
CREATE INDEX demo_doctor_bookings_patient_created ON demo_doctor_bookings(patient_id, created_at DESC, id);

CREATE TABLE demo_doctor_booking_keys (
    patient_id varchar(100) NOT NULL,
    idempotency_key uuid NOT NULL,
    booking_id varchar(50) NOT NULL,
    PRIMARY KEY (patient_id, idempotency_key),
    UNIQUE (patient_id, booking_id),
    FOREIGN KEY (patient_id, booking_id) REFERENCES demo_doctor_bookings(patient_id, id)
        DEFERRABLE INITIALLY DEFERRED
);

-- A slot belongs to one synthetic clinic schedule, not one patient. The global PK
-- arbitrates simultaneous requests across connections and API processes.
CREATE TABLE demo_doctor_slot_reservations (
    slot_id varchar(100) PRIMARY KEY,
    patient_id varchar(100) NOT NULL,
    booking_id varchar(50) NOT NULL,
    UNIQUE (patient_id, booking_id),
    FOREIGN KEY (patient_id, booking_id) REFERENCES demo_doctor_bookings(patient_id, id)
        DEFERRABLE INITIALLY DEFERRED
);
