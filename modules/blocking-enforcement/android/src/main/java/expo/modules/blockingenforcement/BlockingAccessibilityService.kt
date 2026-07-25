package expo.modules.blockingenforcement

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

/**
 * Watches which app is in the foreground while a Focus Session is active
 * (BlockingPrefs.getActiveSessionId() != null) and, the instant a blocklisted
 * package comes to the foreground, launches the blocking interstitial in
 * place of it. See design-artifacts/evolution/specs/01-blocked-app-interstitial.md.
 *
 * Deliberately reads BlockingPrefs fresh on every event rather than caching
 * session/blocklist state in memory — this service can outlive the exact
 * moment the RN app last pushed an update, and a stale in-memory copy would
 * mean a just-removed app stays blocked (or a just-added one stays open)
 * until the next unrelated event happened to refresh it.
 */
class BlockingAccessibilityService : AccessibilityService() {

    // Collapses the many window-state-changed events fired while navigating
    // *within* one already-foregrounded app (each internal screen change
    // still reports that same app's package) down to one handled transition
    // per real app switch.
    private var lastForegroundPackage: String? = null

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        if (packageName == lastForegroundPackage) return
        lastForegroundPackage = packageName

        // Never intercept our own app's windows — this is what the
        // interstitial Activity itself, and the app being brought back to
        // the foreground via its CTA, both report as their package.
        if (packageName == applicationContext.packageName) return

        // No active session — nothing to enforce right now.
        BlockingPrefs.getActiveSessionId(this) ?: return

        if (packageName !in BlockingPrefs.getBlockedPackages(this)) return

        BlockingPrefs.recordPendingBlockedAttempt(this, packageName)
        launchInterstitial(packageName)
    }

    private fun launchInterstitial(blockedPackageName: String) {
        val intent = Intent(this, BlockedAppInterstitialActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(BlockedAppInterstitialActivity.EXTRA_PACKAGE_NAME, blockedPackageName)
        }
        startActivity(intent)
    }

    override fun onInterrupt() {
        // Required override — the system calls this if it needs to
        // interrupt the service's feedback; there's no ongoing feedback
        // stream here to interrupt (no TTS/haptics), so there's nothing to
        // do beyond satisfying the abstract method.
    }
}
