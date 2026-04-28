(function() {
	var RVD_TIKTOK_BRIDGE_SOURCE_MAIN = "__rvd_tiktok_main__";
	var RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST = "item-list-response";
	var RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML = "document-html-response";
	//#endregion
	//#region src/core/content-main-world/tiktok-main-world-bridge.ts
	async function fetchTikTokMediaOrThrow(mediaUrl) {
		const res = await fetch(mediaUrl, {
			credentials: "include",
			mode: "cors",
			cache: "no-store"
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res;
	}
	async function runTikTokBlobDownload(payload) {
		const { mediaUrl, baseName } = payload;
		const blob = await (await fetchTikTokMediaOrThrow(mediaUrl)).blob();
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = baseName;
		a.style.display = "none";
		(document.body ?? document.documentElement).appendChild(a);
		a.click();
		a.remove();
		window.setTimeout(() => URL.revokeObjectURL(blobUrl), 18e4);
	}
	function requestUrlFromFetchArg(input) {
		if (typeof input === "string") return input;
		if (input instanceof URL) return input.toString();
		return input.url;
	}
	function postBridgeEvent(type, data) {
		window.postMessage({
			source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
			type,
			timestamp: Date.now(),
			...data
		}, "*");
	}
	function postOk(token, op, data, transfer) {
		window.postMessage({
			source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
			token,
			op,
			ok: true,
			data
		}, "*", transfer);
	}
	function postFail(token, op, error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		window.postMessage({
			source: RVD_TIKTOK_BRIDGE_SOURCE_MAIN,
			token,
			op,
			ok: false,
			errorMessage
		}, "*");
	}
	var MAIN_WORLD_INTERCEPT_INSTALLED = "__rvdTikTokApiInterceptInstalled__";
	var HYDRATION_EMIT_DEBOUNCE_MS = 300;
	var hydrationEmitTimer = null;
	var lastHydrationPayload = "";
	function shouldCaptureTikTokItemListUrl(url) {
		if (!url || !/^https?:\/\//i.test(url)) return false;
		return /tiktok/i.test(url) && /item_list|itemlist|aweme\/v1\/feed/i.test(url);
	}
	function postApiItemListResponse(url, payload) {
		postBridgeEvent(RVD_TIKTOK_BRIDGE_EVENT_ITEM_LIST, {
			url,
			payload
		});
	}
	function postDocumentHtmlResponse(url, html) {
		postBridgeEvent(RVD_TIKTOK_BRIDGE_EVENT_DOCUMENT_HTML, {
			url,
			html
		});
	}
	function emitHydrationSnapshotFromDom() {
		const payload = document.querySelector("#__UNIVERSAL_DATA_FOR_REHYDRATION__")?.textContent?.trim();
		if (!payload) return;
		if (payload === lastHydrationPayload) return;
		lastHydrationPayload = payload;
		const html = `<html><head><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${payload}<\/script></head><body></body></html>`;
		postDocumentHtmlResponse(location.href, html);
	}
	function scheduleHydrationSnapshotFromDom() {
		if (hydrationEmitTimer !== null) clearTimeout(hydrationEmitTimer);
		hydrationEmitTimer = setTimeout(() => {
			hydrationEmitTimer = null;
			emitHydrationSnapshotFromDom();
		}, HYDRATION_EMIT_DEBOUNCE_MS);
	}
	function installTikTokApiResponseInterception() {
		const g = globalThis;
		if (g[MAIN_WORLD_INTERCEPT_INSTALLED] === true) return;
		g[MAIN_WORLD_INTERCEPT_INSTALLED] = true;
		emitHydrationSnapshotFromDom();
		new MutationObserver(() => {
			scheduleHydrationSnapshotFromDom();
		}).observe(document.documentElement, {
			childList: true,
			subtree: true,
			characterData: true
		});
		const originalFetch = window.fetch.bind(window);
		window.fetch = async (...args) => {
			const res = await originalFetch(...args);
			try {
				const reqUrl = requestUrlFromFetchArg(args[0]);
				if (shouldCaptureTikTokItemListUrl(reqUrl)) res.clone().json().then((json) => postApiItemListResponse(reqUrl, json)).catch(() => {});
			} catch {}
			return res;
		};
		const originalOpen = XMLHttpRequest.prototype.open;
		const originalSend = XMLHttpRequest.prototype.send;
		const xhrUrlKey = "__rvdTikTokXhrUrl__";
		XMLHttpRequest.prototype.open = function open(method, url, async, username, password) {
			this[xhrUrlKey] = String(url);
			return originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
		};
		XMLHttpRequest.prototype.send = function send(body) {
			this.addEventListener("loadend", () => {
				try {
					const reqUrl = this[xhrUrlKey] ?? "";
					if (!shouldCaptureTikTokItemListUrl(reqUrl)) return;
					if (this.responseType && this.responseType !== "text") return;
					if (typeof this.responseText !== "string" || !this.responseText.trim()) return;
					postApiItemListResponse(reqUrl, JSON.parse(this.responseText));
				} catch {}
			}, { once: true });
			return originalSend.call(this, body ?? null);
		};
	}
	function readMessageEnvelope(data) {
		const d = data;
		if (d?.source !== "__rvd_tiktok_iso__") return null;
		const token = String(d?.token ?? "");
		const op = d?.op;
		if (!token || !op) return null;
		return {
			token,
			op,
			payload: d?.payload
		};
	}
	function handleFetchBufferOp(token, op, payload) {
		const mediaUrl = String(payload?.mediaUrl ?? "");
		if (!mediaUrl) {
			postFail(token, op, "Missing mediaUrl.");
			return;
		}
		fetchTikTokMediaOrThrow(mediaUrl).then(async (res) => {
			const buffer = await res.arrayBuffer();
			postOk(token, op, buffer, [buffer]);
		}).catch((err) => postFail(token, op, err));
	}
	function handleBlobDownloadOp(token, op, payload) {
		const req = payload;
		if (!req?.mediaUrl || !req?.baseName) {
			postFail(token, op, "Missing mediaUrl or baseName.");
			return;
		}
		runTikTokBlobDownload(req).then(() => postOk(token, op, { ok: true })).catch((err) => postFail(token, op, err));
	}
	/** Isolated content forwards postMessage here; this dispatches bridge operations. */
	function wireTikTokMainWorldBridge() {
		installTikTokApiResponseInterception();
		window.addEventListener("message", (ev) => {
			if (ev.source !== window) return;
			const envelope = readMessageEnvelope(ev.data);
			if (!envelope) return;
			const { token, op, payload } = envelope;
			if (op === "fetch-buffer") {
				handleFetchBufferOp(token, op, payload);
				return;
			}
			if (op === "blob-download") handleBlobDownloadOp(token, op, payload);
		});
	}
	//#endregion
	//#region src/core/content-main-world/content-main-world.ts
	function initContentMainWorld() {
		wireTikTokMainWorldBridge();
	}
	//#endregion
	//#region src/app/content-main-world.ts
	initContentMainWorld();
	//#endregion
})();

//# sourceMappingURL=content-main-world.js.map