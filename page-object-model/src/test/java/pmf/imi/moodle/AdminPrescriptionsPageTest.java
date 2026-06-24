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
import java.util.List;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

public class AdminPrescriptionsPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AdminPrescriptionsPage adminPrescriptionsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ADMIN_JMBG, ADMIN_PASSWORD);

        driver.get(AdminPrescriptionsPage.ADMIN_PRESCRIPTIONS_URL);
        wait.until(ExpectedConditions.urlContains("/admin/prescriptions"));

        adminPrescriptionsPage = new AdminPrescriptionsPage(driver);
        adminPrescriptionsPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAdminPrescriptionsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/admin/prescriptions"));
        assertEquals(adminPrescriptionsPage.getHeadingText(), "Svi recepti");
    }

    @Test
    public void testPrescriptionsTableHeadersAreDisplayed() {
        assertEquals(
                adminPrescriptionsPage.getTableHeaders(),
                List.of("ID", "Doktor", "Pacijent", "Lekovi", "Doziranje", "Trajanje", "Datum")
        );
    }

    @Test
    public void testAllPrescriptionsAreDisplayedByDefault() {
        assertTrue(adminPrescriptionsPage.getRowsCount() > 0,
                "Admin stranica treba da prikaže seed recepte.");
        assertFalse(adminPrescriptionsPage.hasErrorMessage(),
                "Ne sme biti prikazana greška pri učitavanju recepata.");
        assertFalse(adminPrescriptionsPage.hasEmptyState(),
                "Tabela treba da bude prikazana kada postoje recepti.");
        assertFalse(adminPrescriptionsPage.getFirstRowText().isEmpty());
    }

    @Test
    public void testFirstPrescriptionRowHasExpectedCells() {
        List<String> cells = adminPrescriptionsPage.getFirstRowCells();

        assertEquals(cells.size(), 7);
        assertTrue(cells.get(0).matches("[a-fA-F0-9]{8}"), "ID treba da bude prikazan kao prvih 8 karaktera.");
        assertFalse(cells.get(1).isEmpty(), "Doktor mora biti prikazan.");
        assertFalse(cells.get(2).isEmpty(), "Pacijent mora biti prikazan.");
        assertFalse(cells.get(3).isEmpty(), "Lekovi moraju biti prikazani.");
        assertFalse(cells.get(4).isEmpty(), "Doziranje mora biti prikazano.");
        assertFalse(cells.get(5).isEmpty(), "Trajanje mora biti prikazano.");
        assertTrue(cells.get(6).matches("\\d{2}\\.\\s?\\d{2}\\.\\s?\\d{4}\\."),
                "Datum treba da bude formatiran kao sr-RS datum.");
    }

    @Test
    public void testMedicationColumnsAreTruncatedOrShortEnough() {
        assertTrue(adminPrescriptionsPage.getMedicationNameCells().stream().allMatch(this::isTruncatedOrShortEnough));
        assertTrue(adminPrescriptionsPage.getDosageCells().stream().allMatch(this::isTruncatedOrShortEnough));
        assertTrue(adminPrescriptionsPage.getDurationCells().stream().allMatch(this::isTruncatedOrShortEnough));
    }

    @Test
    public void testDatesAreFormattedForDisplayedPrescriptions() {
        assertTrue(adminPrescriptionsPage.getDateCells().stream()
                .allMatch(date -> date.matches("\\d{2}\\.\\s?\\d{2}\\.\\s?\\d{4}\\.")));
    }

    private boolean isTruncatedOrShortEnough(String value) {
        return value.equals("-") || value.length() <= 50 || value.endsWith("...");
    }
}
