package pmf.imi.moodle;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
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

public class AppointmentsPageTest {

    private static final String PATIENT_JMBG = "5005005005005";
    private static final String PATIENT_PASSWORD = "Patient123!";
    private static final String DOCTOR_JMBG = "3003003003003";
    private static final String DOCTOR_PASSWORD = "Doctor123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private AppointmentsPage appointmentsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        loginAndOpenAppointments(PATIENT_JMBG, PATIENT_PASSWORD);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testAppointmentsPageHeadingAndUrl() {
        assertTrue(driver.getCurrentUrl().contains("/appointments"));
        assertEquals(appointmentsPage.getHeadingText(), "Termini");
        assertTrue(appointmentsPage.isNewAppointmentButtonVisible());
        assertFalse(appointmentsPage.hasErrorMessage(), "Ne sme biti prikazana greška pri učitavanju termina.");
    }

    @Test
    public void testFiltersInitialStateAndOptions() {
        assertEquals(
                appointmentsPage.getStatusFilterOptions(),
                List.of("Svi statusi", "Zakazani", "Završeni", "Otkazani")
        );
        assertEquals(appointmentsPage.getSelectedStatusValue(), "");

        assertEquals(
                appointmentsPage.getSortOptions(),
                List.of("Najnoviji prvo", "Najstariji prvo", "Status A-Z")
        );
        assertEquals(appointmentsPage.getSelectedSortValue(), "dateDesc");
        assertEquals(appointmentsPage.getSearchValue(), "");
        assertEquals(appointmentsPage.getDateFromValue(), "");
        assertEquals(appointmentsPage.getDateToValue(), "");
    }

    @Test
    public void testPatientAppointmentsAreDisplayedByDefault() {
        assertTrue(appointmentsPage.getAppointmentCardsCount() > 0,
                "Pacijent treba da ima termine iz seed podataka.");

        String firstCardText = appointmentsPage.getFirstAppointmentCardText();
        assertTrue(firstCardText.contains("Termin #"));
        assertTrue(firstCardText.contains("Doktor:"));
        assertTrue(firstCardText.contains("Datum:"));
        assertTrue(firstCardText.contains("Razlog:"));
    }

    @Test
    public void testStatusFiltersShowMatchingAppointmentsOrEmptyState() {
        assertStatusFilterResult("scheduled", "Zakazan", "status-scheduled");
        assertStatusFilterResult("completed", "Završen", "status-completed");
        assertStatusFilterResult("canceled", "Otkazan", "status-canceled");
    }

    @Test
    public void testSearchWithNoResultsShowsEmptyState() {
        appointmentsPage.setSearchTerm("termin-koji-ne-postoji-999999");

        assertEquals(appointmentsPage.getSearchValue(), "termin-koji-ne-postoji-999999");
        assertTrue(appointmentsPage.hasEmptyState());
        assertEquals(appointmentsPage.getEmptyStateText(), "Nema termina");
    }

    @Test
    public void testDateAndSortInputsCanBeChangedAndReset() {
        appointmentsPage.setDateFrom("2099-01-01");
        appointmentsPage.setDateTo("2099-12-31");
        appointmentsPage.selectSort("statusAsc");

        assertEquals(appointmentsPage.getDateFromValue(), "2099-01-01");
        assertEquals(appointmentsPage.getDateToValue(), "2099-12-31");
        assertEquals(appointmentsPage.getSelectedSortValue(), "statusAsc");

        appointmentsPage.clickReset();

        assertEquals(appointmentsPage.getSearchValue(), "");
        assertEquals(appointmentsPage.getDateFromValue(), "");
        assertEquals(appointmentsPage.getDateToValue(), "");
        assertEquals(appointmentsPage.getSelectedSortValue(), "dateDesc");
    }

    @Test
    public void testPatientCreateAppointmentModalCanBeOpenedAndClosed() {
        appointmentsPage.openCreateModal();

        assertEquals(appointmentsPage.getModalHeadingText(), "Novi termin");
        assertTrue(appointmentsPage.isPatientDoctorSelectVisible());
        assertTrue(appointmentsPage.isModalDateInputVisible());
        assertTrue(appointmentsPage.isModalReasonTextareaVisible());

        appointmentsPage.closeCreateModal();
    }

    @Test
    public void testDoctorAppointmentsShowPatientInformationAndActions() {
        logoutInBrowser();
        loginAndOpenAppointments(DOCTOR_JMBG, DOCTOR_PASSWORD);

        assertTrue(appointmentsPage.getAppointmentCardsCount() > 0,
                "Doktor treba da ima termine iz seed podataka.");

        String firstCardText = appointmentsPage.getFirstAppointmentCardText();
        assertTrue(firstCardText.contains("Pacijent:"));
        assertTrue(firstCardText.contains("Datum:"));
        assertTrue(firstCardText.contains("Razlog:"));

        appointmentsPage.selectStatus("scheduled");
        if (!appointmentsPage.hasEmptyState()) {
            String scheduledCardText = appointmentsPage.getFirstAppointmentCardText();
            assertTrue(scheduledCardText.contains("Završi termin"));
            assertTrue(scheduledCardText.contains("Otkaži"));
        }
    }

    @Test
    public void testDoctorCreateAppointmentModalUsesPatientJmbgField() {
        logoutInBrowser();
        loginAndOpenAppointments(DOCTOR_JMBG, DOCTOR_PASSWORD);

        appointmentsPage.openCreateModal();

        assertEquals(appointmentsPage.getModalHeadingText(), "Novi termin");
        assertTrue(appointmentsPage.isDoctorPatientJmbgInputVisible());
        assertTrue(appointmentsPage.isModalDateInputVisible());
        assertTrue(appointmentsPage.isModalReasonTextareaVisible());

        appointmentsPage.closeCreateModal();
    }

    private void assertStatusFilterResult(String statusValue, String expectedStatusText, String expectedStatusClass) {
        appointmentsPage.selectStatus(statusValue);

        assertEquals(appointmentsPage.getSelectedStatusValue(), statusValue);
        if (appointmentsPage.getVisibleStatusTexts().isEmpty()) {
            assertTrue(appointmentsPage.hasEmptyState());
            assertEquals(appointmentsPage.getEmptyStateText(), "Nema termina");
            return;
        }

        assertTrue(appointmentsPage.getVisibleStatusTexts().stream().allMatch(status -> status.equals(expectedStatusText)));
        assertTrue(appointmentsPage.getVisibleStatusClasses().stream().allMatch(cssClass -> cssClass.contains(expectedStatusClass)));
    }

    private void loginAndOpenAppointments(String jmbg, String password) {
        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(jmbg, password);

        driver.get(AppointmentsPage.APPOINTMENTS_URL);
        wait.until(ExpectedConditions.urlContains("/appointments"));

        appointmentsPage = new AppointmentsPage(driver);
        appointmentsPage.waitForPageToSettle();
    }

    private void logoutInBrowser() {
        ((JavascriptExecutor) driver).executeScript("localStorage.clear();");
        driver.manage().deleteAllCookies();
    }
}
