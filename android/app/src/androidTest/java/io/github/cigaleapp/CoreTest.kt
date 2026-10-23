package io.github.cigaleapp

import android.util.Log
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
@LargeTest
class CoreTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun insectaProtocol() {
        println("Waiting for the app to finish loading")
        Log.d("io.github.cigaleapp", "Waiting for the app to finish loading")

        // The app shows a full-screen #loading overlay while it boots, then removes
        // it from the DOM once the root layout has finished loading. Waiting for it
        // to disappear is the most reliable "the app is ready" signal, since the
        // landing page renders no stable text on a fresh emulator.
        onView(isRoot()).perform(
            waitForWebElementGone("#loading", 5, TimeUnit.MINUTES)
        )

        println("App loaded: the loading overlay is gone")
        Log.d("io.github.cigaleapp", "App loaded: the loading overlay is gone")
    }
}
