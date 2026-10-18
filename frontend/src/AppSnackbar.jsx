import { Alert, Snackbar } from '@mui/material'
import { useAppContext } from './AppContext.jsx'

export const AppSnackbar = () => {
    const { status, setStatus } = useAppContext()

    return (
        <Snackbar
            open={status.open}
            autoHideDuration={3000}
            onClose={() => setStatus(prev => ({...prev, open: false}))}
            anchorOrigin={{vertical: "bottom", horizontal: "right"}}
        >
            <Alert severity={status.severity} variant="filled" sx={{m: 1, width: "100%"}}>
                {status.message}
            </Alert>
        </Snackbar>
    )
}

export default AppSnackbar
