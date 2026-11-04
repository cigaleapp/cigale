package io.github.cigaleapp

import android.content.Intent
import android.util.Log
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
@LargeTest
class CoreTest {
    // The app shows a full-screen #loading overlay while it boots, then removes
    // it from the DOM once the root layout has finished loading. Waiting for it
    // to disappear is the most reliable "the app is ready" signal, since the
    // landing page renders no stable text on a fresh emulator.
    //
    // The WebView check runs on a background thread with a hard timeout enforced
    // on the test thread. This is critical: Espresso's onWebView() and
    // uiController.loopMainThreadForAtLeast() both block the *calling* thread
    // until the app's main thread is idle. If the app's main thread is blocked
    // (e.g. by a hanging startup), a check on the test thread would hang forever
    // and kill the job at the 90-min workflow limit with no report. Running the
    // check on a background thread lets the test thread enforce a hard timeout
    // and fail fast, so the background-streamed logcat is uploaded and we can
    // diagnose the hang.
    @Test
    fun insectaProtocol() {
        // Launch the activity manually via InstrumentationRegistry instead of
        // ActivityScenario (androidx.test:core's scenario package is not
        // available on this classpath) or ActivityScenarioRule (whose
        // after() calls scenario.close(), which waits for the app's main
        // thread to become idle. If the app's main thread is blocked by a
        // hanging startup, close() hangs for the rest of the job and the
        // runner never reports the test as completed). A plain
        // startActivity() has no teardown that waits on the main thread, so
        // the test fails fast once the join timeout below fires.
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        instrumentation.runOnMainSync {
            context.startActivity(
                Intent(context, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }

        Log.d("io.github.cigaleapp", "Waiting for the app to finish loading")

        var checkError: Throwable? = null
        val checker = Thread {
            try {
                onView(isRoot()).perform(
                    waitForWebElementGone("#loading", 5, TimeUnit.MINUTES)
                )
            } catch (t: Throwable) {
                checkError = t
            }
        }
        checker.start()
        checker.join(6 * 60 * 1000L)

        if (checker.isAlive) {
            checker.interrupt()
            throw AssertionError(
                "The app did not finish loading within 6 minutes. " +
                    "The WebView check is still blocked, which means the app's " +
                    "main thread is blocked. Check the logcat for the root cause."
            )
        }

        checkError?.let {
            throw AssertionError("The app did not finish loading: $it", it)
        }

        Log.d("io.github.cigaleapp", "App loaded: the loading overlay is gone")
    }
}
