import {useEffect, useRef} from 'react'
import {useAppContext, useItemApi} from "./AppContext.jsx"
import {Dialog, DialogContent, DialogTitle, LinearProgress} from "@mui/material"
import {host, apiToken} from "./utils.js"

export const ImportProgressDialog = () => {
    const {dialog, setDialog, importProgress, setImportProgress} = useAppContext()
    const {fetchItems} = useItemApi()
    const importProgressEventSourceRef = useRef(null)

    useEffect(() => {
        // create EventSource only once. EventSource can't send headers, so the
        // bearer token is passed as a query parameter (accepted only on /sse/*).
        const sseUrl = apiToken
            ? `${host}/sse/progress?token=${encodeURIComponent(apiToken)}`
            : `${host}/sse/progress`
        importProgressEventSourceRef.current = new EventSource(sseUrl)

        const handler = (e) => {
            const progress = JSON.parse(e.data).value
            console.log(progress)
            setImportProgress(progress)
            if (progress >= 100.0) {
                setDialog(prev => ({ ...prev, open: false }))
                fetchItems()
            }
        }

        importProgressEventSourceRef.current.addEventListener("progress", handler)

        return () => {
            // cleanup on unmount
            importProgressEventSourceRef.current.removeEventListener("progress", handler)
            importProgressEventSourceRef.current.close()
        }
    }, [])

    return (
        <Dialog
            open={ dialog.open }
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{ dialog.props.title }</DialogTitle>
            <DialogContent>
                <LinearProgress
                    variant="determinate"
                    value={ Number(importProgress) }
                    sx={{ width: '100%', height: 15, borderRadius: 1 }}
                />
            </DialogContent>
        </Dialog>
    )
}

export default ImportProgressDialog
