package expo.modules.blockingenforcement

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * The full-screen blocker shown instead of a blocklisted app while a Focus
 * Session is active. See design-artifacts/evolution/specs/01-blocked-app-interstitial.md.
 * No dismiss/override path exists in this Activity by design — its task has
 * nothing behind it (see the manifest's taskAffinity=""), so the system
 * back button naturally exits to the launcher rather than revealing the
 * blocked app underneath, with no extra handling needed here.
 */
class BlockedAppInterstitialActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PACKAGE_NAME = "expo.modules.blockingenforcement.EXTRA_PACKAGE_NAME"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_blocked_interstitial)

        val blockedPackageName = intent.getStringExtra(EXTRA_PACKAGE_NAME)
        val appLabel = resolveAppLabel(blockedPackageName)
        val stepText = BlockingPrefs.getCurrentStepText(this)

        findViewById<TextView>(R.id.interstitial_headline).text =
            getString(R.string.interstitial_headline, appLabel)

        findViewById<TextView>(R.id.interstitial_subcopy).text = if (!stepText.isNullOrBlank()) {
            getString(R.string.interstitial_subcopy_with_step, stepText)
        } else {
            getString(R.string.interstitial_subcopy_no_step)
        }

        findViewById<Button>(R.id.interstitial_cta).setOnClickListener { returnToBusyBee() }
    }

    // A real installed app always resolves via getApplicationInfo, but this
    // is user-controlled data flowing through a detection event — falling
    // back to the raw package name rather than crashing keeps this screen
    // rendering even in a state that shouldn't normally happen (e.g. the
    // app was uninstalled in the moment between detection and render).
    private fun resolveAppLabel(packageName: String?): String {
        if (packageName == null) return getString(R.string.interstitial_headline_fallback_app)
        return try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: PackageManager.NameNotFoundException) {
            packageName
        }
    }

    // Prefers a deep link straight back into the active Focus Session; if
    // the session already ended (e.g. the user exited from elsewhere between
    // this screen rendering and the tap), that deep link is unavailable, so
    // this falls back to the app's own default launch intent instead of
    // dead-ending here — the CTA must always lead somewhere.
    private fun returnToBusyBee() {
        val focusIntent = FocusSessionLauncher.buildIntent(this)
        val fallbackIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        (focusIntent ?: fallbackIntent)?.let { startActivity(it) }
        finish()
    }
}
