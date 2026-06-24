package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class AvailabilityPage extends BasePageModel {
    public static final String AVAILABILITY_URL = BasePageModel.BASE_URL + "/availability";

    private static final By AVAILABILITY_CARDS = By.cssSelector(".availability-card");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");
    private static final By CREATE_MODAL = By.cssSelector(".modal-content");

    @FindBy(css = ".availability-container h1")
    private WebElement heading;

    @FindBy(css = ".header .btn-primary")
    private WebElement addAvailabilityButton;

    public AvailabilityPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public int getAvailabilityCardsCount() {
        waitForPageToSettle();
        return driver.findElements(AVAILABILITY_CARDS).size();
    }

    public String getFirstAvailabilityCardText() {
        waitForPageToSettle();
        return driver.findElements(AVAILABILITY_CARDS).get(0).getText();
    }

    public void openCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(addAvailabilityButton)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(CREATE_MODAL));
    }

    public void closeCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".modal-content .btn-secondary"))).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(CREATE_MODAL));
    }

    public String getCreateModalText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(CREATE_MODAL)).getText();
    }

    public boolean hasEmptyState() {
        return !driver.findElements(EMPTY_STATE).isEmpty() && driver.findElement(EMPTY_STATE).isDisplayed();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty() && driver.findElement(ERROR_MESSAGE).isDisplayed();
    }

    public void waitForPageToSettle() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING));
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(AVAILABILITY_CARDS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }
}
