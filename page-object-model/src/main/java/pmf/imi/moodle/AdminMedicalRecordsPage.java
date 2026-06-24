package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.stream.Collectors;

public class AdminMedicalRecordsPage extends BasePageModel {
    public static final String ADMIN_MEDICAL_RECORDS_URL = BasePageModel.BASE_URL + "/admin/medical-records";

    private static final By TABLE_ROWS = By.cssSelector(".records-table tbody tr");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");

    @FindBy(css = ".admin-medical-records-container h1")
    private WebElement heading;

    @FindBy(css = ".records-table thead th")
    private List<WebElement> tableHeaders;

    public AdminMedicalRecordsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public List<String> getTableHeaders() {
        waitForRowsToSettle();
        wait.until(ExpectedConditions.visibilityOfAllElements(tableHeaders));
        return tableHeaders.stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public int getRowsCount() {
        waitForRowsToSettle();
        return driver.findElements(TABLE_ROWS).size();
    }

    public String getFirstRowText() {
        waitForRowsToSettle();
        return driver.findElements(TABLE_ROWS).get(0).getText();
    }

    public List<String> getFirstRowCells() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".records-table tbody tr:first-child td"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getDiagnosisCells() {
        waitForRowsToSettle();
        return getColumnTexts(4);
    }

    public List<String> getTreatmentCells() {
        waitForRowsToSettle();
        return getColumnTexts(5);
    }

    public List<String> getNotesCells() {
        waitForRowsToSettle();
        return getColumnTexts(6);
    }

    public List<String> getDateCells() {
        waitForRowsToSettle();
        return getColumnTexts(7);
    }

    public boolean hasEmptyState() {
        return !driver.findElements(EMPTY_STATE).isEmpty()
                && driver.findElement(EMPTY_STATE).isDisplayed();
    }

    public String getEmptyStateText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE)).getText();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty()
                && driver.findElement(ERROR_MESSAGE).isDisplayed();
    }

    public void waitForPageToSettle() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING));
        waitForRowsToSettle();
    }

    private void waitForRowsToSettle() {
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(TABLE_ROWS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private List<String> getColumnTexts(int columnIndex) {
        return driver.findElements(By.cssSelector(".records-table tbody tr td:nth-child(" + columnIndex + ")"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }
}
