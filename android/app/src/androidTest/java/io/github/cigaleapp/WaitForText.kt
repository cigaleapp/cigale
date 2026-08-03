package io.github.cigaleapp

import android.view.View
import androidx.test.espresso.PerformException
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.espresso.util.HumanReadables
import androidx.test.espresso.web.assertion.WebViewAssertions.webMatches
import androidx.test.espresso.web.sugar.Web.onWebView
import androidx.test.espresso.web.webdriver.DriverAtoms.findElement
import androidx.test.espresso.web.webdriver.DriverAtoms.getText
import androidx.test.espresso.web.webdriver.Locator
import org.hamcrest.Matcher
import org.hamcrest.Matchers.containsString
import java.util.concurrent.TimeUnit

fun waitForWebText(expectedText: String, timeout: Long, unit: TimeUnit): ViewAction {
	return object : ViewAction {
		override fun getConstraints(): Matcher<View> = isRoot()

		override fun getDescription(): String = "Wait for text '$expectedText' to be in the WebView"

		override fun perform(uiController: UiController, view: View) {
			val endTime = System.currentTimeMillis() + unit.toMillis(timeout)

			do {
				try {
					onWebView().forceJavascriptEnabled()
						.withElement(findElement(Locator.XPATH, "//body")).check(
							webMatches(
								getText(), containsString(expectedText)
							)
						) 

					return 
				} catch (t: Throwable) {
					// pass
				}

				uiController.loopMainThreadForAtLeast(1000)

			} while (System.currentTimeMillis() < endTime)

			throw PerformException.Builder().withActionDescription(description)
				.withViewDescription(HumanReadables.describe(view))
				.withCause(RuntimeException("Le texte '$expectedText' n'est pas apparu après $timeout ${unit.name.lowercase()}"))
				.build()
		}
	}
}
