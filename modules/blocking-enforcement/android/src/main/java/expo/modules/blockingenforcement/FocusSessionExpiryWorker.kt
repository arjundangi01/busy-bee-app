package expo.modules.blockingenforcement

import android.content.Context
import android.content.Intent
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Proactive backstop for session self-expiry — scheduled by
 * BlockingEnforcementModule.setActiveSession for the exact expiry timestamp,
 * cancelled by clearActiveSession. Exists because
 * BlockingAccessibilityService's reactive check only fires on a foreground-
 * app switch; if the phone just sits idle past expiry, nothing would ever
 * trigger it otherwise.
 *
 * Idempotent by construction: BlockingPrefs.clearIfExpired checks
 * getActiveSessionId first, so if the session was already ended manually
 * (which cancels this work) or already expired via the reactive check, this
 * is a no-op.
 */
class FocusSessionExpiryWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        if (BlockingPrefs.clearIfExpired(applicationContext)) {
            applicationContext.stopService(Intent(applicationContext, FocusSessionForegroundService::class.java))
        }
        return Result.success()
    }
}
