package pmf.imi.moodle;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.time.Duration;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

public class NotificationsPageTest {

    private static final String PATIENT_JMBG = "5005005005005";
    private static final String PATIENT_PASSWORD = "Patient123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private NotificationsPage notificationsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(PATIENT_JMBG, PATIENT_PASSWORD);

        driver.get(NotificationsPage.NOTIFICATIONS_URL);
        wait.until(ExpectedConditions.urlContains("/notifications"));

        notificationsPage = new NotificationsPage(driver);
        notificationsPage.waitForPageToRender();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testNotificationsPageHeaderAndActions() {
        assertTrue(driver.getCurrentUrl().contains("/notifications"));
        assertEquals(notificationsPage.getHeadingText(), "Obaveštenja");
        assertTrue(notificationsPage.getUnreadBadgeText().matches("Nepročitano: \\d+"));
        assertEquals(notificationsPage.getMarkAllReadButtonText(), "Označi sve kao pročitano");
        assertEquals(notificationsPage.getClearAllButtonText(), "Obriši sve");
    }

    @Test
    public void testNotificationsEmptyOrListStateIsRendered() {
        if (notificationsPage.getNotificationCardsCount() == 0) {
            assertTrue(notificationsPage.hasEmptyState());
            assertEquals(notificationsPage.getEmptyStateText(), "Trenutno nema obaveštenja.");
            return;
        }

        String cardText = notificationsPage.getFirstNotificationCardText();
        assertTrue(cardText.contains("Kategorija:"));
        assertTrue(cardText.contains("Označi kao pročitano"));
        assertTrue(cardText.contains("Obriši"));
    }
}
