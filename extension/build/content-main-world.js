(function() {
	var RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN = "__rvd_tiktok_main__";
	var RVD_TIKTOK_BLOB_MSG_TYPE_RESULT = "rvd-tiktok-blob-result";
	var RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT = "rvd-tiktok-fetch-buffer-result";
	//#endregion
	//#region src/core/content-main-world/tiktok-blob-download.ts
	var RVD_TIKTOK_MAIN_WORLD_GLOBAL = "__rvdTikTokBlobDownload";
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
	function installTikTokBlobDownloadMainWorld() {
		const g = globalThis;
		const key = RVD_TIKTOK_MAIN_WORLD_GLOBAL;
		if (typeof g[key] === "function") return;
		g[key] = runTikTokBlobDownload;
	}
	/** Isolated content forwards `postMessage` here; we reply when `fetch` + save finishes. */
	function wirePostMessageBridge() {
		window.addEventListener("message", (ev) => {
			if (ev.source !== window) return;
			const d = ev.data;
			if (d?.source !== "__rvd_tiktok_iso__") return;
			if (d?.type === "rvd-tiktok-fetch-buffer-request") {
				const token = String(d.token ?? "");
				const mediaUrl = String(d.mediaUrl ?? "");
				if (!mediaUrl) {
					window.postMessage({
						source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
						type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
						token,
						ok: false,
						errorMessage: "Missing mediaUrl."
					}, "*");
					return;
				}
				fetch(mediaUrl, {
					credentials: "include",
					mode: "cors",
					cache: "no-store"
				}).then(async (res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					const buffer = await res.arrayBuffer();
					window.postMessage({
						source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
						type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
						token,
						ok: true,
						buffer
					}, "*", [buffer]);
				}).catch((err) => {
					const errorMessage = err instanceof Error ? err.message : String(err);
					window.postMessage({
						source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
						type: RVD_TIKTOK_FETCH_BUF_MSG_TYPE_RESULT,
						token,
						ok: false,
						errorMessage
					}, "*");
				});
				return;
			}
			if (d?.type !== "rvd-tiktok-blob-request") return;
			const token = String(d.token ?? "");
			const payload = d.payload;
			const fn = globalThis[RVD_TIKTOK_MAIN_WORLD_GLOBAL];
			if (typeof fn !== "function") {
				window.postMessage({
					source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
					type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
					token,
					ok: false,
					errorMessage: "RVD TikTok main-world handler missing."
				}, "*");
				return;
			}
			fn(payload).then(() => {
				window.postMessage({
					source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
					type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
					token,
					ok: true
				}, "*");
			}).catch((err) => {
				const errorMessage = err instanceof Error ? err.message : String(err);
				window.postMessage({
					source: RVD_TIKTOK_BLOB_MSG_SOURCE_MAIN,
					type: RVD_TIKTOK_BLOB_MSG_TYPE_RESULT,
					token,
					ok: false,
					errorMessage
				}, "*");
			});
		});
	}
	//#endregion
	//#region src/core/content-main-world/content-main-world.ts
	function initContentMainWorld() {
		installTikTokBlobDownloadMainWorld();
		wirePostMessageBridge();
	}
	//#endregion
	//#region src/app/content-main-world.ts
	initContentMainWorld();
	//#endregion
})();

//# sourceMappingURL=content-main-world.js.map