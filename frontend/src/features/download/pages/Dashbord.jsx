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

  // ✅ Force Download
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

      // ✅ After download
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

      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600 opacity-10 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-600 opacity-10 blur-[100px]" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 sm:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300">

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl mb-5 shadow-[0_8px_24px_rgba(99,102,241,0.4)]">
            🎵
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Video to MP3
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Paste a video URL and convert instantly
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
            🔗
          </span>
          <input
            type="text"
            placeholder="Paste video URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={data?.status === "completed"}
            className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.07] border border-white/10 text-slate-100 text-base placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 focus:bg-blue-500/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          />
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={loading || !url || data?.status === "completed"}
          className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mb-1
            ${loading || !url || data?.status === "completed"
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            }`}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" />
              Converting...
            </>
          ) : (
            "Convert"
          )}
        </button>

        {/* Progress Bar */}
        {loading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2 px-0.5">
              <span>Processing audio…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-3 overflow-hidden border border-white/[0.05]">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
            <span className="text-red-400 text-lg">❌</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Result Card */}
        {data && (
          <div className="mt-8 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

            {/* Thumbnail + Duration */}
            <div className="relative">
              <img
                src={data.thumbnail}
                alt="thumbnail"
                className="w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {data.duration && (
                <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-xl border border-white/10">
                  {formatDuration(data.duration)}
                </span>
              )}
            </div>

            {/* Info section */}
            <div className="p-6 sm:p-7">

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-4 line-clamp-2 leading-snug">
                {data.title}
              </h2>

              {/* Preparing status */}
              {data.status !== "completed" && (
                <div className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl py-3.5 mb-4">
                  <span className="text-yellow-400 animate-pulse text-lg">⏳</span>
                  <p className="text-yellow-400 text-sm font-medium">Preparing Audio...</p>
                </div>
              )}

              {/* Download Button */}
              {data.status === "completed" && data.fileUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-base tracking-wide transition-all duration-200 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  🎧 Download MP3
                </button>
              )}

              {/* Success message */}
              {downloaded && (
                <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-3.5">
                  <span className="text-emerald-400 text-lg">✅</span>
                  <p className="text-emerald-400 text-sm font-medium">Download Started!</p>
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