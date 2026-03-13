package pmf.imi.moodle;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class RegisterPage extends BasePageModel {
    public static final String REGISTER_URL = BasePageModel.BASE_URL + "/register";

    @FindBy(id = "jmbg")
    private WebElement jmbgField;

    @FindBy(id = "firstName")
    private WebElement firstNameField;

    @FindBy(id = "lastName")
    private WebElement lastNameField;

    @FindBy(id = "password")
    private WebElement passwordField;

    @FindBy(id = "confirmPassword")
    private WebElement confirmPasswordField;

    @FindBy(id = "homeAddress")
    private WebElement homeAddressField;

    @FindBy(id = "phoneNumber")
    private WebElement phoneNumberField;

    @FindBy(css = "button[type='submit']")
    private WebElement submitButton;

    @FindBy(css = ".error-message")
    private WebElement errorMessage;

    @FindBy(css = ".register-card h2")
    private WebElement pageHeading;

    @FindBy(css = ".login-link a")
    private WebElement loginLink;

    public RegisterPage(WebDriver driver) {
        super(driver);
    }

    public void setJmbg(String jmbg) {
        wait.until(ExpectedConditions.visibilityOf(jmbgField));
        jmbgField.clear();
        jmbgField.sendKeys(jmbg);
    }

    public void setFirstName(String firstName) {
        wait.until(ExpectedConditions.visibilityOf(firstNameField));
        firstNameField.clear();
        firstNameField.sendKeys(firstName);
    }

    public void setLastName(String lastName) {
        wait.until(ExpectedConditions.visibilityOf(lastNameField));
        lastNameField.clear();
        lastNameField.sendKeys(lastName);
    }

    public void setPassword(String password) {
        wait.until(ExpectedConditions.visibilityOf(passwordField));
        passwordField.clear();
        passwordField.sendKeys(password);
    }

    public void setConfirmPassword(String confirmPassword) {
        wait.until(ExpectedConditions.visibilityOf(confirmPasswordField));
        confirmPasswordField.clear();
        confirmPasswordField.sendKeys(confirmPassword);
    }

    public void setHomeAddress(String homeAddress) {
        wait.until(ExpectedConditions.visibilityOf(homeAddressField));
        homeAddressField.clear();
        homeAddressField.sendKeys(homeAddress);
    }

    public void setPhoneNumber(String phoneNumber) {
        wait.until(ExpectedConditions.visibilityOf(phoneNumberField));
        phoneNumberField.clear();
        phoneNumberField.sendKeys(phoneNumber);
    }

    public void clickSubmit() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton)).click();
    }

    public String getErrorMessage() {
        wait.until(ExpectedConditions.visibilityOf(errorMessage));
        return errorMessage.getText();
    }

    public String getHeadingText() {
        wait.until(ExpectedConditions.visibilityOf(pageHeading));
        return pageHeading.getText();
    }

    public String getTitle() {
        return driver.getTitle();
    }

    public void clickLoginLink() {
        wait.until(ExpectedConditions.elementToBeClickable(loginLink)).click();
    }

    public void fillRequiredFields(String jmbg, String firstName, String lastName, String password, String confirmPassword,
                                   String homeAddress, String phoneNumber) {
        setJmbg(jmbg);
        setFirstName(firstName);
        setLastName(lastName);
        setPassword(password);
        setConfirmPassword(confirmPassword);
        setHomeAddress(homeAddress);
        setPhoneNumber(phoneNumber);
    }
}
