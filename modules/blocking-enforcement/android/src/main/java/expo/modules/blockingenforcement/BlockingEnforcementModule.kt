package expo.modules.blockingenforcement

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import androidx.core.content.ContextCompat
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.concurrent.TimeUnit

// Unique work name so a new session's scheduled expiry always replaces any
// stale pending job (ExistingWorkPolicy.REPLACE below) instead of needing
// manual bookkeeping of a previous request's id.
private const val EXPIRY_WORK_NAME = "focus-session-expiry"

class PendingBlockedAttemptRecord(
    @Field
    val packageName: String = "",
    @Field
    val occurredAtMillis: Double = 0.0,
) : Record

class BlockingEnforcementModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BlockingEnforcement")

        // Called at Focus Session start, whenever the current step changes
        // (via updateCurrentStep), and whenever the blocklist itself changes
        // mid-session — pushes the state the AccessibilityService reads on
        // every foreground-app event.
        AsyncFunction("setActiveSession") {
                sessionId: String,
                missionId: String,
                blockedPackages: List<String>,
                currentStepText: String,
                expiresAtEpochMillis: Double,
            ->
            val context = requireContext()
            // Persisted first, unconditionally — this is what
            // BlockingAccessibilityService actually reads to decide whether
            // to block. The foreground service below is presence/
            // notification only; its failure must never look like the
            // session failed to start.
            BlockingPrefs.setActiveSession(
                context,
                sessionId,
                missionId,
                blockedPackages,
                currentStepText,
                expiresAtEpochMillis.toLong(),
            )
            try {
                ContextCompat.startForegroundService(context, Intent(context, FocusSessionForegroundService::class.java))
            } catch (error: Exception) {
                // Best-effort — see the matching try/catch in
                // BlockingAccessibilityService's self-heal call.
            }
            scheduleExpiryWork(context, expiresAtEpochMillis.toLong())
        }

        AsyncFunction("updateCurrentStep") { stepText: String ->
            BlockingPrefs.updateCurrentStep(requireContext(), stepText)
        }

        // Called on every session end path (completed, early exit, time-limit
        // cutoff) — after this, the service sees no active session and every
        // app opens normally again.
        AsyncFunction("clearActiveSession") {
            val context = requireContext()
            BlockingPrefs.clearActiveSession(context)
            context.stopService(Intent(context, FocusSessionForegroundService::class.java))
            cancelExpiryWork(context)
        }

        // Consume-all: returns every unread collision (queued, not just the
        // latest — see BlockingPrefs' MAX_PENDING_ATTEMPTS cap) and clears
        // them in the same call. Callers (useBlockingEnforcement) poll this
        // on app-foreground so a collision that happened while the RN app
        // itself was backgrounded is never lost or double-counted.
        AsyncFunction("getPendingBlockedAttempts") {
            BlockingPrefs.consumePendingBlockedAttempts(requireContext()).map { pending ->
                PendingBlockedAttemptRecord(
                    packageName = pending.packageName,
                    occurredAtMillis = pending.occurredAtMillis.toDouble(),
                )
            }
        }

        AsyncFunction("isAccessibilityServiceEnabled") {
            isAccessibilityServiceEnabled(requireContext())
        }

        AsyncFunction("openAccessibilitySettings") {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            requireContext().startActivity(intent)
        }
    }

    private fun requireContext(): Context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    // Delay clamped to >= 0 -- a session pushed with an already-past
    // expiresAt (e.g. a slow app resume reconciling a long-abandoned
    // session) should fire the worker immediately, not be rejected by
    // WorkManager for a negative delay.
    private fun scheduleExpiryWork(context: Context, expiresAtEpochMillis: Long) {
        val delayMillis = (expiresAtEpochMillis - System.currentTimeMillis()).coerceAtLeast(0)
        val request = OneTimeWorkRequestBuilder<FocusSessionExpiryWorker>()
            .setInitialDelay(delayMillis, TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(EXPIRY_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
    }

    // Block-bodied fun, not an inline call in the AsyncFunction lambda: Kotlin infers a
    // block-bodied fun's return type as Unit regardless of its last expression, whereas
    // the lambda directly returning WorkManager's cancelUniqueWork() infers Operation —
    // which Expo's bridge can't serialize ("Unknown type: class androidx.work.impl.OperationImpl").
    private fun cancelExpiryWork(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(EXPIRY_WORK_NAME)
    }

    // Standard ENABLED_ACCESSIBILITY_SERVICES colon-separated-list check —
    // there is no dedicated API for "is my specific service enabled", this
    // is the well-established pattern every accessibility-dependent app uses.
    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        val expected = ComponentName(context, BlockingAccessibilityService::class.java).flattenToString()
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: return false

        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabledServices)
        while (splitter.hasNext()) {
            if (splitter.next().equals(expected, ignoreCase = true)) return true
        }
        return false
    }
}
