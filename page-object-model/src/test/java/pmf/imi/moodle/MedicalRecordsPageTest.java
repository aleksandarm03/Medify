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

public class MedicalRecordsPageTest {

    private static final String PATIENT_JMBG = "5005005005005";
    private static final String PATIENT_PASSWORD = "Patient123!";
    private static final String DOCTOR_JMBG = "3003003003003";
    private static final String DOCTOR_PASSWORD = "Doctor123!";

    private WebDriver driver;
    private WebDriverWait wait;
    private MedicalRecordsPage medicalRecordsPage;

    @BeforeMethod
    public void beforeMethod() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        loginAndOpenMedicalRecords(PATIENT_JMBG, PATIENT_PASSWORD);
    }

    @AfterMethod
    public void afterMethod() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    public void testMedicalRecordsPageHeadingAndFilters() {
        assertTrue(driver.getCurrentUrl().contains("/medical-records"));
        assertEquals(medicalRecordsPage.getHeadingText(), "Medicinski kartoni");
        assertFalse(medicalRecordsPage.hasErrorMessage());
        assertEquals(medicalRecordsPage.getSortOptions(), List.of("Najnoviji prvo", "Najstariji prvo", "Dijagnoza A-Z"));
        assertEquals(medicalRecordsPage.getSelectedSortValue(), "visitDateDesc");
    }

    @Test
    public void testPatientMedicalRecordsAreDisplayed() {
        assertTrue(medicalRecordsPage.getRecordCardsCount() > 0,
                "Pacijent treba da vidi medicinske kartone iz seed podataka.");

        String firstCard = medicalRecordsPage.getFirstRecordCardText();
        assertTrue(firstCard.contains("Karton #"));
        assertTrue(firstCard.contains("Dijagnoza:"));
        assertFalse(firstCard.contains("Pacijent:"), "Patient prikaz ne treba da prikazuje labelu Pacijent.");
    }

    @Test
    public void testSearchAndResetFilters() {
        medicalRecordsPage.setSearchTerm("nepostojeca-dijagnoza-999999");
        assertEquals(medicalRecordsPage.getSearchValue(), "nepostojeca-dijagnoza-999999");
        assertTrue(medicalRecordsPage.hasEmptyState());
        assertEquals(medicalRecordsPage.getEmptyStateText(), "Nema medicinskih kartona");

        medicalRecordsPage.setDateFrom("2099-01-01");
        medicalRecordsPage.setDateTo("2099-12-31");
        medicalRecordsPage.selectSort("diagnosisAsc");
        medicalRecordsPage.clickReset();

        assertEquals(medicalRecordsPage.getSearchValue(), "");
        assertEquals(medicalRecordsPage.getDateFromValue(), "");
        assertEquals(medicalRecordsPage.getDateToValue(), "");
        assertEquals(medicalRecordsPage.getSelectedSortValue(), "visitDateDesc");
    }

    @Test
    public void testDoctorCanOpenCreateMedicalRecordModal() {
        logoutInBrowser();
        loginAndOpenMedicalRecords(DOCTOR_JMBG, DOCTOR_PASSWORD);

        assertTrue(medicalRecordsPage.isNewRecordButtonVisible());
        medicalRecordsPage.openCreateModal();

        String modalText = medicalRecordsPage.getCreateModalText();
        assertTrue(modalText.contains("Kreiraj medicinski karton"));
        assertTrue(modalText.contains("ID Pacijenta *"));
        assertTrue(modalText.contains("Dijagnoza *"));
        assertTrue(modalText.contains("Kreiraj"));

        medicalRecordsPage.closeCreateModal();
    }

    private void loginAndOpenMedicalRecords(String jmbg, String password) {
        driver.get(LoginPage.LOGIN_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("jmbg")));

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(jmbg, password);

        driver.get(MedicalRecordsPage.MEDICAL_RECORDS_URL);
        wait.until(ExpectedConditions.urlContains("/medical-records"));

        medicalRecordsPage = new MedicalRecordsPage(driver);
        medicalRecordsPage.waitForPageToSettle();
    }

    private void logoutInBrowser() {
        ((JavascriptExecutor) driver).executeScript("localStorage.clear();");
        driver.manage().deleteAllCookies();
    }
}
