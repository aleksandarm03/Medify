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

public class AdminAppointmentsPageTest {

    private static final String ADMIN_JMBG = "1001001001001";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AdminAppointmentsPage adminAppointmentsPage;

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

        driver.get(AdminAppointmentsPage.ADMIN_APPOINTMENTS_URL);
        wait.until(ExpectedConditions.urlContains("/admin/appointments"));

        adminAppointmentsPage = new AdminAppointmentsPage(driver);
        adminAppointmentsPage.waitForPageToSettle();
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAdminAppointmentsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/admin/appointments"));
        assertEquals(adminAppointmentsPage.getHeadingText(), "Svi termini");
    }

    @Test
    public void testStatusFilterInitialStateAndOptions() {
        assertEquals(
                adminAppointmentsPage.getStatusFilterOptions(),
                List.of("Svi statusi", "Zakazani", "Završeni", "Otkazani")
        );
        assertEquals(adminAppointmentsPage.getSelectedStatusValue(), "");
    }

    @Test
    public void testAppointmentsTableHeadersAreDisplayed() {
        assertEquals(
                adminAppointmentsPage.getTableHeaders(),
                List.of("ID", "Doktor", "Pacijent", "Datum", "Razlog", "Status")
        );
    }

    @Test
    public void testAllAppointmentsAreDisplayedByDefault() {
        assertTrue(adminAppointmentsPage.getRowsCount() > 0, "Admin stranica treba da prikaže seed termine.");
        assertFalse(adminAppointmentsPage.hasErrorMessage(), "Ne sme biti prikazana greška pri učitavanju termina.");
        assertFalse(adminAppointmentsPage.hasEmptyState(), "Tabela treba da bude prikazana kada postoje termini.");
        assertFalse(adminAppointmentsPage.getFirstRowText().isEmpty());
    }

    @Test
    public void testScheduledFilterShowsOnlyScheduledAppointments() {
        adminAppointmentsPage.selectStatus("scheduled");

        assertEquals(adminAppointmentsPage.getSelectedStatusValue(), "scheduled");
        assertStatusFilterResult("Zakazan", "status-scheduled");
    }

    @Test
    public void testCompletedFilterShowsOnlyCompletedAppointments() {
        adminAppointmentsPage.selectStatus("completed");

        assertEquals(adminAppointmentsPage.getSelectedStatusValue(), "completed");
        assertStatusFilterResult("Završen", "status-completed");
    }

    @Test
    public void testCanceledFilterShowsOnlyCanceledAppointments() {
        adminAppointmentsPage.selectStatus("canceled");

        assertEquals(adminAppointmentsPage.getSelectedStatusValue(), "canceled");
        assertStatusFilterResult("Otkazan", "status-canceled");
    }

    @Test
    public void testChangingFilterBackToAllStatusesRestoresRows() {
        int allRowsCount = adminAppointmentsPage.getRowsCount();

        adminAppointmentsPage.selectStatus("scheduled");
        assertTrue(adminAppointmentsPage.getRowsCount() <= allRowsCount);

        adminAppointmentsPage.selectStatus("");
        wait.until(driver -> adminAppointmentsPage.getRowsCount() == allRowsCount);

        assertEquals(adminAppointmentsPage.getSelectedStatusValue(), "");
        assertEquals(adminAppointmentsPage.getRowsCount(), allRowsCount);
    }

    private void assertStatusFilterResult(String expectedStatusText, String expectedStatusClass) {
        List<String> statusTexts = adminAppointmentsPage.getVisibleStatusTexts();
        List<String> statusClasses = adminAppointmentsPage.getVisibleStatusClasses();

        if (statusTexts.isEmpty()) {
            assertTrue(adminAppointmentsPage.hasEmptyState());
            assertEquals(adminAppointmentsPage.getEmptyStateText(), "Nema termina sa odabranim filterima");
            return;
        }

        assertTrue(statusTexts.stream().allMatch(status -> status.equals(expectedStatusText)));
        assertTrue(statusClasses.stream().allMatch(cssClass -> cssClass.contains(expectedStatusClass)));
        assertFalse(adminAppointmentsPage.hasEmptyState());
    }
}
