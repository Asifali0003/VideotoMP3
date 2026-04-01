import {createContext, useState} from 'react'
import useConvert  from './hooks/useConvert'


export const ConvertContext = createContext()

export const ConvertProvider = ({children }) => {
    const [url, setUrl] = useState("")
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [progress, setProgress] = useState(0)

    const { startConversion } = useConvert()

    const handleConvert = ()=> {
        if(!url) return setError("Please enter a video URL")
            startConversion(url,setData, setLoading, setError, setProgress)
    }
    

    return (
        <ConvertContext.Provider value= {{
            url, 
            setUrl, 
            data, 
            setData,
            loading, 
            error, 
            progress, 
            handleConvert
        }}
        >
            {children }
        </ConvertContext.Provider>
    )


}