package expo.modules.blockingenforcement

import android.content.Context

/**
 * Single source of truth shared between the Expo module (JS-driven writes),
 * the AccessibilityService (reads on every foreground-app event, writes a
 * pending-attempt record on a collision), and the interstitial Activity
 * (reads to render itself). Backed by SharedPreferences rather than an
 * in-memory singleton so state survives the app process being killed and
 * restarted independently of the AccessibilityService — a plain in-memory
 * object would silently go stale the moment that happens, which is exactly
 * the kind of "quietly stops working" failure this feature can't afford.
 */
object BlockingPrefs {
    private const val PREFS_NAME = "blocking_enforcement_prefs"

    private const val KEY_ACTIVE_SESSION_ID = "active_session_id"
    private const val KEY_ACTIVE_MISSION_ID = "active_mission_id"
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages"
    private const val KEY_CURRENT_STEP_TEXT = "current_step_text"
    private const val KEY_PENDING_PACKAGE = "pending_blocked_package"
    private const val KEY_PENDING_AT = "pending_blocked_at"

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
    ) {
        prefs(context).edit()
            .putString(KEY_ACTIVE_SESSION_ID, sessionId)
            .putString(KEY_ACTIVE_MISSION_ID, missionId)
            .putStringSet(KEY_BLOCKED_PACKAGES, blockedPackages.toSet())
            .putString(KEY_CURRENT_STEP_TEXT, currentStepText)
            .apply()
    }

    fun getActiveMissionId(context: Context): String? = prefs(context).getString(KEY_ACTIVE_MISSION_ID, null)

    fun updateCurrentStep(context: Context, stepText: String) {
        prefs(context).edit().putString(KEY_CURRENT_STEP_TEXT, stepText).apply()
    }

    fun clearActiveSession(context: Context) {
        prefs(context).edit()
            .remove(KEY_ACTIVE_SESSION_ID)
            .remove(KEY_ACTIVE_MISSION_ID)
            .remove(KEY_BLOCKED_PACKAGES)
            .remove(KEY_CURRENT_STEP_TEXT)
            .apply()
    }

    fun getActiveSessionId(context: Context): String? = prefs(context).getString(KEY_ACTIVE_SESSION_ID, null)

    fun getBlockedPackages(context: Context): Set<String> =
        prefs(context).getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()

    fun getCurrentStepText(context: Context): String? = prefs(context).getString(KEY_CURRENT_STEP_TEXT, null)

    /**
     * Recorded by the AccessibilityService the instant a real collision is
     * detected. Consume-once by design (get + clear together) so a slow or
     * backgrounded JS side can never double-fire the blocked-attempt API
     * call for the same collision, and a stale pending record can never
     * linger past the app actually reading it.
     */
    fun recordPendingBlockedAttempt(context: Context, packageName: String) {
        prefs(context).edit()
            .putString(KEY_PENDING_PACKAGE, packageName)
            .putLong(KEY_PENDING_AT, System.currentTimeMillis())
            .apply()
    }

    data class PendingBlockedAttempt(val packageName: String, val occurredAtMillis: Long)

    fun consumePendingBlockedAttempt(context: Context): PendingBlockedAttempt? {
        val p = prefs(context)
        val packageName = p.getString(KEY_PENDING_PACKAGE, null) ?: return null
        val occurredAt = p.getLong(KEY_PENDING_AT, 0L)
        p.edit().remove(KEY_PENDING_PACKAGE).remove(KEY_PENDING_AT).apply()
        return PendingBlockedAttempt(packageName, occurredAt)
    }
}
