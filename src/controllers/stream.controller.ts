import { Request, Response } from "express";

export const getStreamingUrl = async (req: Request, res: Response) => {
	try {
		const { mediaType, id } = req.params;
		const { season, episode, server = "vidsrc" } = req.query;

		if (!mediaType || !id) {
			return res.status(400).json({ success: false, message: "Media type and ID are required" });
		}

		let url = "";

		switch (server) {
			case "vidsrc":
				if (mediaType === "movie") {
					url = `https://vidsrc.xyz/embed/movie/${id}`;
				} else {
					url = `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`;
				}
				break;

			case "vidsrc.to":
				if (mediaType === "movie") {
					url = `https://vidsrc.to/embed/movie/${id}`;
				} else {
					url = `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
				}
				break;

			case "vidlink":
				if (mediaType === "movie") {
					url = `https://vidlink.pro/movie/${id}`;
				} else {
					url = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
				}
				break;

			case "superembed":
				if (mediaType === "movie") {
					url = `https://superembed.stream/e.php?id=${id}&tmdb=1`;
				} else {
					url = `https://superembed.stream/e.php?id=${id}&tmdb=1&season=${season}&episode=${episode}`;
				}
				break;
            
            case "vidbinge":
                if (mediaType === "movie") {
                    url = `https://vidbinge.com/embed/movie/${id}`;
                } else {
                    url = `https://vidbinge.com/embed/tv/${id}/${season}/${episode}`;
                }
                break;

			default:
				// Fallback to vidsrc
				if (mediaType === "movie") {
					url = `https://vidsrc.xyz/embed/movie/${id}`;
				} else {
					url = `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`;
				}
				break;
		}

		res.status(200).json({ success: true, url, server });
	} catch (error: any) {
		console.log("Error in getStreamingUrl controller", error.message);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
