package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.stream.Collectors;

public class UsersPage extends BasePageModel {
    public static final String USERS_URL = BasePageModel.BASE_URL + "/users";

    private static final By TABLE_ROWS = By.cssSelector(".users-table tbody tr");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");
    private static final By EDIT_MODAL = By.cssSelector(".modal-content:not(.delete-confirm)");
    private static final By DELETE_MODAL = By.cssSelector(".modal-content.delete-confirm");

    @FindBy(css = ".users-container h1")
    private WebElement heading;

    @FindBy(css = ".users-table thead th")
    private List<WebElement> tableHeaders;

    public UsersPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public List<String> getTableHeaders() {
        waitForRowsToSettle();
        wait.until(ExpectedConditions.visibilityOfAllElements(tableHeaders));
        return tableHeaders.stream().map(WebElement::getText).collect(Collectors.toList());
    }

    public int getRowsCount() {
        waitForRowsToSettle();
        return driver.findElements(TABLE_ROWS).size();
    }

    public List<String> getFirstRowCells() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".users-table tbody tr:first-child td"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getRoleBadgeTexts() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".users-table .role-badge"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getRoleBadgeClasses() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".users-table .role-badge"))
                .stream()
                .map(element -> element.getAttribute("class"))
                .collect(Collectors.toList());
    }

    public void openFirstEditModal() {
        waitForRowsToSettle();
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".users-table tbody tr:first-child .btn-primary"))).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(EDIT_MODAL));
    }

    public void closeEditModal() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".modal-content:not(.delete-confirm) .btn-secondary"))).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(EDIT_MODAL));
    }

    public String getEditModalHeadingText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".modal-content:not(.delete-confirm) h2"))).getText();
    }

    public List<String> getEditModalLabels() {
        return driver.findElements(By.cssSelector(".modal-content:not(.delete-confirm) label"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public void openFirstDeleteModal() {
        waitForRowsToSettle();
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".users-table tbody tr:first-child .btn-danger"))).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(DELETE_MODAL));
    }

    public void closeDeleteModal() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".modal-content.delete-confirm .btn-secondary"))).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(DELETE_MODAL));
    }

    public String getDeleteModalText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(DELETE_MODAL)).getText();
    }

    public boolean hasEmptyState() {
        return !driver.findElements(EMPTY_STATE).isEmpty() && driver.findElement(EMPTY_STATE).isDisplayed();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty() && driver.findElement(ERROR_MESSAGE).isDisplayed();
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
}
