package expo.modules.blockingenforcement

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * The ongoing "a session is active" notification (spec: 02-session-notification.md).
 * Driven entirely by explicit calls from JS (via BlockingEnforcementModule) rather
 * than its own native timer — the RN side already ticks a 1-second interval for the
 * on-screen elapsed display, so reusing that instead of running a second, independent
 * native clock avoids two sources of truth for "how much time has elapsed" ever
 * drifting apart.
 */
object SessionNotificationManager {
    private const val CHANNEL_ID = "focus_session_channel"
    private const val NOTIFICATION_ID = 4201

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = context.getString(R.string.notification_channel_description)
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    fun show(context: Context, elapsedLabel: String, stepText: String?) {
        // POST_NOTIFICATIONS can be denied/not-yet-granted on API 33+; failing
        // to post a notification is not a reason to crash a focus session.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        ensureChannel(context)

        val contentIntent = FocusSessionLauncher.buildIntent(context)
        val pendingIntent = contentIntent?.let {
            PendingIntent.getActivity(
                context,
                0,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        // Using the launcher icon as a placeholder small icon — Android status-bar
        // icons should really be a dedicated monochrome silhouette asset (may render
        // as a plain white square on some OS versions otherwise). Swap for a real
        // notification-icon drawable in a content/asset pass; not blocking for this spec.
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(context.getString(R.string.notification_title_elapsed, elapsedLabel))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)

        if (!stepText.isNullOrBlank()) {
            builder.setContentText(context.getString(R.string.notification_body_step, stepText))
        }
        if (pendingIntent != null) {
            builder.setContentIntent(pendingIntent)
        }

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build())
    }

    fun clear(context: Context) {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }
}
