import axios from "axios";

// ✅ use env variable from Vite
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false,
});

// 🎧 Convert video → audio request
export const convertAudio = async (url) => {
  try {
    const response = await api.post("/convert", { url });
    return response.data;
    
  } catch (error) {
    console.error("convertAudio error:", error.response?.data || error.message);
    console.log("❌ FULL ERROR:", error); // full object
    console.log("❌ RESPONSE:", error.response); 
    console.log("❌ DATA:", error.response?.data);
    console.log("❌ STATUS:", error.response?.status);
    throw error;
  }
};

// 📊 Get conversion status
export const getConversionStatus = async (id) => {
  try {
    const response = await api.get(`/status/${id}`);
    return response.data;
  } catch (error) {
    console.error("status error:", error.response?.data || error.message);
    throw error;
  }
};