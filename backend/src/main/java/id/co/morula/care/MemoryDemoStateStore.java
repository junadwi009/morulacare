package id.co.morula.care;

import static id.co.morula.care.Models.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;

final class MemoryDemoStateStore implements DemoStateStore {
    private record ScopedKey(String patientId, String id) {}
    private record ReceiptEntry(CareRequest request, CareReceipt receipt) {}
    private final Map<ScopedKey, Boolean> acknowledgements = new ConcurrentHashMap<>();
    private final Map<ScopedKey, ReceiptEntry> receipts = new ConcurrentHashMap<>();
    private final Map<String, Preferences> preferences = new ConcurrentHashMap<>();
    private record BookingEntry(DoctorModels.DoctorBookingRequest request, String bookingId) {}
    private final Map<ScopedKey, BookingEntry> bookingKeys = new ConcurrentHashMap<>();
    private final Map<ScopedKey, DoctorModels.DoctorBooking> bookings = new ConcurrentHashMap<>();
    private final Map<String, ScopedKey> reservedSlots = new ConcurrentHashMap<>();

    public void initialize(String patientId, Preferences defaults, List<Reminder> reminders) {
        preferences.putIfAbsent(patientId, defaults);
        reminders.forEach(reminder -> acknowledgements.putIfAbsent(new ScopedKey(patientId, reminder.id()), reminder.completed()));
    }
    public boolean completed(String patientId, String reminderId) {
        Boolean value = acknowledgements.get(new ScopedKey(patientId, reminderId));
        if (value == null) throw DemoStateStore.notFound();
        return value;
    }
    public void acknowledge(String patientId, String reminderId, boolean completed) {
        if (acknowledgements.replace(new ScopedKey(patientId, reminderId), completed) == null) throw DemoStateStore.notFound();
    }
    public Preferences preferences(String patientId) {
        Preferences value = preferences.get(patientId);
        if (value == null) throw DemoStateStore.notFound();
        return value;
    }
    public Preferences preferences(String patientId, Preferences value) {
        if (preferences.replace(patientId, value) == null) throw DemoStateStore.notFound();
        return value;
    }
    public CareReceipt request(String patientId, String key, CareRequest request, Supplier<CareReceipt> createReceipt) {
        var scopedKey = new ScopedKey(patientId, UUID.fromString(key).toString());
        if (receipts.size() >= 1000 && !receipts.containsKey(scopedKey)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "DEMO_CAPACITY", "Kapasitas simulasi penuh. Mulai ulang server demo untuk menghapus data sementara.");
        }
        return receipts.compute(scopedKey, (ignored, existing) -> {
            if (existing != null) {
                if (!existing.request().equals(request)) throw DemoStateStore.conflict();
                return existing;
            }
            return new ReceiptEntry(request, createReceipt.get());
        }).receipt();
    }
    public boolean durable() { return false; }
    public synchronized List<DoctorModels.DoctorBooking> doctorBookings(String patientId) {
        return bookings.entrySet().stream().filter(e -> e.getKey().patientId().equals(patientId))
            .map(Map.Entry::getValue).sorted(java.util.Comparator.comparing(DoctorModels.DoctorBooking::createdAt).reversed()
                .thenComparing(DoctorModels.DoctorBooking::id)).toList();
    }
    public synchronized List<String> reservedDoctorSlots() { return List.copyOf(reservedSlots.keySet()); }
    public synchronized DoctorModels.DoctorBooking bookDoctor(String patientId, String key, DoctorModels.DoctorBookingRequest request, Supplier<DoctorModels.DoctorBooking> createBooking) {
        var scopedKey=new ScopedKey(patientId,UUID.fromString(key).toString());
        var existing=bookingKeys.get(scopedKey);
        if(existing!=null) {
            if(!existing.request().equals(request))throw DemoStateStore.conflict();
            return bookings.get(new ScopedKey(patientId,existing.bookingId()));
        }
        if(reservedSlots.containsKey(request.slotId()))throw DoctorBookingRepository.occupied();
        if(bookings.size()>=2000)throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,"DEMO_CAPACITY","Kapasitas booking demo penuh.");
        var booking=createBooking.get();
        var bookingKey=new ScopedKey(patientId,booking.id());
        bookings.put(bookingKey,booking);
        reservedSlots.put(request.slotId(),bookingKey);
        bookingKeys.put(scopedKey,new BookingEntry(request,booking.id()));
        return booking;
    }
    public synchronized DoctorModels.DoctorBooking cancelDoctorBooking(String patientId,String id) {
        var bookingKey=new ScopedKey(patientId,id);
        var booking=bookings.get(bookingKey);
        if(booking==null)throw DemoStateStore.notFound();
        if(booking.status().equals("cancelled_demo"))return booking;
        bookings.put(bookingKey,booking.cancelled());
        reservedSlots.entrySet().removeIf(e -> e.getValue().equals(bookingKey));
        return booking.cancelled();
    }
}
