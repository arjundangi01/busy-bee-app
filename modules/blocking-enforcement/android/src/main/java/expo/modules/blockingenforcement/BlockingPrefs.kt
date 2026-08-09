package expo.modules.blockingenforcement

import android.content.Context
import org.json.JSONArray
import org.json.JSONException

/**
 * Single source of truth shared between the Expo module (JS-driven writes),
 * the AccessibilityService (reads on every foreground-app event, writes a
 * pending-attempt record on a collision), and the interstitial Activity
 * (reads to render itself). Backed by SharedPreferences rather than an
 * in-memory singleton so state survives the app process being killed and
 * restarted independently of the AccessibilityService — a plain in-memory
 * object would silently go stale the moment that happens, which is exactly
 * the kind of "quietly stops working" failure this feature can't afford.
 *
 * Known limitation, by design: this is per-device local storage, not synced
 * through the backend. A session started (or a blocklist edited) on one
 * device has no effect on enforcement on a second device signed into the
 * same account — following a session across devices would need the backend
 * to actively push state to a device that may not have any Busy Bee screen
 * open at all, which is a real feature (push infrastructure) on its own,
 * not something to bolt on here.
 */
object BlockingPrefs {
    private const val PREFS_NAME = "blocking_enforcement_prefs"

    private const val KEY_ACTIVE_SESSION_ID = "active_session_id"
    private const val KEY_ACTIVE_MISSION_ID = "active_mission_id"
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages"
    private const val KEY_CURRENT_STEP_TEXT = "current_step_text"
    private const val KEY_ACTIVE_SESSION_STARTED_AT = "active_session_started_at"
    private const val KEY_ACTIVE_SESSION_EXPIRES_AT = "active_session_expires_at"
    private const val KEY_PENDING_ATTEMPTS = "pending_blocked_attempts"

    // A rapid string of collisions (e.g. two blocked apps opened back to back
    // before the JS side next comes to the foreground to consume them) queues
    // up here instead of overwriting a single slot. Capped, not unbounded —
    // this is "a few collisions between one foreground check and the next,"
    // never a growing log.
    private const val MAX_PENDING_ATTEMPTS = 5

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // missionId is stored alongside sessionId specifically so the notification
    // and the interstitial's "Back to Busy Bee" CTA can deep-link straight to
    // /mission/{missionId}/focus even after a cold start (process killed
    // while backgrounded) — the default launch intent alone only brings an
    // already-alive task to front, which isn't guaranteed.
    fun setActiveSession(
        context: Context,
        sessionId: String,
        missionId: String,
        blockedPackages: List<String>,
        currentStepText: String,
        expiresAtMillis: Long,
    ) {
        val p = prefs(context)
        // The JS side re-calls this (not just at session start) whenever the
        // blocklist changes mid-session, to keep the blocklist snapshot live —
        // so only stamp startedAt/expiresAt the first time a given sessionId
        // is seen. Restamping on every re-push would reset the foreground
        // notification's elapsed-time display (FocusSessionForegroundService
        // reads this same startedAt value) each time the user edits their
        // blocklist during a session, and would push expiry out from under
        // the cap actually in force when the session started.
        val isNewSession = p.getString(KEY_ACTIVE_SESSION_ID, null) != sessionId
        val editor = p.edit()
            .putString(KEY_ACTIVE_SESSION_ID, sessionId)
            .putString(KEY_ACTIVE_MISSION_ID, missionId)
            .putStringSet(KEY_BLOCKED_PACKAGES, blockedPackages.toSet())
            .putString(KEY_CURRENT_STEP_TEXT, currentStepText)
        if (isNewSession) {
            editor.putLong(KEY_ACTIVE_SESSION_STARTED_AT, System.currentTimeMillis())
            editor.putLong(KEY_ACTIVE_SESSION_EXPIRES_AT, expiresAtMillis)
        }
        editor.apply()
    }

    fun getActiveMissionId(context: Context): String? = prefs(context).getString(KEY_ACTIVE_MISSION_ID, null)

    // Native source of truth for elapsed-time display — read by
    // FocusSessionForegroundService on every tick so the notification's
    // elapsed time is computed independent of JS being alive. Absent (null)
    // whenever there's no active session, including the never-set case.
    fun getActiveSessionStartedAtMillis(context: Context): Long? {
        val value = prefs(context).getLong(KEY_ACTIVE_SESSION_STARTED_AT, -1L)
        return if (value == -1L) null else value
    }

    // Locked in once at session start from the backend's effective duration
    // cap (Free: real cap, Pro: 24h safety net) — see
    // backend/lib/routes/focus-sessions/utils/sessionStatus.ts. Native
    // enforces this timestamp directly rather than deriving its own cap, so
    // there's exactly one place (the backend) that decides what the cap is.
    fun getActiveSessionExpiresAtMillis(context: Context): Long? {
        val value = prefs(context).getLong(KEY_ACTIVE_SESSION_EXPIRES_AT, -1L)
        return if (value == -1L) null else value
    }

    // Shared by BlockingAccessibilityService's reactive per-event check and
    // FocusSessionExpiryWorker's scheduled backstop — both need the exact
    // same "is this session past its expiry, and if so clean it up" logic,
    // so it lives here once rather than being reimplemented in two places.
    // Returns true if it cleared an expired session (caller should also stop
    // the foreground notification service), false otherwise (nothing to do,
    // whether because there's no active session or it hasn't expired yet).
    fun clearIfExpired(context: Context, now: Long = System.currentTimeMillis()): Boolean {
        if (getActiveSessionId(context) == null) return false
        val expiresAt = getActiveSessionExpiresAtMillis(context) ?: return false
        if (now < expiresAt) return false
        clearActiveSession(context)
        return true
    }

    fun updateCurrentStep(context: Context, stepText: String) {
        prefs(context).edit().putString(KEY_CURRENT_STEP_TEXT, stepText).apply()
    }

    fun clearActiveSession(context: Context) {
        prefs(context).edit()
            .remove(KEY_ACTIVE_SESSION_ID)
            .remove(KEY_ACTIVE_MISSION_ID)
            .remove(KEY_BLOCKED_PACKAGES)
            .remove(KEY_CURRENT_STEP_TEXT)
            .remove(KEY_ACTIVE_SESSION_STARTED_AT)
            .remove(KEY_ACTIVE_SESSION_EXPIRES_AT)
            .apply()
    }

    fun getActiveSessionId(context: Context): String? = prefs(context).getString(KEY_ACTIVE_SESSION_ID, null)

    // Lets the interstitial Activity notice the session ending while it's
    // still on screen (e.g. a time-limit cutoff elsewhere) without polling —
    // this is a plain SharedPreferences change callback, only fires when
    // clearActiveSession/setActiveSession actually write, and only while a
    // caller is registered (the Activity registers in onStart, unregisters
    // in onStop, so this costs nothing while the screen isn't visible).
    fun registerChangeListener(context: Context, listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener) {
        prefs(context).registerOnSharedPreferenceChangeListener(listener)
    }

    fun unregisterChangeListener(context: Context, listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener) {
        prefs(context).unregisterOnSharedPreferenceChangeListener(listener)
    }

    fun isActiveSessionKey(key: String?): Boolean = key == KEY_ACTIVE_SESSION_ID

    fun getBlockedPackages(context: Context): Set<String> =
        prefs(context).getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()

    fun getCurrentStepText(context: Context): String? = prefs(context).getString(KEY_CURRENT_STEP_TEXT, null)

    data class PendingBlockedAttempt(val packageName: String, val occurredAtMillis: Long)

    /**
     * Recorded by the AccessibilityService the instant a real collision is
     * detected. Queued (capped at MAX_PENDING_ATTEMPTS, oldest dropped past
     * that) rather than a single overwritable slot, so two collisions
     * happening before the JS side next comes to the foreground don't lose
     * one of them. Consume-all-by-design (get + clear together in
     * consumePendingBlockedAttempts) so a slow or backgrounded JS side can
     * never double-fire the blocked-attempt API call for the same collision.
     */
    fun recordPendingBlockedAttempt(context: Context, packageName: String) {
        val p = prefs(context)
        val updated = (readPendingAttempts(p) + PendingBlockedAttempt(packageName, System.currentTimeMillis()))
            .takeLast(MAX_PENDING_ATTEMPTS)
        p.edit().putString(KEY_PENDING_ATTEMPTS, serializePendingAttempts(updated)).apply()
    }

    fun consumePendingBlockedAttempts(context: Context): List<PendingBlockedAttempt> {
        val p = prefs(context)
        val attempts = readPendingAttempts(p)
        if (attempts.isNotEmpty()) {
            p.edit().remove(KEY_PENDING_ATTEMPTS).apply()
        }
        return attempts
    }

    private fun readPendingAttempts(p: android.content.SharedPreferences): List<PendingBlockedAttempt> {
        val raw = p.getString(KEY_PENDING_ATTEMPTS, null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            (0 until array.length()).map { i ->
                val entry = array.getJSONObject(i)
                PendingBlockedAttempt(entry.getString("packageName"), entry.getLong("occurredAtMillis"))
            }
        } catch (error: JSONException) {
            // Corrupt/unexpected stored value — treat as no pending attempts
            // rather than crashing the AccessibilityService that called this.
            emptyList()
        }
    }

    private fun serializePendingAttempts(attempts: List<PendingBlockedAttempt>): String {
        val array = JSONArray()
        attempts.forEach { attempt ->
            array.put(
                org.json.JSONObject()
                    .put("packageName", attempt.packageName)
                    .put("occurredAtMillis", attempt.occurredAtMillis),
            )
        }
        return array.toString()
    }
}
