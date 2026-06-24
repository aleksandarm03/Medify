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
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

public class AvailabilityPageTest {

    private static final String DOCTOR_JMBG = "3003003003003";
    private static final String DOCTOR_PASSWORD = "Doctor123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AvailabilityPage availabilityPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(DOCTOR_JMBG, DOCTOR_PASSWORD);

        driver.get(AvailabilityPage.AVAILABILITY_URL);
        wait.until(ExpectedConditions.urlContains("/availability"));

        availabilityPage = new AvailabilityPage(driver);
        availabilityPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAvailabilityPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/availability"));
        assertEquals(availabilityPage.getHeadingText(), "Dostupnost");
        assertFalse(availabilityPage.hasErrorMessage());
    }

    @Test
    public void testDoctorAvailabilitiesAreDisplayed() {
        assertTrue(availabilityPage.getAvailabilityCardsCount() > 0,
                "Doktor treba da ima default dostupnosti iz seed podataka.");

        String cardText = availabilityPage.getFirstAvailabilityCardText();
        assertTrue(cardText.contains("Vreme:"));
        assertTrue(cardText.contains("Trajanje termina:"));
        assertTrue(cardText.contains("Status:"));
    }

    @Test
    public void testCreateAvailabilityModalCanBeOpenedAndClosed() {
        availabilityPage.openCreateModal();

        String modalText = availabilityPage.getCreateModalText();
        assertTrue(modalText.contains("Dodaj dostupnost"));
        assertTrue(modalText.contains("Dan u nedelji *"));
        assertTrue(modalText.contains("Početno vreme *"));
        assertTrue(modalText.contains("Završno vreme *"));
        assertTrue(modalText.contains("Trajanje termina"));

        availabilityPage.closeCreateModal();
    }
}
