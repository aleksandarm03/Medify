package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class DoctorsPage extends BasePageModel {
    public static final String DOCTORS_URL = BasePageModel.BASE_URL + "/doctors";

    @FindBy(css = ".doctors-container h1")
    private WebElement heading;

    @FindBy(css = ".search-filters .form-group:nth-of-type(1) input")
    private WebElement specializationInput;

    @FindBy(css = ".search-filters .form-group:nth-of-type(2) input")
    private WebElement nameInput;

    @FindBy(css = ".search-actions .btn.btn-primary")
    private WebElement searchButton;

    @FindBy(css = ".search-actions .btn.btn-secondary")
    private WebElement clearButton;

    @FindBy(css = ".doctors-list .doctor-card")
    private List<WebElement> doctorCards;

    @FindBy(css = ".doctors-list .doctor-card a.btn.btn-primary")
    private List<WebElement> detailsButtons;

    public DoctorsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        wait.until(ExpectedConditions.visibilityOf(heading));
        return heading.getText();
    }

    public void setSpecialization(String specialization) {
        wait.until(ExpectedConditions.visibilityOf(specializationInput));
        specializationInput.clear();
        specializationInput.sendKeys(specialization);
    }

    public void setName(String name) {
        wait.until(ExpectedConditions.visibilityOf(nameInput));
        nameInput.clear();
        nameInput.sendKeys(name);
    }

    public String getSpecializationValue() {
        wait.until(ExpectedConditions.visibilityOf(specializationInput));
        return specializationInput.getAttribute("value");
    }

    public String getNameValue() {
        wait.until(ExpectedConditions.visibilityOf(nameInput));
        return nameInput.getAttribute("value");
    }

    public void clickSearch() {
        wait.until(ExpectedConditions.elementToBeClickable(searchButton)).click();
        waitForResultsToSettle();
    }

    public void clickClear() {
        wait.until(ExpectedConditions.elementToBeClickable(clearButton)).click();
        waitForResultsToSettle();
    }

    public int getDoctorCardsCount() {
        waitForResultsToSettle();
        return doctorCards.size();
    }

    public String getFirstDoctorCardText() {
        waitForResultsToSettle();
        return doctorCards.get(0).getText();
    }

    public void openFirstDoctorDetails() {
        waitForResultsToSettle();
        wait.until(ExpectedConditions.elementToBeClickable(detailsButtons.get(0))).click();
    }

    private void waitForResultsToSettle() {
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(By.cssSelector(".doctors-list .doctor-card"), 0),
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".empty-state")),
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".error-message"))
        ));
    }
}
