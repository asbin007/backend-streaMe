import { Request, Response } from "express";

/**
 * Embed URL builders, keyed by the `server` query parameter. Keeping these in a
 * lookup rather than a switch means the set of reachable hosts is a closed list
 * that matches the CSP `frameSrc` allowlist in `server.ts`.
 */
const SERVERS: Record<
	string,
	(id: string, season: string, episode: string, isMovie: boolean) => string
> = {
	vidsrc: (id, s, e, isMovie) =>
		isMovie
			? `https://vidsrc.xyz/embed/movie/${id}`
			: `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
	"vidsrc.to": (id, s, e, isMovie) =>
		isMovie
			? `https://vidsrc.to/embed/movie/${id}`
			: `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
	vidlink: (id, s, e, isMovie) =>
		isMovie
			? `https://vidlink.pro/movie/${id}`
			: `https://vidlink.pro/tv/${id}/${s}/${e}`,
	superembed: (id, s, e, isMovie) =>
		isMovie
			? `https://superembed.stream/e.php?id=${id}&tmdb=1`
			: `https://superembed.stream/e.php?id=${id}&tmdb=1&season=${s}&episode=${e}`,
	vidbinge: (id, s, e, isMovie) =>
		isMovie
			? `https://vidbinge.com/embed/movie/${id}`
			: `https://vidbinge.com/embed/tv/${id}/${s}/${e}`,
};

const DEFAULT_SERVER = "vidsrc";

/** TMDB ids, seasons, and episodes are always positive integers. */
const isNumericId = (value: unknown): value is string =>
	typeof value === "string" && /^\d{1,10}$/.test(value);

export const getStreamingUrl = async (req: Request, res: Response) => {
	try {
		const { mediaType, id } = req.params;
		const { season, episode, server } = req.query;

		if (mediaType !== "movie" && mediaType !== "tv") {
			return res
				.status(400)
				.json({ success: false, message: "Media type must be 'movie' or 'tv'" });
		}

		// These ids are interpolated straight into a third-party URL that the
		// client loads in an iframe, so they are validated rather than trusted.
		if (!isNumericId(id)) {
			return res
				.status(400)
				.json({ success: false, message: "A numeric media ID is required" });
		}

		const isMovie = mediaType === "movie";
		let seasonValue = "";
		let episodeValue = "";

		if (!isMovie) {
			seasonValue = String(season ?? "");
			episodeValue = String(episode ?? "");

			if (!isNumericId(seasonValue) || !isNumericId(episodeValue)) {
				return res.status(400).json({
					success: false,
					message: "Numeric season and episode are required for TV media",
				});
			}
		}

		const requestedServer = String(server ?? DEFAULT_SERVER);
		const build = SERVERS[requestedServer] ?? SERVERS[DEFAULT_SERVER];
		const resolvedServer = SERVERS[requestedServer]
			? requestedServer
			: DEFAULT_SERVER;

		const url = build(id, seasonValue, episodeValue, isMovie);

		res.status(200).json({ success: true, url, server: resolvedServer });
	} catch (error) {
		console.error("Error in getStreamingUrl controller", error);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
