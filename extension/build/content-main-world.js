(function() {
	var RVD_TIKTOK_BRIDGE_SOURCE_MAIN = "__rvd_tiktok_main__";
	//#endregion
	//#region src/core/content-main-world/tiktok-blob-download.ts
	async function runTikTokBlobDownload(payload) {
		const { mediaUrl, baseName } = payload;
		const res = await fetch(mediaUrl, {
			credentials: "include",
			mode: "cors",
			cache: "no-store"
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const blob = await res.blob();
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
	/** Isolated content forwards postMessage here; this dispatches bridge operations. */
	function wirePostMessageBridge() {
		window.addEventListener("message", (ev) => {
			if (ev.source !== window) return;
			const d = ev.data;
			if (d?.source !== "__rvd_tiktok_iso__") return;
			const token = String(d?.token ?? "");
			const op = d?.op;
			const payload = d?.payload;
			if (!token || !op) return;
			if (op === "fetch-buffer") {
				const mediaUrl = String(payload?.mediaUrl ?? "");
				if (!mediaUrl) {
					postFail(token, op, "Missing mediaUrl.");
					return;
				}
				fetch(mediaUrl, {
					credentials: "include",
					mode: "cors",
					cache: "no-store"
				}).then(async (res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					const buffer = await res.arrayBuffer();
					postOk(token, op, buffer, [buffer]);
				}).catch((err) => postFail(token, op, err));
				return;
			}
			if (op === "fetch-page-html") {
				const pageUrl = String(payload?.pageUrl ?? "");
				if (!pageUrl) {
					postFail(token, op, "Missing pageUrl.");
					return;
				}
				fetch(pageUrl, {
					credentials: "include",
					mode: "cors",
					cache: "no-store"
				}).then(async (res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					postOk(token, op, { html: await res.text() });
				}).catch((err) => postFail(token, op, err));
				return;
			}
			if (op === "blob-download") {
				const req = payload;
				if (!req?.mediaUrl || !req?.baseName) {
					postFail(token, op, "Missing mediaUrl or baseName.");
					return;
				}
				runTikTokBlobDownload(req).then(() => postOk(token, op, { ok: true })).catch((err) => postFail(token, op, err));
			}
		});
	}
	//#endregion
	//#region src/core/content-main-world/content-main-world.ts
	function initContentMainWorld() {
		wirePostMessageBridge();
	}
	//#endregion
	//#region src/app/content-main-world.ts
	initContentMainWorld();
	//#endregion
})();

//# sourceMappingURL=content-main-world.js.map