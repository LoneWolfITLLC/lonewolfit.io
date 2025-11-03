// Minimal Turnstile helper -- injects widget into contact forms and exposes token/reset helpers.
// Replace YOUR_TURNSTILE_SITE_KEY with your site key or call TurnstileHelper.init(siteKey) at runtime.

(function () {
	"use strict";

	const TURNSTILE_SITE_KEY = "0x4AAAAAAB8kxyyoaQQiRawt"; // <-- replace or call init()
	const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

	// map logical keys (eg "loggedOut","loggedIn") or form IDs -> widget ids
	const _widgetMap = {};
	const _pendingRenders = new WeakMap();
	let _siteKey = TURNSTILE_SITE_KEY;
	let _scriptLoaded = false;
	let _scriptLoading = false;
	let _onLoadQueue = [];

	function loadScript() {
		return new Promise((resolve) => {
			if (window.turnstile) {
				_scriptLoaded = true;
				return resolve();
			}
			if (_scriptLoaded) return resolve();
			if (_scriptLoading) {
				_onLoadQueue.push(resolve);
				return;
			}
			_scriptLoading = true;
			const existing = document.querySelector(`script[src^="${SCRIPT_SRC}"]`);
			if (existing) {
				existing.addEventListener("load", () => {
					_scriptLoaded = true;
					_scriptLoading = false;
					resolve();
					_onLoadQueue.forEach((cb) => cb());
					_onLoadQueue.length = 0;
				});
				existing.addEventListener("error", () => {
					_scriptLoading = false;
					resolve();
				});
				return;
			}
			const s = document.createElement("script");
			s.src = SCRIPT_SRC;
			s.async = true;
			s.defer = true;
			s.addEventListener("load", () => {
				_scriptLoaded = true;
				_scriptLoading = false;
				resolve();
				_onLoadQueue.forEach((cb) => cb());
				_onLoadQueue.length = 0;
			});
			s.addEventListener("error", () => {
				_scriptLoading = false;
				resolve();
			});
			document.head.appendChild(s);
		});
	}

	function injectWrapperBeforeSubmit(form) {
		if (!form) return null;
		const existing = form.querySelector(".cf-turnstile-wrapper");
		if (existing) return existing;
		const submitBtn = form.querySelector(
			'button[type="submit"], input[type="submit"]'
		);
		const wrapper = document.createElement("div");
		wrapper.className = "cf-turnstile-wrapper";
		// place before submit if possible
		if (submitBtn && submitBtn.parentNode)
			submitBtn.parentNode.insertBefore(wrapper, submitBtn);
		else form.appendChild(wrapper);
		return wrapper;
	}

	async function renderIntoForm(formOrId, keyName) {
		const form =
			typeof formOrId === "string"
				? document.getElementById(formOrId)
				: formOrId;
		if (!form) return null;

		// ensure there's exactly one wrapper per form
		const wrapper = injectWrapperBeforeSubmit(form);
		if (!wrapper) return null;

		// If already rendered, return existing mapping (avoid double render)
		const existingKey = wrapper.dataset.turnstileKey || form.id || keyName;
		if (wrapper.dataset.turnstileRendered === "1") {
			if (existingKey && _widgetMap[existingKey] != null)
				return _widgetMap[existingKey];
			return null;
		}

		// If a render is already in progress for this wrapper, await and return its result
		if (_pendingRenders.has(wrapper)) {
			try {
				return await _pendingRenders.get(wrapper);
			} catch (e) {
				_pendingRenders.delete(wrapper);
				return null;
			}
		}

		// Create a pending render promise and store it to prevent concurrent renders
		const pending = (async () => {
			await loadScript();
			if (!window.turnstile || typeof window.turnstile.render !== "function") {
				_pendingRenders.delete(wrapper);
				return null;
			}

			// If widget DOM already present, mark rendered and return existing mapping if any
			if (wrapper.querySelector(".cf-turnstile, iframe")) {
				wrapper.dataset.turnstileRendered = "1";
				const idKey = form.id || keyName || wrapper.dataset.turnstileKey;
				if (idKey && _widgetMap[idKey] != null) return _widgetMap[idKey];
				_pendingRenders.delete(wrapper);
				return null;
			}

			try {
				// perform actual render
				const wid = window.turnstile.render(wrapper, { sitekey: _siteKey });
				const mapKey =
					form.id ||
					keyName ||
					wrapper.dataset.turnstileKey ||
					Math.random().toString(36).slice(2);
				_widgetMap[mapKey] = wid;
				// store reference on wrapper for later lookup
				wrapper.dataset.turnstileKey = mapKey;
				// mark wrapper as rendered to prevent duplicate widgets
				wrapper.dataset.turnstileRendered = "1";
				_pendingRenders.delete(wrapper);
				return wid;
			} catch (err) {
				console.error("Turnstile render failed", err);
				_pendingRenders.delete(wrapper);
				return null;
			}
		})();

		_pendingRenders.set(wrapper, pending);

		try {
			return await pending;
		} catch (e) {
			_pendingRenders.delete(wrapper);
			return null;
		}
	}

	function getTokenForForm(formOrId) {
		const form =
			typeof formOrId === "string"
				? document.getElementById(formOrId)
				: formOrId;
		if (!form) return null;
		// first try hidden input injected by widget
		const input = form.querySelector('input[name="cf-turnstile-response"]');
		if (input && input.value) return input.value;
		// then try by wrapper dataset -> widget id -> turnstile.getResponse
		const wrapper = form.querySelector(".cf-turnstile-wrapper");
		let mapKey = (wrapper && wrapper.dataset.turnstileKey) || form.id;
		if (
			mapKey &&
			_widgetMap[mapKey] != null &&
			window.turnstile &&
			typeof window.turnstile.getResponse === "function"
		) {
			try {
				return window.turnstile.getResponse(_widgetMap[mapKey]) || null;
			} catch (e) {
				return null;
			}
		}
		// lastly try to search map for any widget tied to this form by heuristic
		for (const k in _widgetMap) {
			const wid = _widgetMap[k];
			try {
				const token = window.turnstile.getResponse(wid);
				if (token) return token;
			} catch (e) {
				/* ignore */
			}
		}
		return null;
	}

	function resetForForm(formOrId) {
		const form =
			typeof formOrId === "string"
				? document.getElementById(formOrId)
				: formOrId;
		if (!form || !window.turnstile) return;
		const wrapper = form.querySelector(".cf-turnstile-wrapper");
		const mapKey = (wrapper && wrapper.dataset.turnstileKey) || form.id;
		const wid = _widgetMap[mapKey];
		if (wid != null && typeof window.turnstile.reset === "function") {
			try {
				window.turnstile.reset(wid);
			} catch (e) {
				/* ignore */
			}
		}
	}

	async function renderIntoFormSafe(formOrId, keyName) {
		try {
			return await renderIntoForm(formOrId, keyName);
		} catch (e) {
			return null;
		}
	}
	// Public API attached to window for easy usage from other scripts
	window.TurnstileHelper = {
		init(siteKey) {
			if (siteKey) _siteKey = siteKey;
		},
		loadScript,
		renderIntoForm,
		renderIntoFormSafe,
		getTokenForForm,
		resetForForm,
		_widgetMap, // exposed for debugging
	};

	// Auto-init common contact forms when DOM ready or on custom event "authChecked"
	function _autoInit() {
		const outForm = document.getElementById("contactFormLoggedOut");
		const inForm = document.getElementById("contactFormLoggedIn");
        const residentialForm = document.getElementById("registerForm");
        const businessForm = document.getElementById("registerFormBusiness");
		const testimonialForm = document.getElementById("testimonialForm");

		if (!outForm && !inForm && !residentialForm && !businessForm && !testimonialForm) return;
		// try to render; errors are silent
		if (outForm && outForm.checkVisibility())
			renderIntoFormSafe(outForm, "loggedOut");
		if (inForm && inForm.checkVisibility())
			renderIntoFormSafe(inForm, "loggedIn");
        if (residentialForm) renderIntoFormSafe(residentialForm, "registerResidential");
        if (businessForm) renderIntoFormSafe(businessForm, "registerBusiness");
		if (testimonialForm) renderIntoFormSafe(testimonialForm, "testimonialForm");
	}

	// document.addEventListener("DOMContentLoaded", _autoInit); NO NEED TO RUN INIT
	window.addEventListener("authChecked", _autoInit);
})();
