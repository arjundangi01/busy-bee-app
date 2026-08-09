package expo.modules.blockingenforcement

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Restarts the ongoing-session notification immediately after a device
 * reboot, instead of leaving it silently absent until the next real
 * app-switch event happens to trigger BlockingAccessibilityService's
 * self-heal restart. Blocking enforcement itself isn't affected either way —
 * Android auto-rebinds an already-enabled accessibility service on boot —
 * this only closes the notification-presence gap. Fires once per boot; does
 * a single SharedPreferences read, nothing more.
 */
class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        if (BlockingPrefs.getActiveSessionId(context) == null) return

        // Starting a foreground service in direct response to BOOT_COMPLETED
        // is one of the documented exemptions to Android's background-start
        // restrictions, so this is safe to call straight from here.
        try {
            ContextCompat.startForegroundService(context, Intent(context, FocusSessionForegroundService::class.java))
        } catch (error: Exception) {
            // Best-effort, same as the other setActiveSession/self-heal call
            // sites — the notification may stay briefly absent, but nothing
            // about actual blocking enforcement depends on this succeeding.
        }
    }
}
