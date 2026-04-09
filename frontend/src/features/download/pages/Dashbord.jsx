import { useContext, useState } from "react";
import { ConvertContext } from "../convert.context";

const Dashboard = () => {
  const {
    url,
    setUrl,
    data,
    setData,
    loading,
    error,
    progress,
    handleConvert,
  } = useContext(ConvertContext);

  const [downloaded, setDownloaded] = useState(false);

  // ✅ Format Duration (sec → h/m/s)
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // ✅ Download Handler
  const handleDownload = async () => {
    try {
      const response = await fetch(data.fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "audio.mp3";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setDownloaded(true);

      setTimeout(() => {
        setUrl("");
        setData(null);
        setDownloaded(false);
      }, 2000);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] text-white px-4 py-10 relative overflow-hidden">

      {/* Background */}
      <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600 opacity-10 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-600 opacity-10 blur-[100px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 sm:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl mb-5">
            🎵
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Video to MP3</h1>
          <p className="text-slate-500 mt-2">Paste a video URL and convert instantly</p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔗</span>
          <input
            type="text"
            placeholder="Paste video URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={data?.status === "completed"}
            className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.07] border border-white/10 text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleConvert}
          disabled={loading || !url || data?.status === "completed"}
          className={`w-full py-4 rounded-2xl font-bold ${
            loading || !url || data?.status === "completed"
              ? "bg-slate-700 text-slate-500"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
          }`}
        >
          {loading ? "Converting..." : "Convert"}
        </button>

        {/* Progress */}
        {loading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-3">
              <div
                className="h-3 bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="mt-8 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">

            {/* Thumbnail */}
            <div className="relative">
              {data.thumbnail ? (
                <img
                  src={data.thumbnail}
                  alt="thumbnail"
                  className="w-full object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-slate-800 text-slate-500">
                  No Preview Available
                </div>
              )}

              {/* Duration */}
              {data.duration && (
                <span className="absolute bottom-3 right-3 bg-black/70 px-3 py-1 rounded-lg text-sm">
                  {formatDuration(data.duration)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {data.title || "Untitled"}
              </h2>

              {/* Preparing */}
              {data.status !== "completed" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-3 text-center text-yellow-400 mb-4">
                  Preparing Audio...
                </div>
              )}

              {/* Download */}
              {data.status === "completed" && data.fileUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-xl bg-green-500 text-white font-bold"
                >
                  Download MP3
                </button>
              )}

              {/* Success */}
              {downloaded && (
                <div className="mt-4 text-center text-green-400">
                  Download Started!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-8">
          Fast · Private · Free · 320kbps
        </p>
      </div>
    </div>
  );
};

export default Dashboard;