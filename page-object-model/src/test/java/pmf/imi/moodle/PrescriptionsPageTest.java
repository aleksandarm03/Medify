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

public class PrescriptionsPageTest {

    private static final String PATIENT_JMBG = "5005005005005";
    private static final String PATIENT_PASSWORD = "Patient123!";
    private static final String DOCTOR_JMBG = "3003003003003";
    private static final String DOCTOR_PASSWORD = "Doctor123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private PrescriptionsPage prescriptionsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        loginAndOpenPrescriptions(PATIENT_JMBG, PATIENT_PASSWORD);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testPrescriptionsPageHeadingAndFilters() {
        assertTrue(driver.getCurrentUrl().contains("/prescriptions"));
        assertEquals(prescriptionsPage.getHeadingText(), "Recepti");
        assertFalse(prescriptionsPage.hasErrorMessage());
        assertEquals(prescriptionsPage.getStatusFilterOptions(), List.of("Svi", "Aktivni", "Zavrseni", "Otkazani"));
        assertEquals(prescriptionsPage.getSelectedStatusValue(), "");
        assertEquals(prescriptionsPage.getSortOptions(), List.of("Najnoviji prvo", "Najstariji prvo", "Status A-Z"));
        assertEquals(prescriptionsPage.getSelectedSortValue(), "issueDateDesc");
    }

    @Test
    public void testPatientPrescriptionsAreDisplayed() {
        assertTrue(prescriptionsPage.getPrescriptionCardsCount() > 0,
                "Pacijent treba da vidi recepte iz seed podataka.");

        String firstCard = prescriptionsPage.getFirstPrescriptionCardText();
        assertTrue(firstCard.contains("Recept #"));
        assertTrue(firstCard.contains("Pacijent:"));
        assertTrue(firstCard.contains("Doktor:"));
        assertTrue(firstCard.contains("Lekovi"));
        assertTrue(firstCard.contains("Doza:"));
    }

    @Test
    public void testStatusFiltersShowMatchingPrescriptionsOrEmptyState() {
        assertStatusFilterResult("active", "Aktivan", "status-active");
        assertStatusFilterResult("completed", "Završen", "status-completed");
        assertStatusFilterResult("cancelled", "Otkazan", "status-cancelled");
    }

    @Test
    public void testSearchAndResetFilters() {
        prescriptionsPage.setSearchTerm("nepostojeci-lek-999999");
        assertEquals(prescriptionsPage.getSearchValue(), "nepostojeci-lek-999999");
        assertTrue(prescriptionsPage.hasEmptyState());
        assertEquals(prescriptionsPage.getEmptyStateText(), "Nema recepata");

        prescriptionsPage.setDateFrom("2099-01-01");
        prescriptionsPage.setDateTo("2099-12-31");
        prescriptionsPage.selectSort("statusAsc");
        prescriptionsPage.clickReset();

        assertEquals(prescriptionsPage.getSearchValue(), "");
        assertEquals(prescriptionsPage.getDateFromValue(), "");
        assertEquals(prescriptionsPage.getDateToValue(), "");
        assertEquals(prescriptionsPage.getSelectedSortValue(), "issueDateDesc");
    }

    @Test
    public void testDoctorCanOpenCreatePrescriptionModal() {
        logoutInBrowser();
        loginAndOpenPrescriptions(DOCTOR_JMBG, DOCTOR_PASSWORD);

        assertTrue(prescriptionsPage.isNewPrescriptionButtonVisible());
        prescriptionsPage.openCreateModal();

        String modalText = prescriptionsPage.getCreateModalText();
        assertTrue(modalText.contains("Kreiraj recept"));
        assertTrue(modalText.contains("Osnovne informacije"));
        assertTrue(modalText.contains("Lekovi"));
        assertTrue(modalText.contains("Dodaj lek"));

        prescriptionsPage.closeCreateModal();
    }

    private void assertStatusFilterResult(String statusValue, String expectedText, String expectedClass) {
        prescriptionsPage.selectStatus(statusValue);

        assertEquals(prescriptionsPage.getSelectedStatusValue(), statusValue);
        if (prescriptionsPage.getVisibleStatusTexts().isEmpty()) {
            assertTrue(prescriptionsPage.hasEmptyState());
            assertEquals(prescriptionsPage.getEmptyStateText(), "Nema recepata");
            return;
        }

        assertTrue(prescriptionsPage.getVisibleStatusTexts().stream().allMatch(status -> status.equals(expectedText)));
        assertTrue(prescriptionsPage.getVisibleStatusClasses().stream().allMatch(cssClass -> cssClass.contains(expectedClass)));
    }

    private void loginAndOpenPrescriptions(String jmbg, String password) {
        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(jmbg, password);

        driver.get(PrescriptionsPage.PRESCRIPTIONS_URL);
        wait.until(ExpectedConditions.urlContains("/prescriptions"));

        prescriptionsPage = new PrescriptionsPage(driver);
        prescriptionsPage.waitForPageToSettle();
    }

    private void logoutInBrowser() {
        ((JavascriptExecutor) driver).executeScript("localStorage.clear();");
        driver.manage().deleteAllCookies();
    }
}
