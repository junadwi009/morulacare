package id.co.morula.care;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Outward DTOs contain only fields that patients are allowed to see. */
public final class Models {
    private Models() {}
    public record Patient(String id, String displayName, String recordNumber, String branchId, String branchName, String timeZone) {}
    public record Sync(String lastSyncedAt, String status, String message) {}
    public record Stage(String id, String label, String state, String date) {}
    public record Cycle(String id, String program, String title, String status, String startedAt, String nextStep, List<Stage> stages) {}
    public record Embryo(String id, String label, String stage, String status, String observationDate, String releasedAt, String releasedBy, String summary, String source) {}
    public record Activity(String id, String type, String title, String occurredAt, String status, String clinician, String branch, String summary, List<String> instructions, String source) {}
    public record Appointment(String id, String title, String clinician, String branch, String startsAt, String timeZone, String status, String location, List<String> preparation, String source) {}
    public record Reminder(String id, String title, String detail, String dueAt, boolean completed, String source) {}
    public record NotificationItem(String id, String title, String body, String createdAt, boolean read) {}
    public record Preferences(boolean serviceNotifications, boolean discreetNotifications, boolean partnerSharing) {}
    public record Overview(String dataMode, Patient patient, Sync sync, Cycle cycle, List<Embryo> embryos, List<Activity> activities, List<Appointment> appointments, List<Reminder> reminders, List<NotificationItem> notifications, Preferences preferences) {}
    public record ChatRequest(@NotBlank @Size(max = 2000) String message) {}
    public record ChatReply(String id, String text, String intent, String sourceLabel, boolean requiresStaff, String createdAt) {}
    public enum CareRequestType { APPOINTMENT_CHANGE, CONTACT_NURSE }
    public record CareRequest(@NotNull CareRequestType type, @Size(max = 100) String appointmentId, @NotBlank @Size(max = 2000) String note) {}
    public record CareReceipt(String id, String status, String message, String createdAt) {}
    public record ReminderPatch(@NotNull Boolean completed) {}
    public record PreferencesPatch(@NotNull Boolean serviceNotifications, @NotNull Boolean discreetNotifications, @NotNull Boolean partnerSharing) {}
    public record ApiError(String code, String message) {}
    public record PatientIdentity(String patientId) {}
}
