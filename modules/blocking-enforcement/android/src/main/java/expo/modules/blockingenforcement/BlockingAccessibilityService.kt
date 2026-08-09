package expo.modules.blockingenforcement

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import androidx.core.content.ContextCompat

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

        // Reactive half of self-expiry (the other half is
        // FocusSessionExpiryWorker, a scheduled backstop for when the phone
        // sits idle and no foreground-app event ever fires). Checked on the
        // same hot path this service already runs on every app switch, so a
        // session whose cap/24h safety net has passed stops blocking the
        // instant the user actually tries to open something — no dependency
        // on the JS side being alive.
        if (BlockingPrefs.clearIfExpired(this)) {
            stopService(Intent(this, FocusSessionForegroundService::class.java))
            return
        }

        // The actual blocking decision — deliberately made and acted on
        // before the self-heal call below, and never allowed to be skipped
        // by it (see the try/catch there): the notification presence is a
        // nice-to-have, this is the entire point of the feature.
        if (packageName in BlockingPrefs.getBlockedPackages(this)) {
            BlockingPrefs.recordPendingBlockedAttempt(this, packageName)
            launchInterstitial(packageName)
        }

        // Self-heal: FocusSessionForegroundService can be killed by the OS/
        // OEM battery management independently of this AccessibilityService,
        // which tends to survive more aggressively. Restarting it here is
        // idempotent (onStartCommand just re-establishes foreground state
        // and reschedules its own tick loop if already running) and is
        // naturally throttled to once per real app switch by the dedup
        // above, not once per raw accessibility event.
        //
        // Wrapped defensively: an uncaught exception inside
        // onAccessibilityEvent crashes this entire AccessibilityService,
        // which Android then unbinds — silently killing ALL blocking, not
        // just the notification, until the user notices and manually
        // re-enables the service in Settings. Android 12+'s
        // ForegroundServiceStartNotAllowedException (a real possibility
        // when starting a service from a callback context like this, not a
        // foreground Activity) must never be allowed to take down blocking
        // enforcement — it already degraded gracefully once above.
        try {
            ContextCompat.startForegroundService(this, Intent(this, FocusSessionForegroundService::class.java))
        } catch (error: Exception) {
            // Best-effort only — the notification may be stale/absent until
            // the next natural setActiveSession/clearActiveSession call, but
            // blocking itself is unaffected.
        }
    }

    private fun launchInterstitial(blockedPackageName: String) {
        val intent = Intent(this, BlockedAppInterstitialActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(BlockedAppInterstitialActivity.EXTRA_PACKAGE_NAME, blockedPackageName)
        }
        // A failure here (BAL restriction, OEM quirk) must not crash this
        // service — that would silently disable ALL future blocking for the
        // rest of the session (and until the user notices and manually
        // re-toggles the accessibility permission), compounding one missed
        // collision into a total outage. Worth surfacing in real testing —
        // if this ever actually throws on-device, that's the concrete
        // signal to dig into BAL exemptions specifically — but it must
        // never be allowed to propagate uncaught from here.
        try {
            startActivity(intent)
        } catch (error: Exception) {
            // Nothing further to do — the pending-blocked-attempt record was
            // already written before this call, so the collision is still
            // counted even though the interstitial itself didn't show.
        }
    }

    override fun onInterrupt() {
        // Required override — the system calls this if it needs to
        // interrupt the service's feedback; there's no ongoing feedback
        // stream here to interrupt (no TTS/haptics), so there's nothing to
        // do beyond satisfying the abstract method.
    }
}
