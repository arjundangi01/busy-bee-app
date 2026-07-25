package expo.modules.installedapps

import android.content.pm.PackageManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class InstalledAppRecord(
  @Field
  val packageName: String = "",
  @Field
  val appName: String = "",
) : Record

class InstalledAppsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("InstalledApps")

    AsyncFunction("getInstalledApps") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val packageManager = context.packageManager
      val hostPackageName = context.packageName

      // getInstalledApplications() returns every installed package, including
      // system/background-only ones with no UI. Filtering to packages with a
      // resolvable ACTION_MAIN + CATEGORY_LAUNCHER activity (what
      // getLaunchIntentForPackage checks) narrows that down to real,
      // user-facing apps — the same set a home-screen launcher would show.
      packageManager
        .getInstalledApplications(PackageManager.GET_META_DATA)
        .asSequence()
        .filter { it.packageName != hostPackageName }
        .filter { packageManager.getLaunchIntentForPackage(it.packageName) != null }
        .map { appInfo ->
          InstalledAppRecord(
            packageName = appInfo.packageName,
            appName = packageManager.getApplicationLabel(appInfo).toString(),
          )
        }
        .distinctBy { it.packageName }
        .sortedBy { it.appName.lowercase() }
        .toList()
    }
  }
}
