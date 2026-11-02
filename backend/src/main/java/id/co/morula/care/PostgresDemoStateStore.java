package id.co.morula.care;

import static id.co.morula.care.Models.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

final class PostgresDemoStateStore implements DemoStateStore {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private record ReceiptEntry(CareRequest request, CareReceipt receipt) {}

    PostgresDemoStateStore(DataSource dataSource) {
        jdbc = new JdbcTemplate(dataSource);
        jdbc.setQueryTimeout(10);
        transaction = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        transaction.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        transaction.setTimeout(15);
    }

    public void initialize(String patientId, Preferences defaults, List<Reminder> reminders) {
        transaction.executeWithoutResult(status -> {
            jdbc.update("""
                INSERT INTO demo_patient_preferences (patient_id, service_notifications, discreet_notifications, partner_sharing)
                VALUES (?, ?, ?, false) ON CONFLICT (patient_id) DO NOTHING
                """, patientId, defaults.serviceNotifications(), defaults.discreetNotifications());
            for (var reminder : reminders) jdbc.update("""
                INSERT INTO demo_reminder_acknowledgements (patient_id, reminder_id, completed)
                VALUES (?, ?, ?) ON CONFLICT (patient_id, reminder_id) DO NOTHING
                """, patientId, reminder.id(), reminder.completed());
        });
    }

    public boolean completed(String patientId, String reminderId) {
        var values = jdbc.query("SELECT completed FROM demo_reminder_acknowledgements WHERE patient_id=? AND reminder_id=?",
            (row, index) -> row.getBoolean("completed"), patientId, reminderId);
        if (values.isEmpty()) throw DemoStateStore.notFound();
        return values.getFirst();
    }

    public void acknowledge(String patientId, String reminderId, boolean completed) {
        if (jdbc.update("UPDATE demo_reminder_acknowledgements SET completed=? WHERE patient_id=? AND reminder_id=?",
            completed, patientId, reminderId) != 1) throw DemoStateStore.notFound();
    }

    public Preferences preferences(String patientId) {
        var values = jdbc.query("SELECT service_notifications, discreet_notifications, partner_sharing FROM demo_patient_preferences WHERE patient_id=?",
            (row, index) -> new Preferences(row.getBoolean("service_notifications"), row.getBoolean("discreet_notifications"), row.getBoolean("partner_sharing")), patientId);
        if (values.isEmpty()) throw DemoStateStore.notFound();
        return values.getFirst();
    }

    public Preferences preferences(String patientId, Preferences value) {
        if (jdbc.update("UPDATE demo_patient_preferences SET service_notifications=?, discreet_notifications=?, partner_sharing=? WHERE patient_id=?",
            value.serviceNotifications(), value.discreetNotifications(), value.partnerSharing(), patientId) != 1) throw DemoStateStore.notFound();
        return value;
    }

    public CareReceipt request(String patientId, String key, CareRequest request, Supplier<CareReceipt> createReceipt) {
        return transaction.execute(status -> {
            var receipt = createReceipt.get();
            // The unique key is the arbiter across all connections/processes, not an
            // in-process lock. A conflicting insert waits for the winning commit.
            int reserved = jdbc.update("""
                INSERT INTO demo_request_idempotency (patient_id, idempotency_key, request_id)
                VALUES (?, ?, ?) ON CONFLICT (patient_id, idempotency_key) DO NOTHING
                """, patientId, UUID.fromString(key), receipt.id());
            if (reserved == 1) {
                jdbc.update("""
                    INSERT INTO demo_care_requests (patient_id, id, request_type, appointment_id, note, status, receipt_message, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, patientId, receipt.id(), request.type().name(), request.appointmentId(), request.note(),
                    receipt.status(), receipt.message(), Timestamp.from(Instant.parse(receipt.createdAt())));
                return receipt;
            }
            // A separate READ COMMITTED statement sees the winner even when its row
            // was not visible to the preceding INSERT's snapshot.
            var existing = jdbc.queryForObject("""
                SELECT r.* FROM demo_request_idempotency i JOIN demo_care_requests r
                    ON r.patient_id=i.patient_id AND r.id=i.request_id
                WHERE i.patient_id=? AND i.idempotency_key=?
                """, (row, index) -> new ReceiptEntry(
                    new CareRequest(CareRequestType.valueOf(row.getString("request_type")), row.getString("appointment_id"), row.getString("note")),
                    new CareReceipt(row.getString("id"), row.getString("status"), row.getString("receipt_message"), row.getTimestamp("created_at").toInstant().toString())),
                patientId, UUID.fromString(key));
            if (existing == null) throw new IllegalStateException("Committed idempotency reservation has no receipt");
            if (!existing.request().equals(request)) throw DemoStateStore.conflict();
            return existing.receipt();
        });
    }
    public boolean durable() { return true; }
    private DoctorModels.DoctorBooking readBooking(java.sql.ResultSet row) throws java.sql.SQLException {
        String zone=row.getString("time_zone");
        return new DoctorModels.DoctorBooking(row.getString("id"),row.getString("doctor_id"),row.getString("doctor_name"),
            row.getString("specialty"),row.getString("branch_id"),row.getString("branch_name"),
            row.getTimestamp("starts_at").toInstant().atZone(ZoneId.of(zone)).toOffsetDateTime().toString(),
            row.getTimestamp("ends_at").toInstant().atZone(ZoneId.of(zone)).toOffsetDateTime().toString(),zone,
            row.getString("status"),row.getString("reason"),row.getTimestamp("created_at").toInstant().toString());
    }
    public List<DoctorModels.DoctorBooking> doctorBookings(String patientId) {
        return jdbc.query("SELECT * FROM demo_doctor_bookings WHERE patient_id=? ORDER BY created_at DESC, id",
            (row,index) -> readBooking(row),patientId);
    }
    public List<String> reservedDoctorSlots() {
        return jdbc.query("SELECT slot_id FROM demo_doctor_slot_reservations",(row,index)->row.getString("slot_id"));
    }
    public DoctorModels.DoctorBooking bookDoctor(String patientId,String key,DoctorModels.DoctorBookingRequest request,
            Supplier<DoctorModels.DoctorBooking> createBooking) {
        return transaction.execute(status -> {
            var booking=createBooking.get();
            int reservedKey=jdbc.update("""
                INSERT INTO demo_doctor_booking_keys(patient_id,idempotency_key,booking_id)
                VALUES(?,?,?) ON CONFLICT(patient_id,idempotency_key) DO NOTHING
                """,patientId,UUID.fromString(key),booking.id());
            if(reservedKey==0) {
                var existing=jdbc.query("""
                    SELECT b.* FROM demo_doctor_booking_keys k JOIN demo_doctor_bookings b
                        ON b.patient_id=k.patient_id AND b.id=k.booking_id
                    WHERE k.patient_id=? AND k.idempotency_key=?
                    """,(row,index)->new BookingEntry(new DoctorModels.DoctorBookingRequest(row.getString("doctor_id"),
                        row.getString("slot_id"),row.getString("reason")),readBooking(row)),patientId,UUID.fromString(key));
                if(existing.isEmpty())throw new IllegalStateException("Booking reservation has no committed booking");
                if(!existing.getFirst().request().equals(request))throw DemoStateStore.conflict();
                return existing.getFirst().booking();
            }
            jdbc.update("""
                INSERT INTO demo_doctor_bookings(patient_id,id,doctor_id,slot_id,doctor_name,specialty,branch_id,branch_name,
                    starts_at,ends_at,time_zone,status,reason,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,patientId,booking.id(),booking.doctorId(),request.slotId(),booking.doctorName(),booking.specialty(),
                booking.branchId(),booking.branchName(),Timestamp.from(java.time.OffsetDateTime.parse(booking.startsAt()).toInstant()),
                Timestamp.from(java.time.OffsetDateTime.parse(booking.endsAt()).toInstant()),booking.timeZone(),booking.status(),
                booking.reason(),Timestamp.from(Instant.parse(booking.createdAt())));
            int reservedSlot=jdbc.update("""
                INSERT INTO demo_doctor_slot_reservations(slot_id,patient_id,booking_id) VALUES(?,?,?)
                ON CONFLICT(slot_id) DO NOTHING
                """,request.slotId(),patientId,booking.id());
            if(reservedSlot==0)throw DoctorBookingRepository.occupied();
            return booking;
        });
    }
    private record BookingEntry(DoctorModels.DoctorBookingRequest request,DoctorModels.DoctorBooking booking) {}
    public DoctorModels.DoctorBooking cancelDoctorBooking(String patientId,String id) {
        return transaction.execute(status -> {
            var matches=jdbc.query("SELECT * FROM demo_doctor_bookings WHERE patient_id=? AND id=? FOR UPDATE",
                (row,index)->readBooking(row),patientId,id);
            if(matches.isEmpty())throw DemoStateStore.notFound();
            var booking=matches.getFirst();
            if(booking.status().equals("cancelled_demo"))return booking;
            jdbc.update("UPDATE demo_doctor_bookings SET status='cancelled_demo' WHERE patient_id=? AND id=?",patientId,id);
            jdbc.update("DELETE FROM demo_doctor_slot_reservations WHERE patient_id=? AND booking_id=?",patientId,id);
            return booking.cancelled();
        });
    }
}
