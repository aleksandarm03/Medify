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

public class AdminMedicalRecordsPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AdminMedicalRecordsPage adminMedicalRecordsPage;

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

        driver.get(AdminMedicalRecordsPage.ADMIN_MEDICAL_RECORDS_URL);
        wait.until(ExpectedConditions.urlContains("/admin/medical-records"));

        adminMedicalRecordsPage = new AdminMedicalRecordsPage(driver);
        adminMedicalRecordsPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAdminMedicalRecordsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/admin/medical-records"));
        assertEquals(adminMedicalRecordsPage.getHeadingText(), "Svi medicinski kartoni");
    }

    @Test
    public void testMedicalRecordsTableHeadersAreDisplayed() {
        assertEquals(
                adminMedicalRecordsPage.getTableHeaders(),
                List.of("ID", "Doktor", "Pacijent", "Diagnoza", "Tretman", "Napomene", "Datum")
        );
    }

    @Test
    public void testAllMedicalRecordsAreDisplayedByDefault() {
        assertTrue(adminMedicalRecordsPage.getRowsCount() > 0,
                "Admin stranica treba da prikaže seed medicinske kartone.");
        assertFalse(adminMedicalRecordsPage.hasErrorMessage(),
                "Ne sme biti prikazana greška pri učitavanju medicinskih kartona.");
        assertFalse(adminMedicalRecordsPage.hasEmptyState(),
                "Tabela treba da bude prikazana kada postoje medicinski kartoni.");
        assertFalse(adminMedicalRecordsPage.getFirstRowText().isEmpty());
    }

    @Test
    public void testFirstMedicalRecordRowHasExpectedCells() {
        List<String> cells = adminMedicalRecordsPage.getFirstRowCells();

        assertEquals(cells.size(), 7);
        assertTrue(cells.get(0).matches("[a-fA-F0-9]{8}"), "ID treba da bude prikazan kao prvih 8 karaktera.");
        assertFalse(cells.get(1).isEmpty(), "Doktor mora biti prikazan.");
        assertFalse(cells.get(2).isEmpty(), "Pacijent mora biti prikazan.");
        assertFalse(cells.get(3).isEmpty(), "Diagnoza mora biti prikazana.");
        assertFalse(cells.get(4).isEmpty(), "Tretman mora biti prikazan.");
        assertFalse(cells.get(5).isEmpty(), "Napomene moraju biti prikazane.");
        assertTrue(cells.get(6).matches("\\d{2}\\.\\s?\\d{2}\\.\\s?\\d{4}\\."),
                "Datum treba da bude formatiran kao sr-RS datum.");
    }

    @Test
    public void testLongTextColumnsAreTruncatedOrShortEnough() {
        assertTrue(adminMedicalRecordsPage.getDiagnosisCells().stream().allMatch(this::isTruncatedOrShortEnough));
        assertTrue(adminMedicalRecordsPage.getTreatmentCells().stream().allMatch(this::isTruncatedOrShortEnough));
        assertTrue(adminMedicalRecordsPage.getNotesCells().stream().allMatch(this::isTruncatedOrShortEnough));
    }

    @Test
    public void testDatesAreFormattedForDisplayedRecords() {
        assertTrue(adminMedicalRecordsPage.getDateCells().stream()
                .allMatch(date -> date.matches("\\d{2}\\.\\s?\\d{2}\\.\\s?\\d{4}\\.")));
    }

    private boolean isTruncatedOrShortEnough(String value) {
        return value.equals("-") || value.length() <= 50 || value.endsWith("...");
    }
}
