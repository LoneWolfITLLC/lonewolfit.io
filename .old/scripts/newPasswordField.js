function meterPasswordStrength(input) {
  const password = input.value;
  let strengthContainer = input.closest("form")?.querySelector(
    "#passwordStrengthContainer"
  );
  let strengthBar = input.closest("form")?.querySelector("#passwordStrength");
  if (!strengthContainer)
    strengthContainer = document.getElementById("passwordStrengthContainer");
  if (!strengthBar) strengthBar = document.getElementById("passwordStrength");

  let strength = 0;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  const length = password.length;

  if (doesPasswordMeetCriteria(password)) {
    strength = 3;
  } else if (
    length >= 8 &&
    [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length > 3
  ) {
    strength = 2;
  } else if (
    length >= 6 &&
    [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length > 2
  ) {
    strength = 1;
  } else if (
    length > 0 &&
    [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length > 1
  ) {
    strength = 0;
  } else {
    strength = 0;
  }

  switch (strength) {
    case 0:
      strengthBar.style.width = "0%";
      break;
    case 1:
      strengthBar.className = "strength-weak";
      strengthBar.style.width = "10%";
      break;
    case 2:
      strengthBar.className = "strength-medium";
      strengthBar.style.width = "50%";
      break;
    case 3:
    case 4:
      strengthBar.className = "strength-strong";
      strengthBar.style.width = "100%";
      break;
  }
  if (strength > 0) strengthContainer.style.display = "block";
  else strengthContainer.style.display = "none";
}

function doesPasswordMeetCriteria(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  const length = password.length;

  // Strict criteria for "strong"
  return (
    length >= 10 &&
    length <= 50 &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSpecial
  );
}
