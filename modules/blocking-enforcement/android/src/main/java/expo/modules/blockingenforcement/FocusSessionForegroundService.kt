package expo.modules.blockingenforcement

import android.app.Service
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ServiceCompat

/**
 * Owns the "a focus session is active" presence natively — started at
 * session start, stopped at session end (BlockingEnforcementModule's
 * setActiveSession/clearActiveSession), and ticks its own elapsed-time
 * display independent of the JS engine. This is the fix for the notification
 * silently going stale once the app is backgrounded long enough for JS to be
 * suspended, or force-exited entirely — the prior design pushed updates from
 * a JS timer, which stops the moment either of those happens.
 *
 * Reads BlockingPrefs fresh on every tick rather than caching session state
 * in its own fields, for the same reason BlockingAccessibilityService does —
 * this service can outlive the exact moment JS last pushed an update.
 */
class FocusSessionForegroundService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var tickRunnable: Runnable? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val startedAtMillis = BlockingPrefs.getActiveSessionStartedAtMillis(this)
        if (startedAtMillis == null) {
            // No active session to represent — e.g. a stray restart after
            // clearActiveSession already ran. Nothing to show.
            stopSelf()
            return START_NOT_STICKY
        }

        // Must call startForeground() within a few seconds of being started
        // or the system kills the service — do this first, before scheduling
        // anything else.
        startForeground(SessionNotificationManager.NOTIFICATION_ID, buildNotification(startedAtMillis))
        scheduleTick(startedAtMillis)

        // START_STICKY: if the system kills this process under memory
        // pressure, restart it with a null Intent — onStartCommand re-reads
        // BlockingPrefs (SharedPreferences survive process death) and picks
        // straight back up if a session is still active, or stops itself
        // cleanly if not.
        return START_STICKY
    }

    private fun scheduleTick(startedAtMillis: Long) {
        cancelTick()
        val runnable = object : Runnable {
            override fun run() {
                if (BlockingPrefs.getActiveSessionId(this@FocusSessionForegroundService) == null) {
                    stopSelf()
                    return
                }
                val manager = getSystemService(android.app.NotificationManager::class.java)
                manager?.notify(SessionNotificationManager.NOTIFICATION_ID, buildNotification(startedAtMillis))
                handler.postDelayed(this, TICK_INTERVAL_MS)
            }
        }
        tickRunnable = runnable
        handler.postDelayed(runnable, TICK_INTERVAL_MS)
    }

    private fun cancelTick() {
        tickRunnable?.let { handler.removeCallbacks(it) }
        tickRunnable = null
    }

    private fun buildNotification(startedAtMillis: Long): android.app.Notification {
        val elapsedSeconds = ((System.currentTimeMillis() - startedAtMillis) / 1000).coerceAtLeast(0)
        val stepText = BlockingPrefs.getCurrentStepText(this)
        return SessionNotificationManager.build(this, formatElapsed(elapsedSeconds), stepText)
    }

    override fun onDestroy() {
        cancelTick()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    companion object {
        private const val TICK_INTERVAL_MS = 30_000L

        private fun formatElapsed(totalSeconds: Long): String {
            val minutes = (totalSeconds / 60).toString().padStart(2, '0')
            val seconds = (totalSeconds % 60).toString().padStart(2, '0')
            return "$minutes:$seconds"
        }
    }
}
