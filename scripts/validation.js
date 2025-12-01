// Form validation settings for main website forms
const validationSettings = {
	formSelector: ".main__form",
	inputSelector: ".form-control",
	submitButtonSelector: "button[type='submit']",
	inputErrorClass: "form-control_type_error",
};

const hasInvalidInput = (inputList) => {
	return inputList.some((inputElement) => {
		return !inputElement.validity.valid;
	});
};

const disableSubmitButton = (buttonElement) => {
	buttonElement.disabled = true;
};

const enableSubmitButton = (buttonElement) => {
	buttonElement.disabled = false;
};

const toggleButtonState = (inputList, buttonElement) => {
	if (hasInvalidInput(inputList)) {
		disableSubmitButton(buttonElement);
	} else {
		enableSubmitButton(buttonElement);
	}
};

const showInputError = (formElement, inputElement, errorText, config) => {
	const errorMsgElement = formElement.querySelector(
		`#${inputElement.id}-error`
	);
	if (errorMsgElement) {
		errorMsgElement.textContent = errorText;
	} else if (inputElement.id) {
		// Log a warning if error element is missing for debugging
		console.warn(`Missing error span for input: ${inputElement.id}`);
	}
	inputElement.classList.add(config.inputErrorClass);
};

const hideInputError = (formElement, inputElement, config) => {
	const errorMsgElement = formElement.querySelector(
		`#${inputElement.id}-error`
	);
	if (errorMsgElement) {
		errorMsgElement.textContent = "";
	}
	inputElement.classList.remove(config.inputErrorClass);
};

const checkInputValidity = (formElement, inputElement, config) => {
	if (!inputElement.validity.valid) {
		showInputError(
			formElement,
			inputElement,
			inputElement.validationMessage,
			config
		);
	} else {
		hideInputError(formElement, inputElement, config);
	}
};

const setEventListeners = (formElement, config) => {
	const inputList = Array.from(
		formElement.querySelectorAll(config.inputSelector)
	);
	const buttonElement = formElement.querySelector(config.submitButtonSelector);

	if (buttonElement) {
		toggleButtonState(inputList, buttonElement);
	}

	inputList.forEach((inputElement) => {
		// Validate on input for real-time feedback
		inputElement.addEventListener("input", () => {
			if (buttonElement) {
				toggleButtonState(inputList, buttonElement);
			}
			checkInputValidity(formElement, inputElement, config);
		});

		// Also validate on blur for better UX when tabbing through fields
		inputElement.addEventListener("blur", () => {
			checkInputValidity(formElement, inputElement, config);
		});
	});
};

// Reset validation for a form (useful when forms are reset or closed)
const resetValidation = (formElement, config) => {
	const inputList = Array.from(
		formElement.querySelectorAll(config.inputSelector)
	);
	const buttonElement = formElement.querySelector(config.submitButtonSelector);

	inputList.forEach((inputElement) => {
		hideInputError(formElement, inputElement, config);
	});

	if (buttonElement) {
		disableSubmitButton(buttonElement);
	}
};

// Keep submit button enabled after a form submission error
// Call this function from your form submission handler when an error occurs
const keepButtonEnabledOnError = (formElement, config) => {
	const buttonElement = formElement.querySelector(config.submitButtonSelector);
	if (buttonElement) {
		enableSubmitButton(buttonElement);
	}
};

const enableValidation = (config) => {
	const formList = Array.from(document.querySelectorAll(config.formSelector));
	formList.forEach((formElement) => {
		setEventListeners(formElement, config);
	});
};

// Initialize validation when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	enableValidation(validationSettings);
});
