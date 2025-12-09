// Character count tracker for all .main__text-character-count elements
window.addEventListener('authChecked', function () {
    // Default max character count if not set globally
    const DEFAULT_MAX = 500;
    // Find all character count elements
    const counters = document.querySelectorAll('.main__text-character-count');
    counters.forEach(function(counter) {
        // Find the nearest textarea or input[type="text"] above the counter
        let textbox = counter.previousElementSibling;
        while (textbox && !(textbox.tagName === 'TEXTAREA' || (textbox.tagName === 'INPUT' && textbox.type === 'text'))) {
            textbox = textbox.previousElementSibling;
        }
        if (!textbox) return;

        // Determine max character count
        let maxCount = window.MAX_CHARACTER_COUNT || parseInt(textbox.getAttribute('maxlength')) || DEFAULT_MAX;

        // Update the counter display
        function updateCount() {
            const current = textbox.value.length;
            counter.textContent = `${current}/${maxCount} characters`;
        }

        // Initial update
        updateCount();

        // Listen for input events
        textbox.addEventListener('input', updateCount);
    });
});
