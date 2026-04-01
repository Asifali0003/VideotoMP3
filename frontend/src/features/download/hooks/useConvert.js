import { convertAudio, getConversionStatus } from "../service/convert.api.js";

const useConvert = () => {

  const startConversion = async (url, setData, setLoading, setError, setProgress) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      setProgress(0);

      // 1. Start conversion
      const res = await convertAudio(url);

      // ✅ keep metadata
      setData(res);

      const jobId = res?.id;
      setProgress(10);

      if (!jobId) throw new Error("No job ID");

      // 2. Polling
      const interval = setInterval(async () => {
        const statusRes = await getConversionStatus(jobId);

        console.log("STATUS:", statusRes); // 🔥 debug

        setProgress((prev) => Math.min(prev + 10, 90));

        if (statusRes?.status === "completed") {
          // ✅ FIX: merge instead of replace
          setData((prev) => ({
            ...prev,
            ...statusRes,
          }));

          setLoading(false);
          clearInterval(interval);
        } else if (statusRes?.status === "failed") {
          setError("Conversion failed");
          setLoading(false);
          clearInterval(interval);
        }
      }, 2000);

    } catch (err) {
      setError(err.message || "Error");
      setLoading(false);
    }
  };

  return { startConversion };
};

export default useConvert;