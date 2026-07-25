package expo.modules.blockingenforcement

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
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

        // Called at Focus Session start (and whenever the current step
        // changes, via updateCurrentStep) — pushes the state the
        // AccessibilityService reads on every foreground-app event.
        AsyncFunction("setActiveSession") {
                sessionId: String,
                missionId: String,
                blockedPackages: List<String>,
                currentStepText: String,
            ->
            val context = requireContext()
            BlockingPrefs.setActiveSession(context, sessionId, missionId, blockedPackages, currentStepText)
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
            SessionNotificationManager.clear(context)
        }

        AsyncFunction("updateSessionNotification") { elapsedLabel: String ->
            val context = requireContext()
            SessionNotificationManager.show(context, elapsedLabel, BlockingPrefs.getCurrentStepText(context))
        }

        AsyncFunction("clearSessionNotification") {
            SessionNotificationManager.clear(requireContext())
        }

        // Consume-once: returns the most recent unread collision, if any,
        // and clears it in the same call. Callers (useBlockingEnforcement)
        // poll this on app-foreground so a collision that happened while
        // the RN app itself was backgrounded is never lost or double-counted.
        AsyncFunction("getPendingBlockedAttempt") {
            val pending = BlockingPrefs.consumePendingBlockedAttempt(requireContext()) ?: return@AsyncFunction null
            PendingBlockedAttemptRecord(
                packageName = pending.packageName,
                occurredAtMillis = pending.occurredAtMillis.toDouble(),
            )
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
