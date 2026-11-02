package id.co.morula.care;

import static id.co.morula.care.Models.*;
import static id.co.morula.care.DoctorModels.*;
import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

/** Real PostgreSQL checks, enabled only by mvn verify -Ppostgres-it. */
class PostgresDemoStoreIT {
    private static HikariDataSource database;
    private static HikariDataSource admin;
    private static JdbcTemplate sql;
    private static String schema;
    private static Overview seed;

    @BeforeAll static void migrateIsolatedSchema() throws Exception {
        var config = new HikariConfig();
        config.setJdbcUrl(required("MORULA_TEST_DATABASE_URL"));
        config.setUsername(required("MORULA_TEST_DATABASE_USERNAME"));
        config.setPassword(required("MORULA_TEST_DATABASE_PASSWORD"));
        config.setMaximumPoolSize(1);
        admin = new HikariDataSource(config);
        schema = "morula_it_" + UUID.randomUUID().toString().replace("-", "");
        new JdbcTemplate(admin).execute("CREATE SCHEMA " + schema);
        config.setMaximumPoolSize(4);
        config.setMinimumIdle(1);
        config.setSchema(schema);
        database = new HikariDataSource(config);
        sql = new JdbcTemplate(database);
        migrate();
        try (var stream = PostgresDemoStoreIT.class.getResourceAsStream("/demo-overview.json")) {
            seed = new ObjectMapper().readValue(stream, Overview.class);
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalStateException(name + " is required for postgres-it");
        return value;
    }

    private static void migrate() {
        Flyway.configure().dataSource(database).defaultSchema(schema).schemas(schema)
            .cleanDisabled(true).load().migrate();
    }

    @AfterAll static void removeOnlyOwnedSchema() {
        if (database != null) database.close();
        if (admin != null) {
            if (schema != null) new JdbcTemplate(admin).execute("DROP SCHEMA " + schema + " CASCADE");
            admin.close();
        }
    }

    private PostgresDemoStateStore store() { return new PostgresDemoStateStore(database); }
    private String patient() {
        String id = "synthetic-it-" + UUID.randomUUID();
        store().initialize(id, seed.preferences(), seed.reminders());
        return id;
    }
    private CareRequest request(String note) { return new CareRequest(CareRequestType.CONTACT_NURSE, null, note); }
    private CareReceipt receipt() {
        return new CareReceipt("req-" + UUID.randomUUID(), "received_demo", "Sintetis, tidak dikirim.", "2026-11-01T00:00:00.123456Z");
    }

    @Test void migrationAndSeedRerunPreserveMutableStateAndExactReceipt() {
        String patient = patient();
        String key = UUID.randomUUID().toString();
        var changed = new Preferences(false, false, false);
        var store = store();
        store.preferences(patient, changed);
        store.acknowledge(patient, "rem-questions", true);
        var first = store.request(patient, key, request("Persist after reseed"), this::receipt);
        migrate();
        var reopened = store();
        reopened.initialize(patient, seed.preferences(), seed.reminders());
        assertThat(reopened.preferences(patient)).isEqualTo(changed);
        assertThat(reopened.completed(patient, "rem-questions")).isTrue();
        assertThat(reopened.request(patient, key, request("Persist after reseed"), this::receipt)).isEqualTo(first);
    }

    @Test void concurrentIdenticalRetriesCreateExactlyOneTicket() throws Exception {
        String patient = patient();
        String key = UUID.randomUUID().toString();
        var start = new CountDownLatch(1);
        var futures = new ArrayList<java.util.concurrent.Future<CareReceipt>>();
        try (var workers = Executors.newFixedThreadPool(8)) {
            for (int i = 0; i < 8; i++) futures.add(workers.submit(() -> {
                start.await();
                return store().request(patient, key, request("Concurrent synthetic request"), this::receipt);
            }));
            start.countDown();
            var receipts = new ArrayList<CareReceipt>();
            for (var future : futures) receipts.add(future.get(20, TimeUnit.SECONDS));
            assertThat(receipts).allMatch(receipts.getFirst()::equals);
        }
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_care_requests WHERE patient_id=?", Integer.class, patient)).isEqualTo(1);
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_request_idempotency WHERE patient_id=?", Integer.class, patient)).isEqualTo(1);
    }

    @Test void simultaneousDifferentPayloadsConflictWithoutAnOrphanTicket() throws Exception {
        String patient = patient();
        String key = UUID.randomUUID().toString();
        var start = new CountDownLatch(1);
        try (var workers = Executors.newFixedThreadPool(2)) {
            var futures = new ArrayList<java.util.concurrent.Future<Object>>();
            for (String note : List.of("First payload", "Second payload")) futures.add(workers.submit(() -> {
                start.await();
                try { return store().request(patient, key, request(note), this::receipt); }
                catch (ApiException conflict) { return conflict; }
            }));
            start.countDown();
            var results = List.of(futures.get(0).get(20, TimeUnit.SECONDS), futures.get(1).get(20, TimeUnit.SECONDS));
            assertThat(results.stream().filter(CareReceipt.class::isInstance).count()).isEqualTo(1);
            assertThat(results.stream().filter(ApiException.class::isInstance).map(ApiException.class::cast).toList())
                .singleElement().satisfies(error -> assertThat(error.code).isEqualTo("IDEMPOTENCY_CONFLICT"));
        }
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_care_requests WHERE patient_id=?", Integer.class, patient)).isEqualTo(1);
    }

    @Test void patientScopesDoNotShareKeysPreferencesOrAcknowledgements() {
        String firstPatient = patient();
        String secondPatient = patient();
        String key = UUID.randomUUID().toString();
        var first = store().request(firstPatient, key, request("One"), this::receipt);
        var second = store().request(secondPatient, key, request("Two"), this::receipt);
        assertThat(second.id()).isNotEqualTo(first.id());
        store().preferences(firstPatient, new Preferences(false, false, false));
        store().acknowledge(firstPatient, "rem-questions", true);
        assertThat(store().preferences(secondPatient)).isEqualTo(seed.preferences());
        assertThat(store().completed(secondPatient, "rem-questions")).isFalse();
    }

    @Test void uuidCaseIsCanonicalButPayloadNullAndBlankRemainDistinct() {
        String patient = patient();
        String key = UUID.randomUUID().toString();
        var first = store().request(patient, key, request("Canonical UUID"), this::receipt);
        assertThat(store().request(patient, key.toUpperCase(java.util.Locale.ROOT), request("Canonical UUID"), this::receipt)).isEqualTo(first);
        assertThatThrownBy(() -> store().request(patient, key,
            new CareRequest(CareRequestType.CONTACT_NURSE, "", "Canonical UUID"), this::receipt))
            .isInstanceOf(ApiException.class).satisfies(error -> assertThat(((ApiException) error).code).isEqualTo("IDEMPOTENCY_CONFLICT"));
    }

    @Test void failedInsertRollsBackIdempotencyReservationAndAllowsRetry() {
        String patient = patient();
        String key = UUID.randomUUID().toString();
        assertThatThrownBy(() -> store().request(patient, key, request("Rollback synthetic request"),
            () -> new CareReceipt("req-" + UUID.randomUUID(), "received_demo", null, Instant.now().toString())))
            .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_request_idempotency WHERE patient_id=?", Integer.class, patient)).isZero();
        assertThat(store().request(patient, key, request("Rollback synthetic request"), this::receipt).status()).isEqualTo("received_demo");
    }

    private DoctorBooking booking() {
        return new DoctorBooking("booking-"+UUID.randomUUID(),"doctor-maya","dr. Maya Pratama","Obstetri & Ginekologi",
            "MJKT","Morula IVF Jakarta","2026-11-03T09:00+07:00","2026-11-03T09:30+07:00","Asia/Jakarta",
            "confirmed_demo","Synthetic consultation","2026-11-01T00:00:00.123456Z");
    }
    private DoctorBookingRequest bookingRequest(String slot) {
        return new DoctorBookingRequest("doctor-maya",slot,"Synthetic consultation");
    }
    @Test void doctorBookingSurvivesMigrationReseedAndReopenThenCancellationReleasesSlot() {
        String patient=patient(), key=UUID.randomUUID().toString(), slot="slot-"+UUID.randomUUID();
        var request=bookingRequest(slot);
        var first=store().bookDoctor(patient,key,request,this::booking);
        migrate();
        store().initialize(patient,seed.preferences(),seed.reminders());
        assertThat(store().doctorBookings(patient)).containsExactly(first);
        assertThat(store().bookDoctor(patient,key.toUpperCase(java.util.Locale.ROOT),request,this::booking)).isEqualTo(first);
        assertThat(store().reservedDoctorSlots()).contains(slot);
        var cancelled=store().cancelDoctorBooking(patient,first.id());
        assertThat(cancelled.status()).isEqualTo("cancelled_demo");
        assertThat(store().cancelDoctorBooking(patient,first.id())).isEqualTo(cancelled);
        assertThat(store().reservedDoctorSlots()).doesNotContain(slot);
        assertThat(store().bookDoctor(patient,key,request,this::booking)).isEqualTo(cancelled);
    }
    @Test void doctorSlotHasOnlyOneWinnerAcrossConnectionsAndPatientScopes() throws Exception {
        String firstPatient=patient(), secondPatient=patient(), slot="slot-"+UUID.randomUUID();
        var start=new CountDownLatch(1);
        try(var workers=Executors.newFixedThreadPool(6)) {
            var futures=new ArrayList<java.util.concurrent.Future<Object>>();
            for(int i=0;i<6;i++) {
                String selectedPatient=i%2==0?firstPatient:secondPatient;
                futures.add(workers.submit(()->{start.await();try{return store().bookDoctor(selectedPatient,UUID.randomUUID().toString(),bookingRequest(slot),this::booking);}catch(ApiException ex){return ex;}}));
            }
            start.countDown();var results=new ArrayList<Object>();
            for(var future:futures)results.add(future.get(20,TimeUnit.SECONDS));
            assertThat(results.stream().filter(DoctorBooking.class::isInstance).count()).isEqualTo(1);
            assertThat(results.stream().filter(ApiException.class::isInstance).map(ApiException.class::cast).toList())
                .hasSize(5).allMatch(e->e.code.equals("SLOT_UNAVAILABLE"));
        }
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_doctor_bookings WHERE slot_id=?",Integer.class,slot)).isEqualTo(1);
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_doctor_booking_keys WHERE patient_id IN (?,?)",Integer.class,firstPatient,secondPatient)).isEqualTo(1);
    }
    @Test void identicalDoctorBookingRetriesAreAtomicAcrossConnections() throws Exception {
        String patient=patient(), key=UUID.randomUUID().toString(), slot="slot-"+UUID.randomUUID();
        var start=new CountDownLatch(1);
        try(var workers=Executors.newFixedThreadPool(8)) {
            var futures=new ArrayList<java.util.concurrent.Future<DoctorBooking>>();
            for(int i=0;i<8;i++)futures.add(workers.submit(()->{start.await();return store().bookDoctor(patient,key,bookingRequest(slot),this::booking);}));
            start.countDown();var bookings=new ArrayList<DoctorBooking>();
            for(var future:futures)bookings.add(future.get(20,TimeUnit.SECONDS));
            assertThat(bookings).allMatch(bookings.getFirst()::equals);
        }
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_doctor_bookings WHERE patient_id=?",Integer.class,patient)).isEqualTo(1);
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_doctor_booking_keys WHERE patient_id=?",Integer.class,patient)).isEqualTo(1);
    }
    @Test void doctorBookingKeysAndCancellationArePatientScoped() {
        String firstPatient=patient(), secondPatient=patient(), key=UUID.randomUUID().toString();
        String firstSlot="slot-"+UUID.randomUUID(), secondSlot="slot-"+UUID.randomUUID();
        var first=store().bookDoctor(firstPatient,key,bookingRequest(firstSlot),this::booking);
        var second=store().bookDoctor(secondPatient,key,bookingRequest(secondSlot),this::booking);
        assertThat(store().doctorBookings(firstPatient)).containsExactly(first);
        assertThat(store().doctorBookings(secondPatient)).containsExactly(second);
        assertThatThrownBy(()->store().cancelDoctorBooking(secondPatient,first.id())).isInstanceOf(ApiException.class)
            .satisfies(e->assertThat(((ApiException)e).status).isEqualTo(org.springframework.http.HttpStatus.NOT_FOUND));
        assertThatThrownBy(()->store().bookDoctor(firstPatient,key,new DoctorBookingRequest("doctor-maya",firstSlot,"Changed"),this::booking))
            .isInstanceOf(ApiException.class).satisfies(e->assertThat(((ApiException)e).code).isEqualTo("IDEMPOTENCY_CONFLICT"));
        assertThat(store().reservedDoctorSlots()).contains(firstSlot,secondSlot);
    }
    @Test void occupiedDoctorSlotRollsBackNewKeyAndCanBeRetriedAfterCancellation() {
        String firstPatient=patient(), secondPatient=patient(), slot="slot-"+UUID.randomUUID();
        String firstKey=UUID.randomUUID().toString(), retryKey=UUID.randomUUID().toString();
        var request=bookingRequest(slot);
        var first=store().bookDoctor(firstPatient,firstKey,request,this::booking);
        assertThatThrownBy(()->store().bookDoctor(secondPatient,retryKey,request,this::booking)).isInstanceOf(ApiException.class);
        assertThat(sql.queryForObject("SELECT count(*) FROM demo_doctor_booking_keys WHERE patient_id=?",Integer.class,secondPatient)).isZero();
        assertThat(store().doctorBookings(secondPatient)).isEmpty();
        store().cancelDoctorBooking(firstPatient,first.id());
        var next=store().bookDoctor(secondPatient,retryKey,request,this::booking);
        assertThat(next.status()).isEqualTo("confirmed_demo");
        assertThat(store().bookDoctor(firstPatient,firstKey,request,this::booking).status()).isEqualTo("cancelled_demo");
        assertThat(store().doctorBookings(secondPatient)).containsExactly(next);
        assertThat(store().reservedDoctorSlots()).contains(slot);
    }
}
