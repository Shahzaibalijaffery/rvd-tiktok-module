(function() {
	//#region src/module-config.ts
	var MODULE_NAME = "tiktok";
	var RUNTIME_MESSAGE_NAMESPACE = `module:${MODULE_NAME}`;
	//#endregion
	//#region src/core/constants.ts
	/** Content script endpoint for module runtime messages (must match `MODULE_NAME`). */
	var CONTENT_MESSAGE_PAGE = `content/${MODULE_NAME}`;
	//#endregion
	//#region src/system/lib/utils.ts
	function isPromise(value) {
		return value && typeof value.then === "function";
	}
	//#endregion
	//#region src/system/background.ts
	function onRuntimeMessage(listeners) {
		function hasListener(obj, key) {
			return key in obj;
		}
		chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
			const message = _message;
			if (typeof message.namespace === "undefined" || message.namespace !== RUNTIME_MESSAGE_NAMESPACE || typeof message.name === "undefined") return;
			const { name, data } = message;
			if (!hasListener(listeners, name)) {
				console.warn(`No listener for message namespace ${RUNTIME_MESSAGE_NAMESPACE} and name ${name}.`);
				return;
			}
			const listener = listeners[name];
			const response = listener(data, {
				sender,
				ok: (data) => ({
					error: false,
					data
				}),
				fail: (message) => ({
					error: true,
					message
				})
			});
			if (isPromise(response)) {
				response.then(sendResponse);
				return true;
			} else sendResponse(response);
		});
	}
	//#endregion
	//#region src/core/common/tiktok-cdn-url.ts
	/** Hostnames that expect TikTok first-party / cookie context when fetched. */
	function isTikTokMediaDownloadSourceUrl(url) {
		try {
			const u = new URL(url);
			if (u.protocol !== "https:" && u.protocol !== "http:") return false;
			const h = u.hostname.toLowerCase();
			if (/\.tiktokcdn\.com$/i.test(h) || /\.tiktokcdn-[^.]+\.com$/i.test(h)) return true;
			if (/\.tiktok\.com$/i.test(h)) return true;
			if (/\.tiktokv\.com$/i.test(h)) return true;
			if (/\.muscdn\.com$/i.test(h)) return true;
			if (/ies-music/i.test(h) && /tiktok|byte/i.test(h)) return true;
			return false;
		} catch {
			return false;
		}
	}
	//#endregion
	//#region src/core/background/background.ts
	var RE_INVALID_FILENAME = /invalid filename/i;
	var TAB_SEND_RETRIES = 5;
	var TAB_SEND_BASE_DELAY_MS = 120;
	function formatCaughtError(e) {
		if (e instanceof Error && typeof e.message === "string" && e.message.trim()) return e.message.trim();
		if (typeof e === "string") return e;
		if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
			const m = e.message.trim();
			if (m) return m;
		}
		try {
			return JSON.stringify(e);
		} catch {
			return String(e);
		}
	}
	async function resolveDownloadTargetTabId(explicit, sender) {
		if (typeof explicit === "number" && explicit >= 0) return explicit;
		if (typeof sender.tab?.id === "number") return sender.tab.id;
		const [t] = await chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		});
		return typeof t?.id === "number" ? t.id : void 0;
	}
	async function sleep(ms) {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}
	function isRetriableTabSendError(error) {
		const msg = error instanceof Error ? error.message : String(error);
		return msg.includes("Receiving end does not exist") || msg.includes("Could not establish connection") || msg.includes("message port closed");
	}
	async function sendTikTokBlobDownloadToTab(tabId, payload) {
		const message = {
			namespace: RUNTIME_MESSAGE_NAMESPACE,
			targetPage: CONTENT_MESSAGE_PAGE,
			name: "tikTok blob download",
			data: payload
		};
		let lastError;
		for (let attempt = 0; attempt < TAB_SEND_RETRIES; attempt++) try {
			if (attempt > 0) await sleep(TAB_SEND_BASE_DELAY_MS * attempt);
			const response = await chrome.tabs.sendMessage(tabId, message);
			if (response.error) throw new Error(response.message);
			return;
		} catch (e) {
			lastError = e;
			if (!isRetriableTabSendError(e) || attempt === TAB_SEND_RETRIES - 1) throw e;
		}
		throw lastError;
	}
	/** Asks the tab’s isolated content -> postMessage -> manifest MAIN-world script to fetch + blob-save. */
	async function downloadTikTokMediaViaMainWorld(tabId, mediaUrl, filenameHint) {
		const pageUrl = (await chrome.tabs.get(tabId)).url ?? "";
		if (!/tiktok\.com/i.test(pageUrl)) throw new Error("Keep the TikTok tab focused while downloading.");
		await sendTikTokBlobDownloadToTab(tabId, {
			mediaUrl,
			baseName: filenameHint && filenameHint.trim() ? filenameHint.replace(/^.*[/\\]/, "").replace(/[/\\?*:|"<>]/g, "_").slice(0, 180) : "video.mp4"
		});
	}
	async function initBackground() {
		onRuntimeMessage({
			"download": async ({ url, filename, saveAs, conflictAction, tabId: dataTabId }, { ok, fail, sender }) => {
				const saveAsResolved = typeof saveAs !== "undefined" ? saveAs : false;
				const buildDirectOptions = (withFilename) => {
					const o = {
						url,
						saveAs: saveAsResolved
					};
					if (withFilename && typeof filename === "string" && filename.length > 0) o.filename = filename;
					if (conflictAction) o.conflictAction = conflictAction;
					return o;
				};
				try {
					if (isTikTokMediaDownloadSourceUrl(url)) {
						const tabId = await resolveDownloadTargetTabId(dataTabId, sender);
						if (typeof tabId !== "number") return fail("No TikTok tab id available for main-world download.");
						try {
							await downloadTikTokMediaViaMainWorld(tabId, url, filename);
							return ok({ id: -1 });
						} catch (e) {
							return fail(formatCaughtError(e));
						}
					}
					return ok({ id: await chrome.downloads.download(buildDirectOptions(true)) });
				} catch (e) {
					const message = formatCaughtError(e);
					if (RE_INVALID_FILENAME.test(message) && filename) {
						console.warn("[RVD] Invalid filename, retrying without suggested name", {
							filename,
							url: url.slice(0, 120)
						});
						try {
							return ok({ id: await chrome.downloads.download(buildDirectOptions(false)) });
						} catch (e2) {
							console.error("[RVD] download failed (fallback)", formatCaughtError(e2), { url: url.slice(0, 120) });
							return fail(formatCaughtError(e2));
						}
					}
					console.error("[RVD] download failed", message, {
						url: url.slice(0, 120),
						filename
					});
					return fail(message);
				}
			},
			"open downloads folder": () => {
				chrome.downloads.showDefaultFolder();
			}
		});
	}
	//#endregion
	//#region src/app/background.ts
	initBackground().catch((error) => {
		console.error("[RVD] initBackground failed", error);
	});
	//#endregion
})();

//# sourceMappingURL=background.js.map