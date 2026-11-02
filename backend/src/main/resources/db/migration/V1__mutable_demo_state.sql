-- Forward-only local-demo migration. Roll back application storage selection to memory
-- without dropping these tables/volume; subsequent schema changes use new migrations.
CREATE TABLE demo_patient_preferences (
    patient_id varchar(100) PRIMARY KEY,
    service_notifications boolean NOT NULL,
    discreet_notifications boolean NOT NULL,
    partner_sharing boolean NOT NULL DEFAULT false CHECK (partner_sharing = false)
);

CREATE TABLE demo_reminder_acknowledgements (
    patient_id varchar(100) NOT NULL,
    reminder_id varchar(100) NOT NULL,
    completed boolean NOT NULL,
    PRIMARY KEY (patient_id, reminder_id)
);

CREATE TABLE demo_care_requests (
    patient_id varchar(100) NOT NULL,
    id varchar(50) NOT NULL,
    request_type varchar(30) NOT NULL CHECK (request_type IN ('APPOINTMENT_CHANGE', 'CONTACT_NURSE')),
    appointment_id varchar(100),
    note varchar(2000) NOT NULL CHECK (char_length(note) BETWEEN 1 AND 2000),
    status varchar(30) NOT NULL CHECK (status = 'received_demo'),
    receipt_message text NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    PRIMARY KEY (patient_id, id)
);

CREATE TABLE demo_request_idempotency (
    patient_id varchar(100) NOT NULL,
    idempotency_key uuid NOT NULL,
    request_id varchar(50) NOT NULL,
    PRIMARY KEY (patient_id, idempotency_key),
    UNIQUE (patient_id, request_id),
    -- Reserve the key before creating a ticket in the same transaction. Commit
    -- requires the corresponding request; rollback removes the reservation.
    FOREIGN KEY (patient_id, request_id) REFERENCES demo_care_requests (patient_id, id)
        DEFERRABLE INITIALLY DEFERRED
);
