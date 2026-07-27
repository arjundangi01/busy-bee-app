package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Calendar

class AppUsageRecord(
    @Field
    val packageName: String = "",
    @Field
    val appName: String = "",
    @Field
    val foregroundSeconds: Int = 0,
) : Record

class DeviceActivityRecord(
    @Field
    val pickupCount: Int = 0,
    @Field
    val firstPickupAtMillis: Double? = null,
    @Field
    val lastPickupAtMillis: Double? = null,
    @Field
    val offlineSeconds: Int = 0,
) : Record

// Insights/Data Dashboard Track 2 (design-artifacts/evolution/specs/
// 11-insights-screen-time-and-device-activity.md) — Android only, mirrors
// the installed-apps/blocking-enforcement modules' shape. All aggregation
// is done here, on-device, for "today" (device-local calendar day) only —
// the JS side posts this once as a daily rollup, never streams raw events.
class UsageStatsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UsageStats")

        AsyncFunction("isUsageAccessGranted") {
            hasUsageAccess(requireContext())
        }

        AsyncFunction("openUsageAccessSettings") {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            requireContext().startActivity(intent)
        }

        // Per-app foreground time for today so far. Empty (not an error) if
        // the permission isn't granted — callers already check
        // isUsageAccessGranted separately to decide what UI state to show,
        // this just degrades to "no data" rather than throwing.
        AsyncFunction("getDailyAppUsage") {
            val context = requireContext()
            if (!hasUsageAccess(context)) return@AsyncFunction emptyList<AppUsageRecord>()

            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val (startOfDay, now) = startOfDayRange()
            val packageManager = context.packageManager
            val hostPackageName = context.packageName

            usageStatsManager
                .queryAndAggregateUsageStats(startOfDay, now)
                .values
                .asSequence()
                .filter { it.packageName != hostPackageName && it.totalTimeInForeground > 0 }
                // Same real-app filter as installed-apps: only packages with a
                // resolvable launcher activity, not every background/system
                // package UsageStatsManager happens to have a record for.
                .filter { packageManager.getLaunchIntentForPackage(it.packageName) != null }
                .mapNotNull { stats ->
                    try {
                        val appInfo = packageManager.getApplicationInfo(stats.packageName, 0)
                        AppUsageRecord(
                            packageName = stats.packageName,
                            appName = packageManager.getApplicationLabel(appInfo).toString(),
                            foregroundSeconds = (stats.totalTimeInForeground / 1000).toInt(),
                        )
                    } catch (error: PackageManager.NameNotFoundException) {
                        null
                    }
                }
                .toList()
        }

        // Pickups + first/last pickup + offline time for today so far,
        // derived from SCREEN_INTERACTIVE/SCREEN_NON_INTERACTIVE usage
        // events (API 28+ only — see the SDK_INT guard below).
        AsyncFunction("getDailyDeviceActivity") {
            val context = requireContext()
            val empty = DeviceActivityRecord()
            if (!hasUsageAccess(context) || Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                return@AsyncFunction empty
            }

            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val (startOfDay, now) = startOfDayRange()

            val screenTransitions = mutableListOf<Pair<Boolean, Long>>()
            val events = usageStatsManager.queryEvents(startOfDay, now)
            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                when (event.eventType) {
                    UsageEvents.Event.SCREEN_INTERACTIVE -> screenTransitions.add(true to event.timeStamp)
                    UsageEvents.Event.SCREEN_NON_INTERACTIVE -> screenTransitions.add(false to event.timeStamp)
                }
            }
            screenTransitions.sortBy { it.second }

            val pickups = screenTransitions.filter { it.first }

            // "Offline time" = sum of screen-off gaps that are followed by a
            // real screen-on again the same day — deliberately excludes the
            // gap before the first pickup and after the last (that's
            // overnight/sleep, not "time away from the phone while awake",
            // and Sleep itself is an explicit non-goal of this module per
            // the spec).
            var offlineMillis = 0L
            for (i in screenTransitions.indices) {
                val (isInteractive, timestamp) = screenTransitions[i]
                if (!isInteractive) {
                    val next = screenTransitions.getOrNull(i + 1)
                    if (next != null && next.first) {
                        offlineMillis += next.second - timestamp
                    }
                }
            }

            DeviceActivityRecord(
                pickupCount = pickups.size,
                firstPickupAtMillis = pickups.firstOrNull()?.second?.toDouble(),
                lastPickupAtMillis = pickups.lastOrNull()?.second?.toDouble(),
                offlineSeconds = (offlineMillis / 1000).toInt(),
            )
        }
    }

    private fun requireContext(): Context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    // Special app-op permission — no dedicated "is it granted" API, this
    // AppOpsManager check is the standard, well-established pattern every
    // usage-access-dependent app uses (same shape as
    // BlockingEnforcementModule's ENABLED_ACCESSIBILITY_SERVICES check for
    // its own special-access permission).
    private fun hasUsageAccess(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun startOfDayRange(): Pair<Long, Long> {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis to System.currentTimeMillis()
    }
}
