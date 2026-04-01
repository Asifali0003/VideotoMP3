import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
})


export const convertAudio = async (url) => {
    try {
        const response = await api.post('/convert', { url });
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

export const getConversionStatus = async (id) => {
    try {
        const response = await api.get(`/convert/${id}`);    
        return response.data;
    } catch (error) {
        console.error(error);
    }
}   