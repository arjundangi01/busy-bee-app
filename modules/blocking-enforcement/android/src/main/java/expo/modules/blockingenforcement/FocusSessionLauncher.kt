package expo.modules.blockingenforcement

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Builds the Intent that returns the user to the active Focus Session
 * screen, whether the app is merely backgrounded (Expo Router picks up the
 * deep link on an already-running instance) or was killed and needs a cold
 * start. Uses the app's own URI scheme (see mobile/app.json's "scheme") so
 * Expo Router's linking config resolves it to /mission/[id]/focus without
 * any native-side route knowledge beyond this one URI shape.
 */
object FocusSessionLauncher {
    private const val APP_SCHEME = "aimissioncontrol"

    fun buildIntent(context: Context): Intent? {
        val missionId = BlockingPrefs.getActiveMissionId(context) ?: return null
        val uri = Uri.parse("$APP_SCHEME://mission/$missionId/focus")
        return Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
    }
}
