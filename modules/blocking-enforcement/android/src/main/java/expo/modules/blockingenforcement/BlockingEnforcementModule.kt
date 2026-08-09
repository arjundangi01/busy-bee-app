package expo.modules.blockingenforcement

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

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
            ->
            val context = requireContext()
            // Persisted first, unconditionally — this is what
            // BlockingAccessibilityService actually reads to decide whether
            // to block. The foreground service below is presence/
            // notification only; its failure must never look like the
            // session failed to start.
            BlockingPrefs.setActiveSession(context, sessionId, missionId, blockedPackages, currentStepText)
            try {
                ContextCompat.startForegroundService(context, Intent(context, FocusSessionForegroundService::class.java))
            } catch (error: Exception) {
                // Best-effort — see the matching try/catch in
                // BlockingAccessibilityService's self-heal call.
            }
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
