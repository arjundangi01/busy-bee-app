package expo.modules.blockingenforcement

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Pure notification-builder for the ongoing "a session is active" notification
 * (spec: 02-session-notification.md). Posting/canceling is owned by
 * FocusSessionForegroundService via startForeground/stopForeground — this
 * object only knows how to build the channel and the Notification object
 * itself, so the same construction logic isn't duplicated between the
 * service's initial startForeground() call and its periodic tick updates.
 */
object SessionNotificationManager {
    const val NOTIFICATION_ID = 4201
    private const val CHANNEL_ID = "focus_session_channel"

    fun ensureChannel(context: Context) {
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

    fun build(context: Context, elapsedLabel: String, stepText: String?): Notification {
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

        return builder.build()
    }
}
